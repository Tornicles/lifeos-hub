import { boolean, integer, jsonb, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  metadata: jsonb("metadata"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  tenantId: uuid("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  habitRemindersEnabled: boolean("habit_reminders_enabled").notNull().default(true),
  calendarAlertsEnabled: boolean("calendar_alerts_enabled").notNull().default(true),
  performanceAlertsEnabled: boolean("performance_alerts_enabled").notNull().default(true),
  projectAlertsEnabled: boolean("project_alerts_enabled").notNull().default(true),
  lifeEventAlertsEnabled: boolean("life_event_alerts_enabled").notNull().default(true),
  weeklyReportsEnabled: boolean("weekly_reports_enabled").notNull().default(true),
  monthlyReportsEnabled: boolean("monthly_reports_enabled").notNull().default(true),
  intensityLevel: text("intensity_level").default("normal"),
  maxNotificationsPerHour: integer("max_notifications_per_hour").default(10),
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferencesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
