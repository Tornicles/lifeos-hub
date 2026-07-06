# LifeOS

A personal life operating system — tracks habits, projects, calendar, and cross-domain "hub" metrics, with a rules-based automation engine that evaluates triggers and queues actions across the user's data.

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
- `artifacts/api-server` — Express API (`src/routes/*` — one file per domain: projects, habits, calendar, automation, metrics, hubs, notifications, tenants, admin, logs, systemState)
- `artifacts/api-spec` — OpenAPI spec + Orval-generated hooks/Zod schemas consumed by the frontend
- DB schema: `packages/db` (Drizzle)

## Architecture decisions

- Migrated from a Lovable.dev/Supabase app to the pnpm-workspace stack: all client-side Supabase calls were replaced with Orval-generated API hooks against the Express API server.
- Auth moved from Supabase Auth to Replit-managed Clerk; `requireAuth`/`getAuth` middleware on `api-server` gates all `/api/*` routes.
- All 18 original automation/AI functions (rule evaluation, ultra-score calculation, calendar autofill, notification generation, conflict resolution, etc.) were ported as Express route handlers under `/api/automation/*`, `/api/system/*`, `/api/calendar/autofill`, etc.

## Product

- Dashboard, Habits, Projects (with tasks), Calendar (with AI autofill), Logs, cross-domain "Ultra Hub" metrics, and an Automation engine (rules, trigger events, queue, execution history, conflict resolution) with supporting Settings/Notifications/Admin/Security pages.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `runTest` tool's `testClerkAuth` programmatic sign-in did not establish an authenticated session for this app in this environment despite the Clerk wiring matching the canonical pattern exactly (verified via full diff against the `clerk-auth` skill). Backend auth + business logic were instead verified directly via Clerk's Backend API (mint a real session JWT) + `curl` against `api-server`. See `.agents/memory/clerk-testclerkauth-e2e-limitation.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
