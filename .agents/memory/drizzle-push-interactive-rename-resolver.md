---
name: drizzle-kit push interactive rename resolver
description: How to run `drizzle-kit push` non-interactively when a migration drops many old tables/columns and adds similarly-named new ones.
---

`drizzle-kit push` requires a real TTY whenever it detects an ambiguous "was this table/column renamed, or dropped+created?" case. It refuses to run under piped stdin (`process.stdin.isTTY` check throws), and even wrapping it in `script` to fake a pty is fragile — the prompt count/order isn't stable across runs, so pre-feeding a fixed number of Enter keystrokes is unreliable and can accidentally confirm the wrong choice (e.g. "abort" on the final data-loss confirmation).

**Why:** During a schema migration that dropped ~10 tables and added ~20 new ones (plus new columns on a surviving table whose old columns were removed), `drizzle-kit push` paired unrelated old/new tables and columns as rename candidates purely by shape/type heuristics, generating dozens of interactive prompts with no reliable non-interactive answer path.

**How to apply:** Before running `drizzle-kit push`/`push-force`, manually drop the old tables (`DROP TABLE IF EXISTS x CASCADE`) and old columns (`ALTER TABLE t DROP COLUMN IF EXISTS c`) directly via SQL (`executeSql` tool) first, confirmed against the user's explicit drop list. With no ambiguous candidates left to match against, `drizzle-kit push` proceeds with zero prompts and applies cleanly. Only do this after the user has explicitly confirmed the exact list of tables/columns to drop — it is a destructive operation.
