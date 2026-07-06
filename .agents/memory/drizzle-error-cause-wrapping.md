---
name: Drizzle-orm wraps pg errors under `.cause`
description: How to correctly detect Postgres error codes (e.g. unique violation 23505) thrown from drizzle-orm queries.
---

drizzle-orm 0.4x wraps the underlying `pg` driver error in a `DrizzleQueryError`. The Postgres error code (e.g. `23505` for unique violation) is NOT on the top-level caught error's `.code` — it's on `error.cause.code`.

**Why:** A duplicate-key catch block written as `error.code === '23505'` will never match; the raw DB error/500 leaks to the client and any friendly-error-message logic silently never fires. This was only caught via a real integration request (curl), not by typecheck or unit-level review of the catch block.

**How to apply:** When checking for a specific Postgres error code after a drizzle query/transaction throws, check both `error.code` and `error.cause?.code`:

```ts
function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ((error as { code?: string }).code === "23505") return true;
  const cause = (error as { cause?: unknown }).cause;
  return Boolean(cause && typeof cause === "object" && (cause as { code?: string }).code === "23505");
}
```

Always verify DB-constraint-driven error branches (duplicate keys, FK violations, etc.) with a real end-to-end request against a running server — a code read of the catch block is not sufficient to confirm it actually matches.
