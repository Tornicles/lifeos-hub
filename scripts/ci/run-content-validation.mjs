#!/usr/bin/env node
/**
 * Content validation gate (Doc 12).
 * Honest skip until packages/content validators exist in this Vite monorepo.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const validatorPkg = path.join(root, "packages", "content", "package.json");
const scriptPath = path.join(root, "scripts", "validate-content.mjs");

if (!fs.existsSync(validatorPkg) && !fs.existsSync(scriptPath)) {
  console.log(
    "SKIPPED: No content validation tooling found (expected packages/content or " +
      "scripts/validate-content.mjs). Not inventing a placeholder validator.",
  );
  process.exit(0);
}

if (fs.existsSync(scriptPath)) {
  const result = spawnSync(process.execPath, [scriptPath], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

const result = spawnSync("pnpm", ["--filter", "./packages/content", "run", "validate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
