#!/usr/bin/env node
/**
 * Vercel preview deployment gate (Doc 12).
 * Runs only when VERCEL_TOKEN + org/project IDs are present as GitHub secrets.
 * Otherwise exits 0 with an explicit SKIPPED notice (not a fake deploy).
 */
import { spawnSync } from "node:child_process";

const token = process.env.VERCEL_TOKEN || "";
const org = process.env.VERCEL_ORG_ID || "";
const project = process.env.VERCEL_PROJECT_ID || "";

if (!token || !org || !project) {
  console.log(
    "SKIPPED: Vercel preview secrets are not configured " +
      "(VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID). " +
      "Add them as repository secrets to enable Doc 12 preview deployments. " +
      "This job does not fabricate a preview URL.",
  );
  process.exit(0);
}

const pull = spawnSync(
  "npx",
  ["vercel", "pull", "--yes", "--environment=preview", `--token=${token}`],
  { stdio: "inherit", shell: process.platform === "win32", env: process.env },
);
if ((pull.status ?? 1) !== 0) process.exit(pull.status ?? 1);

const build = spawnSync("npx", ["vercel", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

const deploy = spawnSync(
  "npx",
  ["vercel", "deploy", "--prebuilt", `--token=${token}`],
  { stdio: "inherit", shell: process.platform === "win32", env: process.env },
);
process.exit(deploy.status ?? 1);
