import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

const userIsolation = () =>
  pgPolicy("user_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: sql`user_id = current_setting('app.current_user_id', true)`,
    withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
  });

// A milestone worth celebrating (e.g. hitting a savings challenge goal),
// rendered client-side as a shareable image via the Web Share API.
export const shareableCardsTable = pgTable(
  "shareable_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    cardType: text("card_type").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertShareableCardSchema = createInsertSchema(shareableCardsTable).omit({ id: true, createdAt: true });
export type InsertShareableCard = z.infer<typeof insertShareableCardSchema>;
export type ShareableCard = typeof shareableCardsTable.$inferSelect;
