import { boolean, date, integer, numeric, pgPolicy, pgTable, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

const userIsolation = () =>
  pgPolicy("user_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: sql`user_id = current_setting('app.current_user_id', true)`,
    withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
  });

export const budgetsTable = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name"),
    category: text("category").notNull(),
    monthlyLimit: numeric("monthly_limit", { precision: 12, scale: 2 }).notNull(),
    period: text("period").notNull().default("monthly"),
    month: text("month").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation(), unique("budgets_user_category_month_unique").on(table.userId, table.category, table.month)],
).enableRLS();

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;

export const incomeTable = pgTable(
  "income",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    source: text("source").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    frequency: text("frequency").notNull().default("monthly"),
    receivedDate: date("received_date", { mode: "string" }).notNull(),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurrenceInterval: text("recurrence_interval"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertIncomeSchema = createInsertSchema(incomeTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof incomeTable.$inferSelect;

export const expensesTable = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    budgetId: uuid("budget_id").references(() => budgetsTable.id, { onDelete: "set null" }),
    description: text("description"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    category: text("category").notNull(),
    expenseDate: date("expense_date", { mode: "string" }).notNull(),
    merchant: text("merchant"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;

export const savingsGoalsTable = pgTable(
  "savings_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    targetDate: date("target_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;

export const debtsTable = pgTable(
  "debts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
    interestRate: numeric("interest_rate", { precision: 5, scale: 2 }),
    minimumPayment: numeric("minimum_payment", { precision: 12, scale: 2 }),
    dueDay: integer("due_day"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertDebtSchema = createInsertSchema(debtsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debtsTable.$inferSelect;

export const investmentEntriesTable = pgTable(
  "investment_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    accountName: text("account_name").notNull(),
    assetType: text("asset_type").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    entryDate: date("entry_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertInvestmentEntrySchema = createInsertSchema(investmentEntriesTable).omit({ id: true, createdAt: true });
export type InsertInvestmentEntry = z.infer<typeof insertInvestmentEntrySchema>;
export type InvestmentEntry = typeof investmentEntriesTable.$inferSelect;

export const netWorthSnapshotsTable = pgTable(
  "net_worth_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    snapshotDate: date("snapshot_date", { mode: "string" }).notNull(),
    totalAssets: numeric("total_assets", { precision: 14, scale: 2 }).notNull(),
    totalLiabilities: numeric("total_liabilities", { precision: 14, scale: 2 }).notNull(),
    netWorth: numeric("net_worth", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertNetWorthSnapshotSchema = createInsertSchema(netWorthSnapshotsTable).omit({ id: true, createdAt: true });
export type InsertNetWorthSnapshot = z.infer<typeof insertNetWorthSnapshotSchema>;
export type NetWorthSnapshot = typeof netWorthSnapshotsTable.$inferSelect;
