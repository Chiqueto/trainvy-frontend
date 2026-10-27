import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  session: vi.fn(),
  headers: vi.fn(),
  account: vi.fn(),
  home: vi.fn(),
  train: vi.fn(),
  active: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: { getSession: mocks.session },
}));
vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: mocks.account,
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getHomeData: mocks.home,
  getUserTrainData: mocks.train,
  getActiveWorkoutSession: mocks.active,
  getCommercialContext: vi.fn(),
}));
vi.mock("@/app/_components/landing/landing-page", () => ({
  LandingPage: () => <h1>Trainvy landing</h1>,
}));
import Home from "@/app/page";
import { WebEntry } from "@/app/_components/landing/web-entry";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(new Headers());
  Object.defineProperty(navigator, "standalone", {
    value: false,
    configurable: true,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Public landing and installed application entry", () => {
  it("renders the public entry without requesting any private domain data", async () => {
    mocks.session.mockResolvedValue({ data: null });
    const result = await Home();
    expect(result.type).toBe(WebEntry);
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.account).not.toHaveBeenCalled();
    expect(mocks.home).not.toHaveBeenCalled();
    expect(mocks.train).not.toHaveBeenCalled();
    expect(mocks.active).not.toHaveBeenCalled();
  });

  it("shows marketing when an existing session has expired", async () => {
    mocks.headers.mockResolvedValue(
      new Headers({ cookie: "better-auth.session_token=expired" }),
    );
    mocks.session.mockResolvedValue({ data: null });
    expect((await Home()).type).toBe(WebEntry);
  });

  it("keeps marketing available when the API is unavailable for a guest", async () => {
    mocks.session.mockRejectedValue(new TypeError("fetch failed"));
    expect((await Home()).type).toBe(WebEntry);
  });

  it.each(["better-auth.session_token", "__Secure-better-auth.session_token"])(
    "preserves session errors when %s is present",
    async (name) => {
      const error = new TypeError("fetch failed");
      mocks.headers.mockResolvedValue(
        new Headers({ cookie: `${name}=existing-session` }),
      );
      mocks.session.mockRejectedValue(error);
      await expect(Home()).rejects.toBe(error);
    },
  );

  it("shows the landing in a regular browser", () => {
    render(<WebEntry />);
    expect(
      screen.getByRole("heading", { name: "Trainvy landing" }),
    ).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not confuse the 3D viewer fullscreen mode with a PWA installation", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("display-mode: fullscreen"),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    render(<WebEntry />);
    expect(screen.getByRole("heading", { name: "Trainvy landing" })).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("skips marketing for a standalone PWA", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    render(<WebEntry />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/auth"));
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("skips marketing in an existing iOS home-screen installation", async () => {
    Object.defineProperty(navigator, "standalone", {
      value: true,
      configurable: true,
    });
    render(<WebEntry />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/auth"));
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
