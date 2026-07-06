import { date, integer, pgTable, serial, text, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable, ultraDomainsTable } from "./hubs";
import { tenantsTable } from "./tenants";

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
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

export const ultraMetricsTable = pgTable("ultra_metrics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  domainId: integer("domain_id").references(() => ultraDomainsTable.id),
  name: text("name").notNull(),
  value: real("value").notNull(),
  metricDate: date("metric_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUltraMetricSchema = createInsertSchema(ultraMetricsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUltraMetric = z.infer<typeof insertUltraMetricSchema>;
export type UltraMetric = typeof ultraMetricsTable.$inferSelect;
