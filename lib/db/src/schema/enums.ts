import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "pending",
  "active",
  "revoked",
]);

export const appRoleEnum = pgEnum("app_role", [
  "owner",
  "member",
  "viewer",
  "guest",
  "admin",
]);
