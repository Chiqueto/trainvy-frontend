import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithFeatureConsent } from "../app/_lib/feature-consent-transport";

const required = () =>
  Response.json(
    { code: "FEATURE_TERMS_REQUIRED", feature: "AI_WORKOUT" },
    { status: 428 },
  );
describe("AI consent transport", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("waits for the recorded acceptance and retries the original request once", async () => {
    let finish!: (accepted: boolean) => void;
    const consent = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(required())
      .mockResolvedValueOnce(new Response("generated"));
    vi.stubGlobal("fetch", fetcher);
    const request = {
      method: "POST",
      body: JSON.stringify({
        messages: [{ text: "gere treino" }],
        conversationId: "abc",
      }),
    };
    const response = fetchWithFeatureConsent("/ai", request, consent);
    await vi.waitFor(() => expect(consent).toHaveBeenCalledWith("AI_WORKOUT"));
    expect(fetcher).toHaveBeenCalledTimes(1);
    finish(true);
    expect(await (await response).text()).toBe("generated");
    expect(fetcher).toHaveBeenLastCalledWith("/ai", request);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("never retries on cancellation or a persistence failure", async () => {
    const fetcher = vi.fn().mockImplementation(async () => required());
    vi.stubGlobal("fetch", fetcher);
    await expect(
      fetchWithFeatureConsent("/ai", {}, async () => false),
    ).rejects.toThrow("FEATURE_TERMS_CANCELLED");
    await expect(
      fetchWithFeatureConsent("/ai", {}, async () => {
        throw new Error("database unavailable");
      }),
    ).rejects.toThrow("database unavailable");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("leaves ordinary chat responses alone", async () => {
    const result = new Response("explanation");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(result));
    const consent = vi.fn();
    expect(await fetchWithFeatureConsent("/ai", {}, consent)).toBe(result);
    expect(consent).not.toHaveBeenCalled();
  });
});
