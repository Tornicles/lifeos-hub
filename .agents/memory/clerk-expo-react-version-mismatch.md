---
name: Clerk Expo/React version mismatch
description: @clerk/expo 2.x pulling an incompatible @clerk/react/@clerk/shared combo crashes ClerkProvider on web platform mount
---

`@clerk/expo` 2.x resolves to `@clerk/react@5.54.0`, which calls `loadClerkUiScript` from `@clerk/shared/loadClerkJsScript` — an export that does not exist in any published `@clerk/shared` 3.x or 4.x version. `ClerkProvider`'s `loadEntryChunks()` calls this unconditionally when the Expo app runs in browser mode, so the app crashes on mount with "Uncaught Error: loadClerkUiScript is not a function" before any sign-in UI renders. The crash is purely a frontend dependency issue — backend auth (password checks, account state) is unaffected.

**Why:** discovered while debugging a user-reported "can't sign in" issue on an Expo Router app; the sign-in screen and Clerk custom-UI code were both correct and matched canonical references exactly — the bug was invisible at the code level and only showed up as a runtime crash from a transitive dependency mismatch.

**How to apply:** if a Clerk-based Expo app fails to render (crashes on mount) specifically on the web platform target, check for a `@clerk/expo`/`@clerk/react`/`@clerk/shared` version mismatch first. Bump `@clerk/expo` to a version whose resolved `@clerk/react` major matches what any sibling web app in the same workspace already uses (so both apps share a working, already-tested `@clerk/shared` version). In this project, bumping `@clerk/expo` from `^2.13.0` to `^3.6.5` resolved it by aligning on `@clerk/react@^6.11.3` / `@clerk/shared@^4.23.0`, the same versions already used by the web frontend. The Expo Core v3 "future" API surface (`useSignIn`, `signIn.password()`, `signIn.mfa.sendEmailCode()`, `needs_client_trust` status) was unaffected by the major bump.
