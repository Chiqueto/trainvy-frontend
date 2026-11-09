import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fixtureEnvironment } from "../playwright.config";
export default function setup() {
  const apiDirectory = path.resolve(
    process.env.E2E_API_DIRECTORY || "../trainvy-api",
  );
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "tests/e2e/fixtures.ts"],
    {
      cwd: apiDirectory,
      env: { ...process.env, ...fixtureEnvironment },
      encoding: "utf8",
    },
  );
  const data = JSON.parse(output.trim().split(/\r?\n/).at(-1)!);
  fs.mkdirSync(".tmp", { recursive: true });
  fs.writeFileSync(".tmp/e2e-fixtures.json", JSON.stringify(data));
}
