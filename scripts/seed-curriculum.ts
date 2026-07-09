/**
 * @deprecated Use `pnpm --filter @workspace/db run seed-curriculum` instead.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  "node",
  ["--experimental-strip-types", join(root, "lib/db/seed/seed-curriculum.ts")],
  { stdio: "inherit", cwd: root, env: process.env },
);
process.exit(result.status ?? 1);
