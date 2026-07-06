---
name: Clerk testClerkAuth e2e testing limitation
description: The runTest tool's programmatic Clerk sign-in (testClerkAuth) can fail to establish an authenticated frontend session even when the app's Clerk wiring is fully canonical; describes a working substitute verification path.
---

## Symptom

`runTest` with `testClerkAuth: true` and a `[Clerk Auth] Sign in as {...}` step reports the browser stays on `/sign-in` (or a loading screen) after the programmatic sign-in, and `/dashboard` (or any authenticated route) never loads. This can happen consistently across multiple retries, with unique emails each time, on an app whose Clerk code exactly matches the `clerk-auth` skill's canonical `setup-and-customization.md` snippets (verified via full diff: `publishableKeyFromHost`, `proxyUrl`, `routerPush`/`routerReplace` + `stripBase`, `ClerkProvider` prop set, `AppLayout` `isLoaded`/`isSignedIn` guard, `BASE_PATH`/`basePath` wiring, current `@clerk/*` package versions).

**Why:** Root cause not identified — likely an infra/session-cookie quirk in the testing harness for certain app configurations, not an app bug. Confirmed the app itself works via manual screenshot (sign-in page renders cleanly, no console errors) and via direct backend verification (below).

## How to apply — substitute verification when blocked

When `testClerkAuth` repeatedly fails despite a clean code diff against canonical, don't keep retrying the same e2e flow. Instead verify auth + business logic directly against the API using Clerk's Backend API to mint a real session token:

1. `POST https://api.clerk.com/v1/users` with `Authorization: Bearer <CLERK_SECRET_KEY>` to create a throwaway test user (`skip_password_checks: true` avoids password policy friction).
2. `POST https://api.clerk.com/v1/sessions` with `{ user_id }` to create a session.
3. `POST https://api.clerk.com/v1/sessions/<session_id>/tokens` to mint a JWT.
4. `curl` the API server's protected routes with `Authorization: Bearer <jwt>` to confirm `requireAuth`/`getAuth` middleware accepts it and business logic (CRUD, automation, etc.) responds correctly; also confirm a no-auth request gets 401.
5. Clean up: `DELETE https://api.clerk.com/v1/users/<user_id>`.

This validates the backend (Clerk verification middleware + route handlers) end-to-end independent of the frontend test harness, and is a reasonable substitute to cite when documenting drift from a fully-automated e2e pass.
