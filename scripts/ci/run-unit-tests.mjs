#!/usr/bin/env node
/**
 * Runs the repo unit/integration suite when one exists.
 * Honest skip (exit 0) when no Vitest/Jest/Playwright config or test script is present.
 * This is intentionally NOT a silent no-op green check that pretends tests ran.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const markers = [
  "vitest.config.ts",
  "vitest.config.js",
  "vitest.config.mjs",
  "jest.config.js",
  "jest.config.ts",
  "jest.config.cjs",
  "playwright.config.ts",
  "playwright.config.js",
];

const hasMarker = markers.some((f) => fs.existsSync(path.join(root, f)));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const hasTestScript =
  typeof pkg.scripts?.test === "string" &&
  !/no test specified/i.test(pkg.scripts.test) &&
  pkg.scripts.test.trim() !== "";

if (!hasMarker && !hasTestScript) {
  console.log(
    "SKIPPED: No unit/integration test suite is configured in this repository yet " +
      "(no Vitest/Jest/Playwright config and no real package.json test script). " +
      "Doc 12 requires suites when they exist; Wave 1 does not invent a fake suite.",
  );
  process.exit(0);
}

const result = spawnSync("pnpm", ["run", "test"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});
process.exit(result.status ?? 1);
