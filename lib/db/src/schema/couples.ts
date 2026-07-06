import { pgPolicy, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const couplesTable = pgTable(
  "couples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userAId: text("user_a_id").notNull(),
    userBId: text("user_b_id"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    pgPolicy("user_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`current_setting('app.current_user_id', true) in (${table.userAId}, ${table.userBId})`,
      withCheck: sql`current_setting('app.current_user_id', true) in (${table.userAId}, ${table.userBId})`,
    }),
  ],
).enableRLS();

export const insertCoupleSchema = createInsertSchema(couplesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCouple = z.infer<typeof insertCoupleSchema>;
export type Couple = typeof couplesTable.$inferSelect;

export const partnerLinksTable = pgTable(
  "partner_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id").notNull().references(() => couplesTable.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by").notNull(),
    inviteEmail: text("invite_email"),
    inviteCode: text("invite_code").notNull().unique(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    pgPolicy("user_isolation", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`invited_by = current_setting('app.current_user_id', true)`,
      withCheck: sql`invited_by = current_setting('app.current_user_id', true)`,
    }),
  ],
).enableRLS();

export const insertPartnerLinkSchema = createInsertSchema(partnerLinksTable).omit({ id: true, createdAt: true });
export type InsertPartnerLink = z.infer<typeof insertPartnerLinkSchema>;
export type PartnerLink = typeof partnerLinksTable.$inferSelect;

export const coupleDiscussionPromptsTable = pgTable("couple_discussion_prompts", {
  id: serial("id").primaryKey(),
  promptText: text("prompt_text").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCoupleDiscussionPromptSchema = createInsertSchema(coupleDiscussionPromptsTable).omit({ id: true, createdAt: true });
export type InsertCoupleDiscussionPrompt = z.infer<typeof insertCoupleDiscussionPromptSchema>;
export type CoupleDiscussionPrompt = typeof coupleDiscussionPromptsTable.$inferSelect;
