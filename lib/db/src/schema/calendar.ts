import { date, integer, pgTable, serial, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";
import { tenantsTable } from "./tenants";

export const calendarEntriesTable = pgTable("calendar_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  hubId: integer("hub_id").references(() => hubsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date", { mode: "string" }).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  focusDomain: text("focus_domain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCalendarEntrySchema = createInsertSchema(calendarEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalendarEntry = z.infer<typeof insertCalendarEntrySchema>;
export type CalendarEntry = typeof calendarEntriesTable.$inferSelect;
