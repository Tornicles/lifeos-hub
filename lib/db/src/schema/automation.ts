import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { hubsTable, ultraDomainsTable } from "./hubs";

export const automationRulesTable = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  conditionType: text("condition_type").notNull(),
  conditionValue: real("condition_value"),
  actionTarget: text("action_target").notNull(),
  actionValue: text("action_value"),
  conflictGroup: text("conflict_group"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").notNull().default(true),
  requiresUserConfirmation: boolean("requires_user_confirmation").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAutomationRuleSchema = createInsertSchema(automationRulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRulesTable.$inferSelect;

export const automationRuleConditionsTable = pgTable("automation_rule_conditions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull().references(() => automationRulesTable.id, { onDelete: "cascade" }),
  conditionType: text("condition_type").notNull(),
  metricName: text("metric_name"),
  operator: text("operator").notNull(),
  thresholdValue: real("threshold_value"),
  comparisonWindow: integer("comparison_window"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationRuleConditionSchema = createInsertSchema(automationRuleConditionsTable).omit({ id: true, createdAt: true });
export type InsertAutomationRuleCondition = z.infer<typeof insertAutomationRuleConditionSchema>;
export type AutomationRuleCondition = typeof automationRuleConditionsTable.$inferSelect;

export const automationRuleActionsTable = pgTable("automation_rule_actions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull().references(() => automationRulesTable.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  actionPayload: jsonb("action_payload"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationRuleActionSchema = createInsertSchema(automationRuleActionsTable).omit({ id: true, createdAt: true });
export type InsertAutomationRuleAction = z.infer<typeof insertAutomationRuleActionSchema>;
export type AutomationRuleAction = typeof automationRuleActionsTable.$inferSelect;

export const automationTriggerEventsTable = pgTable("automation_trigger_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  triggerType: text("trigger_type").notNull(),
  triggerSource: text("trigger_source").notNull(),
  triggerData: jsonb("trigger_data"),
  processed: boolean("processed").notNull().default(false),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationTriggerEventSchema = createInsertSchema(automationTriggerEventsTable).omit({ id: true, createdAt: true });
export type InsertAutomationTriggerEvent = z.infer<typeof insertAutomationTriggerEventSchema>;
export type AutomationTriggerEvent = typeof automationTriggerEventsTable.$inferSelect;

export const automationActionQueueTable = pgTable("automation_action_queue", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  ruleId: integer("rule_id").references(() => automationRulesTable.id),
  actionType: text("action_type").notNull(),
  actionPayload: jsonb("action_payload").notNull(),
  priority: integer("priority").default(0),
  status: text("status").notNull().default("pending"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export const insertAutomationActionQueueSchema = createInsertSchema(automationActionQueueTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAutomationActionQueue = z.infer<typeof insertAutomationActionQueueSchema>;
export type AutomationActionQueue = typeof automationActionQueueTable.$inferSelect;

export const automationLogsTable = pgTable("automation_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  ruleId: integer("rule_id").references(() => automationRulesTable.id),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").default("info"),
  contextData: jsonb("context_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationLogSchema = createInsertSchema(automationLogsTable).omit({ id: true, createdAt: true });
export type InsertAutomationLog = z.infer<typeof insertAutomationLogSchema>;
export type AutomationLog = typeof automationLogsTable.$inferSelect;

export const automationExecutionsTable = pgTable("automation_executions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  ruleId: integer("rule_id").references(() => automationRulesTable.id),
  triggerType: text("trigger_type").notNull(),
  conditionsMet: jsonb("conditions_met"),
  actionsExecuted: jsonb("actions_executed"),
  executionResult: text("execution_result"),
  executionDate: timestamp("execution_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationExecutionSchema = createInsertSchema(automationExecutionsTable).omit({ id: true, createdAt: true });
export type InsertAutomationExecution = z.infer<typeof insertAutomationExecutionSchema>;
export type AutomationExecution = typeof automationExecutionsTable.$inferSelect;

export const automationContextCacheTable = pgTable("automation_context_cache", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  cacheKey: text("cache_key").notNull(),
  cacheValue: jsonb("cache_value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutomationContextCacheSchema = createInsertSchema(automationContextCacheTable).omit({ id: true, createdAt: true });
export type InsertAutomationContextCache = z.infer<typeof insertAutomationContextCacheSchema>;
export type AutomationContextCache = typeof automationContextCacheTable.$inferSelect;

export const userAutomationSettingsTable = pgTable("user_automation_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  automationEnabled: boolean("automation_enabled").notNull().default(true),
  enabledCategories: jsonb("enabled_categories"),
  maxDailyActions: integer("max_daily_actions").default(20),
  priorityOverride: text("priority_override"),
  quietHours: jsonb("quiet_hours"),
  notificationPreferences: jsonb("notification_preferences"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export const insertUserAutomationSettingsSchema = createInsertSchema(userAutomationSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserAutomationSettings = z.infer<typeof insertUserAutomationSettingsSchema>;
export type UserAutomationSettings = typeof userAutomationSettingsTable.$inferSelect;

export const autoActionsTable = pgTable("auto_actions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  hubId: integer("hub_id").references(() => hubsTable.id),
  domainId: integer("domain_id").references(() => ultraDomainsTable.id),
  actionType: text("action_type").notNull(),
  actionText: text("action_text").notNull(),
  actionDate: timestamp("action_date", { withTimezone: true }).notNull().defaultNow(),
  priority: integer("priority").default(0),
  status: text("status").notNull().default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAutoActionSchema = createInsertSchema(autoActionsTable).omit({ id: true, createdAt: true });
export type InsertAutoAction = z.infer<typeof insertAutoActionSchema>;
export type AutoAction = typeof autoActionsTable.$inferSelect;
