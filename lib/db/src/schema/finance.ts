import { boolean, date, integer, numeric, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { habitsTable } from "./habits";
import { couplesTable } from "./couples";

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
    coupleId: uuid("couple_id").references(() => couplesTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("user_or_couple_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`user_id = current_setting('app.current_user_id', true) or (
        is_shared and couple_id is not null and current_setting('app.current_user_id', true) in (
          select user_a_id from couples where couples.id = couple_id
          union
          select user_b_id from couples where couples.id = couple_id
        )
      )`,
      withCheck: sql`user_id = current_setting('app.current_user_id', true) or (
        is_shared and couple_id is not null and current_setting('app.current_user_id', true) in (
          select user_a_id from couples where couples.id = couple_id
          union
          select user_b_id from couples where couples.id = couple_id
        )
      )`,
    }),
  ],
).enableRLS();

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;

// Lightweight contribution ledger for shared savings goals (who put in how
// much, not a full accounting system) — mirrors the minimal-ledger pattern
// used by shareable_cards rather than a full transaction log.
export const savingsGoalContributionsTable = pgTable(
  "savings_goal_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalId: uuid("goal_id").notNull().references(() => savingsGoalsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("goal_owner_or_partner", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`current_setting('app.current_user_id', true) in (
        select user_id from savings_goals where savings_goals.id = goal_id
        union
        select user_a_id from couples join savings_goals on savings_goals.couple_id = couples.id where savings_goals.id = goal_id and savings_goals.is_shared
        union
        select user_b_id from couples join savings_goals on savings_goals.couple_id = couples.id where savings_goals.id = goal_id and savings_goals.is_shared
      )`,
      withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
    }),
  ],
).enableRLS();
export const insertSavingsGoalContributionSchema = createInsertSchema(savingsGoalContributionsTable).omit({ id: true, createdAt: true });
export type InsertSavingsGoalContribution = z.infer<typeof insertSavingsGoalContributionSchema>;
export type SavingsGoalContribution = typeof savingsGoalContributionsTable.$inferSelect;

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
