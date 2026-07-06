import { boolean, date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  streak: integer("streak").notNull().default(0),
  lastCheckin: date("last_checkin", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;

export const habitCheckinsTable = pgTable("habit_checkins", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  done: boolean("done").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHabitCheckinSchema = createInsertSchema(habitCheckinsTable).omit({ id: true, createdAt: true });
export type InsertHabitCheckin = z.infer<typeof insertHabitCheckinSchema>;
export type HabitCheckin = typeof habitCheckinsTable.$inferSelect;
