import { db } from "./db";
import {
  users, transactions, loans,
  type User, type InsertUser,
  type Transaction, type InsertTransaction,
  type Loan, type InsertLoan
} from "@shared/schema";
import { eq, desc, or, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, newBalance: number): Promise<User>;
  updateUserCreditScore(id: number, newScore: number): Promise<User>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsForUser(userId: number): Promise<Transaction[]>;
  
  // Loan operations
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoansForUser(userId: number): Promise<Loan[]>;
  getActiveLoans(): Promise<Loan[]>;
  updateLoan(id: number, remainingAmount: number, status: string): Promise<Loan>;
  getLoan(id: number): Promise<Loan | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserBalance(id: number, newBalance: number): Promise<User> {
    const [updated] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserCreditScore(id: number, newScore: number): Promise<User> {
    const [updated] = await db.update(users)
      .set({ creditScore: newScore })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(transaction).returning();
    return newTx;
  }

  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(or(eq(transactions.fromUserId, userId), eq(transactions.toUserId, userId)))
      .orderBy(desc(transactions.createdAt));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    return newLoan;
  }

  async getLoansForUser(userId: number): Promise<Loan[]> {
    return await db.select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  async getActiveLoans(): Promise<Loan[]> {
    return await db.select()
      .from(loans)
      .where(eq(loans.status, "active"));
  }

  async updateLoan(id: number, remainingAmount: number, status: string): Promise<Loan> {
    const [updated] = await db.update(loans)
      .set({ remainingAmount, status })
      .where(eq(loans.id, id))
      .returning();
    return updated;
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }
}

export const storage = new DatabaseStorage();
