# LifeOS (Tech-Tate)

A personal life operating system — tracks habits, calendar, finance, learning (Academy), Bible study, and couples data, with a rules-based automation engine that evaluates triggers and queues actions across the user's data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/lifeos run dev` — run the LifeOS frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY` — Replit-managed Clerk auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: Replit-managed Clerk (`@clerk/react` on the `lifeos` frontend, `@clerk/express` on `api-server`)

## Where things live

- `artifacts/lifeos` — React + Vite frontend (pages, components, Clerk auth wiring in `src/App.tsx`)
- `artifacts/api-server` — Express API (`src/routes/*` — one file per domain: habits, calendar, automation, metrics, hubs, notifications, admin, logs)
- `artifacts/api-spec` — OpenAPI spec + Orval-generated hooks/Zod schemas consumed by the frontend
- DB schema: `packages/db` (Drizzle)

## Architecture decisions

- Migrated from a Lovable.dev/Supabase app to the pnpm-workspace stack: all client-side Supabase calls were replaced with Orval-generated API hooks against the Express API server.
- Auth moved from Supabase Auth to Replit-managed Clerk; `requireAuth`/`getAuth` middleware on `api-server` gates all `/api/*` routes.
- All 18 original automation/AI functions (rule evaluation, ultra-score calculation, calendar autofill, notification generation, conflict resolution, etc.) were ported as Express route handlers under `/api/automation/*`, `/api/system/*`, `/api/calendar/autofill`, etc.
- **Tech-Tate schema migration (2026-07-06):** replaced the multi-tenant projects/tasks/ultra-metrics schema with a single-user Tech-Tate schema. Dropped tables: `ultra_metrics`, `ultra_domains`, `state_warnings`, `system_state_daily`, `automation_context_cache`, `tasks`, `projects`, `memberships`, `tenants`, `auto_actions`. Removed `tenant_id`/`tenantId` from all surviving tables (this app is single-user; multi-tenancy concept is gone). Added six new schema domains: `finance` (budgets, income, expenses, savings_goals, debts, investment_entries, net_worth_snapshots), `academy` (topics, lessons, lesson_progress, quizzes, quiz_questions, quiz_attempts), `gamification` (challenges, challenge_completions, xp_events, badges, user_badges), `bible` (bible_verses — global content, no RLS), `couples` (couples, partner_links, couple_discussion_prompts), `subscriptions`. All new user-owned tables have real Postgres RLS (`current_setting('app.current_user_id', true)`) via a `withUserContext` transaction helper in `lib/db/src/index.ts`; shared catalog tables (badges, challenges, lessons, quizzes, quiz_questions, topics, bible_verses, couple_discussion_prompts) intentionally have no RLS. No CRUD routes exist yet for the new tables — `withUserContext` is wired but unused until those routes are built. `calendar_entries` gained bill columns (`amount`, `due_day`, `is_autopay`, `category`) instead of a separate `bills` table. Seeded the 4 hubs (Finance, Academy, Bible, Couples) into the `hubs` table.
- **Known degraded/dead frontend code from the above migration (not fixed — out of scope, frontend `.tsx` left untouched per instruction):** `CrossModuleAnalytics.tsx` and the Dashboard's automation-evaluate flow call `useListUltraMetrics()`/reference ultra-score fields that no longer exist server-side; `Automation.tsx` calls `useListAutoActions()` against a removed endpoint; `/insights` page and its route were deleted entirely; several hooks (`useMetrics.ts`, `useLogs.ts`, `useCalendar.ts`, `useNotifications.ts`) still pass/expect a `tenantId`/`tenant_id` field that server responses no longer include. These will need a follow-up frontend pass.

## Product

- Dashboard, Habits, Calendar (with AI autofill, now including bill tracking), Logs, cross-domain hub metrics (Finance/Academy/Bible/Couples), and an Automation engine (rules, trigger events, queue, execution history, conflict resolution) with supporting Settings/Notifications/Admin/Security pages. Finance/Academy/Gamification/Bible/Couples/Subscriptions data models exist in the DB with RLS but have no CRUD API routes or frontend UI yet.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `runTest` tool's `testClerkAuth` programmatic sign-in did not establish an authenticated session for this app in this environment despite the Clerk wiring matching the canonical pattern exactly (verified via full diff against the `clerk-auth` skill). Backend auth + business logic were instead verified directly via Clerk's Backend API (mint a real session JWT) + `curl` against `api-server`. See `.agents/memory/clerk-testclerkauth-e2e-limitation.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
