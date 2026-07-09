import { numeric, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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

export const marketWatchlistTable = pgTable(
  "market_watchlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    symbol: text("symbol").notNull(),
    name: text("name"),
    notes: text("notes"),
    targetPrice: numeric("target_price", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [userIsolation()],
).enableRLS();

export const insertMarketWatchlistSchema = createInsertSchema(marketWatchlistTable).omit({ id: true, createdAt: true });
export type InsertMarketWatchlist = z.infer<typeof insertMarketWatchlistSchema>;
export type MarketWatchlistEntry = typeof marketWatchlistTable.$inferSelect;
