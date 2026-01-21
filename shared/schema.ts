import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Simple password for simulation
  isAdmin: boolean("is_admin").default(false).notNull(),
  balance: integer("balance").default(100000).notNull(), // Stored in cents, starting with $1000.00
  creditScore: integer("credit_score").default(650).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id"), // Null for system credits/loans
  toUserId: integer("to_user_id"),     // Null for system debits/fines
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // transfer, fine, loan, repayment, salary
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  interestRate: integer("interest_rate").default(5), // Percentage
  status: text("status").default("active"), // active, paid, defaulted
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, createdAt: true, remainingAmount: true, status: true });

// === EXPLICIT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

// API Request/Response Types
export type LoginRequest = { username: string; password: string };
export type TransferRequest = { toUsername: string; amount: number; description?: string };
export type FineRequest = { userId: number; amount: number; description: string };
export type LoanRequest = { amount: number };

export type UserResponse = Omit<User, "password">;
