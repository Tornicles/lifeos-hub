import { date, integer, pgTable, serial, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  hubId: integer("hub_id").references(() => hubsTable.id),
  logDate: date("log_date", { mode: "string" }).notNull(),
  metric: text("metric"),
  value: real("value"),
  source: text("source").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLogSchema = createInsertSchema(logsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logsTable.$inferSelect;
