import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { subscriptionPlanEnum } from "./enums";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().unique(),
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    status: text("status").notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("user_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`user_id = current_setting('app.current_user_id', true)`,
      withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
    }),
  ],
).enableRLS();

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
