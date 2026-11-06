// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

import { GET } from "../app/api/push-config/route";

afterEach(() => vi.unstubAllEnvs());

it("reads the public key at request time without exposing secrets or caching", async () => {
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-test-value");
  vi.stubEnv("VAPID_PRIVATE_KEY", "private-test-value");
  vi.stubEnv("CRON_SECRET", "cron-test-value");
  const response = await GET();
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({ publicKey: "public-test-value" });

  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "updated-public-test-value");
  expect(await (await GET()).json()).toEqual({ publicKey: "updated-public-test-value" });
});

it("returns unavailable when the runtime public key is absent", async () => {
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", " ");
  const response = await GET();
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).not.toHaveProperty("publicKey");
});
