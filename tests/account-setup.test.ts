import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: vi.fn(),
}));
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";

beforeEach(() => vi.resetAllMocks());
it("existing athlete passes setup without any paid entitlement", async () => {
  vi.mocked(getCommercialContext).mockResolvedValue({
    status: 200,
    data: {
      accountSetupCompletedAt: "2026-01-01T00:00:00Z",
      entitlements: [],
      accountType: "ATHLETE",
      professionalVerification: null,
      crefVerificationRequired: true,
      professionalAccessGranted: false,
      systemRole: "USER",
      plan: null,
      subscription: null,
    },
    headers: new Headers(),
  });
  await expect(requireAccountSetup()).resolves.toBeUndefined();
});
it("OAuth account without completion goes to safe completion", async () => {
  vi.mocked(getCommercialContext).mockResolvedValue({
    status: 200,
    data: {
      accountSetupCompletedAt: null,
      entitlements: [],
      accountType: "ATHLETE",
      professionalVerification: null,
      crefVerificationRequired: true,
      professionalAccessGranted: false,
      systemRole: "USER",
      plan: null,
      subscription: null,
    },
    headers: new Headers(),
  });
  await expect(requireAccountSetup()).rejects.toThrow(
    "redirect:/auth/complete",
  );
});
it("unavailable context is not silently treated as an initialized account", async () => {
  vi.mocked(getCommercialContext).mockResolvedValue({
    status: 500,
    data: { error: "unavailable", code: "INTERNAL_SERVER_ERROR" },
    headers: new Headers(),
  });
  await expect(requireAccountSetup()).rejects.toThrow(
    "Não foi possível verificar sua conta.",
  );
});
