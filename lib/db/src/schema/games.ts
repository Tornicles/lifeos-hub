import { integer, jsonb, pgPolicy, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { couplesTable } from "./couples";

// Shared catalog table (like `badges`/`topics`) — intentionally no RLS.
export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  mechanicType: text("mechanic_type").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;

const coupleIsolation = () =>
  pgPolicy("couple_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: sql`current_setting('app.current_user_id', true) in (
      select user_a_id from couples where couples.id = couple_id
      union
      select user_b_id from couples where couples.id = couple_id
    )`,
    withCheck: sql`current_setting('app.current_user_id', true) in (
      select user_a_id from couples where couples.id = couple_id
      union
      select user_b_id from couples where couples.id = couple_id
    )`,
  });

export const gameSessionsTable = pgTable(
  "game_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id").notNull().references(() => couplesTable.id, { onDelete: "cascade" }),
    gameId: integer("game_id").notNull().references(() => gamesTable.id, { onDelete: "cascade" }),
    initiatedBy: text("initiated_by").notNull(),
    status: text("status").notNull().default("in_progress"),
    result: jsonb("result"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [coupleIsolation()],
).enableRLS();
export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({
  id: true,
  status: true,
  result: true,
  completedAt: true,
  createdAt: true,
});
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;

export const gameResponsesTable = pgTable(
  "game_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    sessionId: uuid("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
    promptKey: text("prompt_key").notNull(),
    response: jsonb("response").notNull(),
    isCorrect: text("is_correct"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("couple_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`current_setting('app.current_user_id', true) in (
        select user_a_id from couples join game_sessions on game_sessions.couple_id = couples.id where game_sessions.id = session_id
        union
        select user_b_id from couples join game_sessions on game_sessions.couple_id = couples.id where game_sessions.id = session_id
      )`,
      withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
    }),
  ],
).enableRLS();
export const insertGameResponseSchema = createInsertSchema(gameResponsesTable).omit({ id: true, isCorrect: true, createdAt: true });
export type InsertGameResponse = z.infer<typeof insertGameResponseSchema>;
export type GameResponse = typeof gameResponsesTable.$inferSelect;
