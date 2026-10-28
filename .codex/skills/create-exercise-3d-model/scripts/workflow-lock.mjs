import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";

// Shared across linked worktrees. No timeout-based stealing of another chat's lock.
export function coordinate(action, repo, resource, owner) {
  if (!["acquire", "release"].includes(action)) throw new Error("Action: acquire | release");
  if (!/^(integration|exercise-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(resource)) throw new Error("Resource: integration | exercise-<uuid>");
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(owner)) throw new Error("Use a unique owner token of 8–100 alphanumeric/hyphen characters");
  const common = execFileSync("git", ["-C", repo, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8", windowsHide: true }).trim();
  const directory = join(common, "trainvy-3d-locks");
  const file = join(directory, `${resource}.json`);
  if (action === "acquire") {
    mkdirSync(directory, { recursive: true });
    const record = { owner, resource, host: hostname(), createdAt: new Date().toISOString() };
    try {
      writeFileSync(file, JSON.stringify(record, null, 2) + "\n", { flag: "wx" });
      return { acquired: true, ...record };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let holder;
      try { holder = JSON.parse(readFileSync(file, "utf8")); }
      catch { holder = { state: "metadata unavailable; lock is still held" }; }
      return { acquired: false, resource, holder };
    }
  }
  const record = JSON.parse(readFileSync(file, "utf8"));
  if (record.owner !== owner) throw new Error("Lock belongs to another chat; release refused");
  unlinkSync(file);
  return { released: true, resource };
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  try {
    const result = coordinate(...process.argv.slice(2));
    console.log(JSON.stringify(result));
    if (result.acquired === false) process.exitCode = 2;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
