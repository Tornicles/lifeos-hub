import { integer, jsonb, pgPolicy, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
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

// Shared catalog table (like `badges`/`topics`) — intentionally no RLS.
export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;

export const gameSessionsTable = pgTable(
  "game_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    gameId: integer("game_id").notNull().references(() => gamesTable.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();
export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({ id: true, createdAt: true });
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;

export const gameResponsesTable = pgTable(
  "game_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    sessionId: uuid("session_id").notNull().references(() => gameSessionsTable.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    response: jsonb("response"),
    isCorrect: text("is_correct"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();
export const insertGameResponseSchema = createInsertSchema(gameResponsesTable).omit({ id: true, createdAt: true });
export type InsertGameResponse = z.infer<typeof insertGameResponseSchema>;
export type GameResponse = typeof gameResponsesTable.$inferSelect;
