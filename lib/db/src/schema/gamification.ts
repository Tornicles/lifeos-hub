import { boolean, integer, jsonb, pgPolicy, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
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

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").notNull().default(0),
  category: text("category"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;

export const challengeCompletionsTable = pgTable(
  "challenge_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    challengeId: integer("challenge_id").notNull().references(() => challengesTable.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();
export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletionsTable).omit({ id: true, createdAt: true });
export type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;
export type ChallengeCompletion = typeof challengeCompletionsTable.$inferSelect;

export const xpEventsTable = pgTable(
  "xp_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    eventType: text("event_type").notNull(),
    xpAmount: integer("xp_amount").notNull(),
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();
export const insertXpEventSchema = createInsertSchema(xpEventsTable).omit({ id: true, createdAt: true });
export type InsertXpEvent = z.infer<typeof insertXpEventSchema>;
export type XpEvent = typeof xpEventsTable.$inferSelect;

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  iconName: text("icon_name"),
  criteria: jsonb("criteria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertBadgeSchema = createInsertSchema(badgesTable).omit({ id: true, createdAt: true });
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badgesTable.$inferSelect;

export const userBadgesTable = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    badgeId: integer("badge_id").notNull().references(() => badgesTable.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();
export const insertUserBadgeSchema = createInsertSchema(userBadgesTable).omit({ id: true, createdAt: true });
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadgesTable.$inferSelect;
