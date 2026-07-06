import { date, integer, pgTable, serial, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  hubId: integer("hub_id").references(() => hubsTable.id),
  name: text("name").notNull(),
  value: real("value").notNull(),
  metricDate: date("metric_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
