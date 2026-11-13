import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  flags: vi.fn(),
  commercial: vi.fn(),
  save: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: () => "synthetic-session",
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getPublicAiAvailability: api.flags,
  getCommercialContext: api.commercial,
}));
vi.mock("@/app/admin/_actions/ai-availability", () => ({
  updateAiAvailabilityAction: api.save,
}));
import { loadAiAvailability } from "@/app/_actions/ai-availability";
import {
  AiAvailabilityProvider,
  AiFeature,
} from "@/app/_components/ai-availability-provider";
import { AiAvailabilityCard } from "@/app/admin/_components/ai-availability-card";
import { PlanningCreateMenu } from "@/app/planning/_components/planning-create-menu";

beforeEach(() => {
  vi.resetAllMocks();
  api.flags.mockResolvedValue({
    status: 200,
    data: { professionalAiEnabled: false, athleteAiEnabled: false },
  });
});
afterEach(cleanup);
describe("AI availability presentation", () => {
  it.each([
    [[], false, false],
    [["AI_CHAT"], true, false],
    [["AI_PLAN_GENERATION"], false, true],
  ])(
    "planning menu respects individual capabilities %j",
    async (entitlements, chat, planning) => {
      api.flags.mockResolvedValue({
        status: 200,
        data: { professionalAiEnabled: true, athleteAiEnabled: false },
      });
      api.commercial.mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
          entitlements: entitlements.map((key) => ({ key })),
        },
      });
      render(
        <AiAvailabilityProvider>
          <PlanningCreateMenu />
        </AiAvailabilityProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Novo" }));
      await waitFor(() => expect(api.commercial).toHaveBeenCalled());
      await waitFor(() => {
        expect(
          !!screen.queryByRole("menuitem", { name: /Gerar treino com IA/ }),
        ).toBe(chat);
        expect(
          !!screen.queryByRole("menuitem", { name: /Criar com IA \/ Ficha/ }),
        ).toBe(planning);
      });
      expect(
        screen.getByRole("menuitem", { name: /Novo plano/ }),
      ).toBeDefined();
    },
  );

  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    "resolves professional=%s and athlete=%s without crossing audiences",
    async (professionalAiEnabled, athleteAiEnabled) => {
      api.flags.mockResolvedValue({
        status: 200,
        data: { professionalAiEnabled, athleteAiEnabled },
      });
      for (const [accountType, enabled] of [
        ["COACH", professionalAiEnabled],
        ["ATHLETE", athleteAiEnabled],
      ] as const) {
        api.commercial.mockResolvedValue({
          status: 200,
          data: {
            accountType,
            entitlements: [{ key: "AI_CHAT" }, { key: "AI_PLAN_GENERATION" }],
          },
        });
        expect(await loadAiAvailability()).toMatchObject({
          accountType,
          enabled,
          chatEnabled: enabled,
          planningEnabled: enabled,
        });
      }
    },
  );
  it("does not show features absent from the active plan", async () => {
    api.flags.mockResolvedValue({
      status: 200,
      data: { professionalAiEnabled: true, athleteAiEnabled: true },
    });
    api.commercial.mockResolvedValue({
      status: 200,
      data: { accountType: "COACH", entitlements: [] },
    });
    expect(await loadAiAvailability()).toMatchObject({
      enabled: false,
      chatEnabled: false,
      planningEnabled: false,
    });
  });
  it("starts disabled and keeps manual content visible when loading fails", async () => {
    api.flags.mockRejectedValue(new Error("offline"));
    render(
      <AiAvailabilityProvider>
        <p>Planejamento manual</p>
        <AiFeature>
          <p>Coach AI</p>
        </AiFeature>
      </AiAvailabilityProvider>,
    );
    expect(screen.getByText("Planejamento manual")).toBeDefined();
    await waitFor(() => expect(api.flags).toHaveBeenCalled());
    expect(screen.queryByText("Coach AI")).toBeNull();
  });
  it("shows professional planning without offering it to the student audience", async () => {
    api.flags.mockResolvedValue({
      status: 200,
      data: { professionalAiEnabled: true, athleteAiEnabled: false },
    });
    api.commercial.mockResolvedValue({
      status: 200,
      data: {
        accountType: "COACH",
        entitlements: [{ key: "AI_PLAN_GENERATION" }],
      },
    });
    render(
      <AiAvailabilityProvider>
        <AiFeature capability="planning" audience="COACH">
          <p>Prescrever com IA</p>
        </AiFeature>
        <AiFeature audience="ATHLETE">
          <p>Aluno IA</p>
        </AiFeature>
        <AiFeature capability="chat">
          <p>Chat</p>
        </AiFeature>
      </AiAvailabilityProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("Prescrever com IA")).toBeDefined(),
    );
    expect(screen.queryByText("Aluno IA")).toBeNull();
    expect(screen.queryByText("Chat")).toBeNull();
  });
  it("admin saves the two independent flags and revision", async () => {
    api.save.mockResolvedValue({
      success: true,
      data: {
        professionalAiEnabled: true,
        athleteAiEnabled: false,
        revision: 1,
        updatedAt: null,
      },
    });
    render(
      <AiAvailabilityCard
        initial={{
          professionalAiEnabled: false,
          athleteAiEnabled: false,
          revision: 0,
          updatedAt: null,
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "IA para profissionais" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar disponibilidade da IA" }),
    );
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith({
        professionalAiEnabled: true,
        athleteAiEnabled: false,
        revision: 0,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("Configuração salva.")).toBeDefined(),
    );
  });
});
