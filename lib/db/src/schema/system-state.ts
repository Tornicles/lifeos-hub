import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";
import { projectsTable } from "./projects";
import { habitsTable } from "./habits";
import { tenantsTable } from "./tenants";

export const systemStateDailyTable = pgTable("system_state_daily", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  stateDate: date("state_date", { mode: "string" }).notNull(),
  ultraScore: real("ultra_score").notNull(),
  state: text("state").notNull(),
  priorityZone: text("priority_zone"),
  strongestHubId: integer("strongest_hub_id").references(() => hubsTable.id),
  weakestHubId: integer("weakest_hub_id").references(() => hubsTable.id),
  stateReasons: jsonb("state_reasons"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSystemStateDailySchema = createInsertSchema(systemStateDailyTable).omit({ id: true, createdAt: true });
export type InsertSystemStateDaily = z.infer<typeof insertSystemStateDailySchema>;
export type SystemStateDaily = typeof systemStateDailyTable.$inferSelect;

export const stateWarningsTable = pgTable("state_warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  warningType: text("warning_type").notNull(),
  warningText: text("warning_text").notNull(),
  severity: text("severity").default("medium"),
  relatedHubId: integer("related_hub_id").references(() => hubsTable.id),
  relatedProjectId: integer("related_project_id").references(() => projectsTable.id),
  relatedHabitId: integer("related_habit_id").references(() => habitsTable.id),
  dismissed: boolean("dismissed").notNull().default(false),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStateWarningSchema = createInsertSchema(stateWarningsTable).omit({ id: true, createdAt: true });
export type InsertStateWarning = z.infer<typeof insertStateWarningSchema>;
export type StateWarning = typeof stateWarningsTable.$inferSelect;
