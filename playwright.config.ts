import path from "node:path";
import { defineConfig } from "@playwright/test";

const apiDirectory = path.resolve(
  process.env.E2E_API_DIRECTORY || "../trainvy-api",
);
const api = "http://127.0.0.1:8181";
const web = "http://127.0.0.1:3100";
export const fixtureEnvironment = {
  NODE_ENV: "test",
  PORT: "8181",
  VERCEL: "",
  BETTER_AUTH_SECRET: "e2e-only-fictitious-auth-secret-not-for-deployment",
  API_BASE_URL: api,
  AUTH_BASE_URL: `${api}/api/auth`,
  WEB_APP_BASE_URL: web,
  ADDITIONAL_TRUSTED_ORIGINS: web,
  AUTH_COOKIE_DOMAIN: "",
} as const;
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90000,
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  use: {
    baseURL: web,
    channel: process.env.E2E_BROWSER_CHANNEL || "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node --import tsx src/index.ts",
      cwd: apiDirectory,
      url: `${api}/health/ready`,
      env: fixtureEnvironment,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      url: web,
      env: {
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: `${web}/backend`,
        BACKEND_ORIGIN: api,
        NEXT_PUBLIC_BASE_URL: web,
      },
      reuseExistingServer: false,
      timeout: 180000,
    },
  ],
});
