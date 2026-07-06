import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Runs `fn` inside a transaction with `app.current_user_id` set as a Postgres
 * session variable (via SET LOCAL, scoped to the transaction). Row-level
 * security policies on user-owned tables (see schema/finance.ts, academy.ts,
 * gamification.ts, couples.ts, subscriptions.ts) key off
 * `current_setting('app.current_user_id', true)`, so routes that read/write
 * those tables should run their queries through this helper for RLS to
 * actually be enforced at the DB layer (defense in depth alongside the
 * `req.userId` filters already applied in route handlers).
 *
 * Not yet wired into any route — no CRUD routes exist for the new tables
 * yet. Wire this in when those routes are built.
 */
export async function withUserContext<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx as unknown as typeof db);
  });
}

export * from "./schema";
