import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { db } from "./db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new SessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: 'keyboard cat' // In production, this should be an env var
    })
  );

  // Helper to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    // Simple password check for simulation
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const user = await storage.getUser(req.session.userId);
    res.json(user);
  });

  // User Routes
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    // Check if admin
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser?.isAdmin) {
      // Normal users can only see list for transfer purposes, maybe limit details?
      // For now, allow seeing names for transfers
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get(api.users.get.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Transaction Routes
  app.get(api.transactions.list.path, requireAuth, async (req, res) => {
    const txs = await storage.getTransactionsForUser(req.session.userId);
    res.json(txs);
  });

  app.post(api.transactions.transfer.path, requireAuth, async (req, res) => {
    const { toUserId, amount, description } = req.body;
    const fromId = req.session.userId;
    
    const sender = await storage.getUser(fromId);
    const receiver = await storage.getUser(toUserId);
    
    if (!sender || !receiver) {
      return res.status(400).json({ message: "Invalid user" });
    }
    
    if (sender.balance < amount) {
      return res.status(402).json({ message: "Insufficient funds" });
    }

    // Perform transfer
    await storage.updateUserBalance(fromId, sender.balance - amount);
    await storage.updateUserBalance(toUserId, receiver.balance + amount);
    
    const tx = await storage.createTransaction({
      fromUserId: fromId,
      toUserId: toUserId,
      amount,
      type: "transfer",
      description: description || "Money transfer"
    });

    res.status(201).json(tx);
  });

  app.post(api.transactions.fine.path, requireAuth, async (req, res) => {
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser?.isAdmin) {
      return res.status(403).json({ message: "Only admins can issue fines" });
    }

    const { userId, amount, description } = req.body;
    const targetUser = await storage.getUser(userId);
    
    if (!targetUser) {
      return res.status(400).json({ message: "User not found" });
    }

    await storage.updateUserBalance(userId, targetUser.balance - amount);
    
    // Admin fine penalty: -15 credit score
    await storage.updateUserCreditScore(userId, Math.max(300, targetUser.creditScore - 15));
    
    const tx = await storage.createTransaction({
      fromUserId: null, // System/Admin
      toUserId: userId, // Logic is: money taken FROM user
      amount: -amount,  // Or represent as negative? Let's keep amount positive but handle flow
      // Actually, standard logic: 
      // Transfer: from A to B. 
      // Fine: Money leaves User. So User is "from"? Or just a debit?
      // Let's model fine as: fromUserId = userId, toUserId = null (system).
      // But for display consistency, let's say amount is negative? 
      // Simpler: Just deduct balance, record transaction.
      // Let's say: fromUserId = userId, toUserId = null (system bank).
      type: "fine",
      description
    });
    // Wait, createTransaction schema expects amount. Let's record it.
    // Logic above: update balance -amount. 
    // Tx record: from=User, to=System.
    
    res.status(201).json(tx);
  });

  // Loan Routes
  app.get(api.loans.list.path, requireAuth, async (req, res) => {
    const loans = await storage.getLoansForUser(req.session.userId);
    res.json(loans);
  });

  app.post(api.loans.apply.path, requireAuth, async (req, res) => {
    const { amount } = req.body;
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Loan eligibility based on credit score
    // 300-500: Denied
    // 500-600: Max $50
    // 600-700: Max $200
    // 700-850: Max $500
    let maxLoan = 0;
    if (user.creditScore >= 700) maxLoan = 50000;
    else if (user.creditScore >= 600) maxLoan = 20000;
    else if (user.creditScore >= 500) maxLoan = 5000;

    if (amount > maxLoan) {
      return res.status(400).json({ 
        message: maxLoan === 0 
          ? "Your credit score is too low for a loan." 
          : `Based on your credit score, the maximum loan you can take is $${maxLoan / 100}.`
      });
    }

    // Give money
    await storage.updateUserBalance(userId, user.balance + amount);
    
    const loan = await storage.createLoan({
      userId,
      amount,
      remainingAmount: amount,
      interestRate: 5,
      status: "active"
    });
    
    await storage.createTransaction({
      fromUserId: null,
      toUserId: userId,
      amount,
      type: "loan_disbursal",
      description: `Loan #${loan.id} approved`
    });

    res.status(201).json(loan);
  });

  app.post(api.loans.repay.path, requireAuth, async (req, res) => {
    const { amount } = req.body;
    const loanId = Number(req.params.id);
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    const loan = await storage.getLoan(loanId);

    if (!user || !loan || loan.userId !== userId) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (user.balance < amount) {
      return res.status(402).json({ message: "Insufficient funds" });
    }

    const newRemaining = Math.max(0, loan.remainingAmount - amount);
    const status = newRemaining === 0 ? "paid" : "active";

    await storage.updateUserBalance(userId, user.balance - amount);
    await storage.updateLoan(loanId, newRemaining, status);
    
    // Improve credit score on repayment based on new rules
    // Pay loan on time/extra: +10 or +15. Let's simplify: 
    // If they pay at least 20% of original loan, it's "extra" (+15). Otherwise +10.
    const isExtra = amount >= (loan.amount * 0.2);
    const scoreBoost = isExtra ? 15 : 10;
    await storage.updateUserCreditScore(userId, Math.min(850, user.creditScore + scoreBoost));

    await storage.createTransaction({
      fromUserId: userId,
      toUserId: null,
      amount,
      type: "loan_repayment",
      description: `Repayment for Loan #${loan.id} (${isExtra ? "Extra payment" : "Standard payment"})`
    });

    const updatedLoan = await storage.getLoan(loanId);
    res.json(updatedLoan);
  });

  // Auto-pay Loans Feature
  setInterval(async () => {
    console.log("Running auto-pay service...");
    const activeLoans = await storage.getActiveLoans();
    
    for (const loan of activeLoans) {
      const user = await storage.getUser(loan.userId);
      if (!user) continue;

      // Calculate payment (e.g., 5% of original amount or $10 minimum)
      const paymentAmount = Math.min(loan.remainingAmount, Math.max(1000, Math.floor(loan.amount * 0.05)));
      
      if (user.balance >= paymentAmount) {
        const newRemaining = loan.remainingAmount - paymentAmount;
        const newStatus = newRemaining <= 0 ? "paid" : "active";

        await storage.updateUserBalance(user.id, user.balance - paymentAmount);
        await storage.updateLoan(loan.id, newRemaining, newStatus);
        
        await storage.createTransaction({
          fromUserId: user.id,
          toUserId: null,
          amount: paymentAmount,
          type: "loan_repayment",
          description: `Auto-pay for Loan #${loan.id}`
        });

        // Auto-pay works: +5
        await storage.updateUserCreditScore(user.id, Math.min(850, user.creditScore + 5));
        
        console.log(`Auto-paid ${paymentAmount} for user ${user.username} on loan #${loan.id}`);
      } else {
        // Auto-pay fails: -10
        await storage.updateUserCreditScore(user.id, Math.max(300, user.creditScore - 10));
        console.log(`Auto-pay failed for user ${user.username} - insufficient funds (-10 score)`);
      }
    }
  }, 1000 * 60 * 60); // Run every hour

  // Seed Data
  const existingUsersCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(existingUsersCount[0].count) <= 0) {
    console.log("Seeding database with new classroom accounts...");
    
    const admins = [
      { username: "Panda43", password: "Fox43" },
      { username: "Tiger72", password: "Bear72" },
      { username: "Eagle19", password: "Wolf19" },
      { username: "Shark88", password: "Dolphin88" },
    ];

    const normalUsers = [
      { username: "Lion12", password: "Cat12" },
      { username: "Zebra34", password: "Horse34" },
      { username: "Monkey56", password: "Banana56" },
      { username: "Rabbit21", password: "Carrot21" },
      { username: "Dog77", password: "Bone77" },
      { username: "Cat90", password: "Milk90" },
      { username: "Owl15", password: "Night15" },
      { username: "Frog62", password: "Pond62" },
      { username: "Snake48", password: "Grass48" },
      { username: "Turtle09", password: "Shell09" },
      { username: "Whale33", password: "Ocean33" },
      { username: "Penguin66", password: "Ice66" },
      { username: "Bee25", password: "Honey25" },
      { username: "Ant14", password: "Sugar14" },
      { username: "Cow81", password: "Milk81" },
      { username: "Pig52", password: "Mud52" },
      { username: "Duck07", password: "Pond07" },
      { username: "Horse68", password: "Hay68" },
      { username: "Goat39", password: "Grass39" },
      { username: "Koala44", password: "Tree44" },
      { username: "Panda11", password: "Bamboo11" },
      { username: "Fox59", password: "Den59" },
      { username: "Bear70", password: "Cave70" },
      { username: "Deer26", password: "Forest26" },
      { username: "Otter18", password: "River18" },
      { username: "Llama95", password: "Wool95" },
    ];

    for (const admin of admins) {
      await storage.createUser({
        ...admin,
        isAdmin: true,
        balance: 1000000,
        creditScore: 850
      });
    }

    for (const user of normalUsers) {
      await storage.createUser({
        ...user,
        isAdmin: false,
        balance: 100000, // Start with $1,000.00 (100,000 cents)
        creditScore: 650
      });
    }
    console.log(`Seeding complete: ${admins.length} Admins, ${normalUsers.length} Students created.`);
  }

  return httpServer;
}
