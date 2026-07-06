import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hubsTable = pgTable("hubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHubSchema = createInsertSchema(hubsTable).omit({ id: true, createdAt: true });
export type InsertHub = z.infer<typeof insertHubSchema>;
export type Hub = typeof hubsTable.$inferSelect;
