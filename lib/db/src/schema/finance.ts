import { boolean, date, integer, numeric, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { habitsTable } from "./habits";

const userIsolation = () =>
  pgPolicy("user_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: sql`user_id = current_setting('app.current_user_id', true)`,
    withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
  });

export const savingsGoalsTable = pgTable(
  "savings_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    targetDate: date("target_date", { mode: "string" }),
    isShared: boolean("is_shared").notNull().default(false),
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
    originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
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

// A user-created savings challenge (e.g. "No-Spend Week", "$500 in 30 Days").
// Backed by an auto-created habit so daily check-ins reuse the existing
// streak system (see lib/gamification.ts's Daily Challenge habit pattern).
export const savingsChallengesTable = pgTable(
  "savings_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    habitId: integer("habit_id").references(() => habitsTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
    savedAmount: numeric("saved_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    durationDays: integer("duration_days").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertSavingsChallengeSchema = createInsertSchema(savingsChallengesTable).omit({
  id: true,
  habitId: true,
  savedAmount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSavingsChallenge = z.infer<typeof insertSavingsChallengeSchema>;
export type SavingsChallenge = typeof savingsChallengesTable.$inferSelect;
