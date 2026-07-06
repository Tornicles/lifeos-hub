import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bibleVersesTable = pgTable("bible_verses", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull(),
  verseText: text("verse_text").notNull(),
  translation: text("translation").notNull().default("ESV"),
  theme: text("theme"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBibleVerseSchema = createInsertSchema(bibleVersesTable).omit({ id: true, createdAt: true });
export type InsertBibleVerse = z.infer<typeof insertBibleVerseSchema>;
export type BibleVerse = typeof bibleVersesTable.$inferSelect;
