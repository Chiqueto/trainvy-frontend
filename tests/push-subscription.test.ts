import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isCurrentlySubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/app/_lib/push-notifications";

const getRegistration = vi.fn();
const register = vi.fn();
const requestPermission = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission: "granted", requestPermission });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration, register, ready: new Promise(() => {}) },
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("push subscription recovery", () => {
  it("returns immediately when no service worker has been registered", async () => {
    getRegistration.mockResolvedValue(undefined);
    expect(await isCurrentlySubscribed()).toBe(false);
    expect(await unsubscribeFromPush()).toEqual({ success: true });
  });

  it("reports backend revocation failure without removing the browser subscription", async () => {
    const unsubscribe = vi.fn();
    getRegistration.mockResolvedValue({
      pushManager: {
        getSubscription: async () => ({
          endpoint: "https://push.example.test",
          unsubscribe,
        }),
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await unsubscribeFromPush();
    expect(result.success).toBe(false);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("bounds the service worker wait instead of leaving activation pending forever", async () => {
    vi.useFakeTimers();
    requestPermission.mockResolvedValue("granted");
    register.mockResolvedValue({});
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ publicKey: "test-public-key" }),
        }),
    );
    const result = subscribeToPush();
    await vi.advanceTimersByTimeAsync(10001);
    expect(await result).toEqual({
      success: false,
      error: expect.stringContaining("Recarregue a página"),
    });
    expect(register).toHaveBeenCalledWith("/sw.js");
  });
});
