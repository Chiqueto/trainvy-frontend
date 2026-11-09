import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fixtureEnvironment } from "../playwright.config";
export default function teardown() {
  if (!fs.existsSync(".tmp/e2e-fixtures.json")) return;
  const data = JSON.parse(fs.readFileSync(".tmp/e2e-fixtures.json", "utf8"));
  execFileSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "tests/e2e/fixtures.ts",
      "cleanup",
      ...Object.values(data.users).map((user) => (user as { id: string }).id),
      ...data.planIds,
    ],
    {
      cwd: path.resolve(process.env.E2E_API_DIRECTORY || "../trainvy-api"),
      env: { ...process.env, ...fixtureEnvironment },
      stdio: "pipe",
    },
  );
  fs.unlinkSync(".tmp/e2e-fixtures.json");
}
