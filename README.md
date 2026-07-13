# LifeOS (Tech-Tate)

A personal life operating system — habits, calendar, finance, Academy learning, Bible study, and couples tools.

## Stack

- **GitHub** — source control
- **Vercel** — frontend / serverless deploys
- **Supabase** — Postgres + Academy curriculum content
- **Clerk** — auth (`@clerk/react` on web, `@clerk/express` on API)
- pnpm workspaces, TypeScript, Express API, Vite React frontend

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev   # API (port 5000)
pnpm --filter @workspace/lifeos run dev       # Web app
```

Useful scripts:

- `pnpm run typecheck` — typecheck all packages
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI

## Required env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase client (Academy content) |

Mobile Expo builds also need `EXPO_PUBLIC_DOMAIN` (or `VERCEL_URL` when deploying on Vercel).

## Where things live

- `artifacts/lifeos` — React + Vite web app
- `artifacts/api-server` — Express API
- `artifacts/api-spec` — OpenAPI + Orval-generated clients
- `artifacts/lifeos-mobile` — Expo mobile app
- `supabase/` — Supabase migrations (Academy schema)
- `lib/db` — Drizzle schema used by the API server

## Deploy

Push to GitHub; Vercel builds the web app. Point env vars at your Supabase project and Clerk instance. Run Supabase migrations from `supabase/migrations` against your project as needed.
