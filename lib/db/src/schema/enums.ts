import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const appRoleEnum = pgEnum("app_role", [
  "owner",
  "member",
  "viewer",
  "guest",
  "admin",
]);
