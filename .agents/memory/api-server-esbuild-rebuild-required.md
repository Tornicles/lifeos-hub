---
name: api-server requires workflow restart after schema/codegen changes
description: Why a DB schema push or api-spec codegen run doesn't show up in live API responses until the api-server workflow is restarted.
---

`api-server`'s dev command (`pnpm --filter @workspace/api-server run dev`) runs `pnpm run build` (esbuild, one-shot bundle to `dist/index.mjs`) and then `pnpm run start` against that bundle — it does NOT watch/hot-reload source files. If you push a Drizzle schema change and/or regenerate `api-spec`/`api-zod` (new columns, new Zod fields) but only restart the `lifeos` frontend workflow, the running `api-server` process still serves responses built from the old bundle: new columns are silently absent from `GET`/`PATCH` JSON responses (Zod's `.parse()` strips fields not in the stale compiled schema) even though the DB and source files are correct.

**Why:** esbuild bundling is not a dev-server-with-HMR setup; the compiled `dist/` artifact is a point-in-time snapshot taken at workflow start.

**How to apply:** after any DB schema push or `api-spec`/`api-zod` codegen run, explicitly restart the `artifacts/api-server: API Server` workflow (not just the frontend) before verifying new fields via curl or the UI — otherwise you'll misdiagnose a stale-build symptom as a schema/route bug.
