/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/planning",
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    toString: () => "",
  }),
}));

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: () => "mock-session-cookie",
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    fill,
    priority,
    ...props
  }: React.ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => {
    void fill;
    void priority;
    return <img {...props} />;
  },
}));

// Mock nuqs and ChatOpenButton so BottomNav renders without adapter error
vi.mock("nuqs", () => ({
  useQueryStates: () => [{}, vi.fn()],
  parseAsBoolean: { withDefault: () => ({}) },
  parseAsString: {},
}));

vi.mock("@/app/_components/chat-open-button", () => ({
  ChatOpenButton: () => <button aria-label="Abrir Chat">Chat</button>,
}));

vi.mock("@/app/planning/_actions", () => ({
  activateWorkoutPlanAction: vi.fn(),
  deactivateWorkoutPlanAction: vi.fn(),
  duplicateWorkoutPlanAction: vi.fn(),
  activatePeriodizationAction: vi.fn(),
  deactivatePeriodizationAction: vi.fn(),
  advancePeriodizationAction: vi.fn(),
  completePeriodizationAction: vi.fn(),
  createPeriodizationAction: vi.fn(),
  updatePeriodizationAction: vi.fn(),
  deletePeriodizationAction: vi.fn(),
  addWorkoutPlanToPeriodizationAction: vi.fn(),
  createWorkoutPlanInPeriodizationAction: vi.fn(),
  updatePeriodizationPlanAction: vi.fn(),
  removeWorkoutPlanFromPeriodizationAction: vi.fn(),
  reorderPeriodizationPlansAction: vi.fn(),
  createStandaloneWorkoutPlanAction: vi.fn(),
}));

// Mock auth client
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
  },
}));

// Mock API client
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getPlanningOverview: vi.fn(),
  getPeriodization: vi.fn(),
  getHomeData: vi.fn(),
  getUserTrainData: vi.fn(),
  getWorkoutPlan: vi.fn(),
  getActiveWorkoutSession: vi.fn(),
  listAthletePrescriptions: vi.fn().mockResolvedValue({ status: 200, data: [] }),
  getCommercialContext: vi.fn().mockResolvedValue({
    status: 200,
    data: {
      accountSetupCompletedAt: "2026-01-01T00:00:00Z",
      accountType: "ATHLETE",
      systemRole: "USER",
      entitlements: [],
    },
  }),
}));

import { authClient } from "@/app/_lib/auth-client";
import * as api from "@/app/_lib/api/fetch-generated";
import PlanningPage from "@/app/planning/page";
import PeriodizationDetailPage from "@/app/planning/periodizations/[id]/page";
import HomePage from "@/app/page";
import { BottomNav } from "@/app/_components/bottom-nav";

describe("Trainvy — Fase 2 / Task 2.5A: Hub de Planejamento, Navegação e Estados de Leitura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default authenticated session
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          name: "Lucas Silva",
          email: "lucas@trainvy.app",
        },
        session: {} as any,
      },
    } as any);

    // Default user train data (already onboarded)
    vi.mocked(api.getUserTrainData).mockResolvedValue({
      status: 200,
      data: {
        weightInGrams: 80000,
        heightInCentimeters: 180,
        age: 28,
        bodyFatPercentage: 15,
      },
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  describe("1. Planning Hub (/planning) — Contextos Ativos e Branding", () => {
    it("renderiza estado quando activeContext = NONE", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "NONE",
          },
          plans: [],
          periodizations: [],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      // Branding Trainvy
      expect(screen.getByText("Trainvy")).toBeDefined();

      // Header do Hub
      expect(
        screen.getByRole("heading", { name: "Rotinas de Treino" }),
      ).toBeDefined();
      expect(
        screen.getByText("Gerencie seus planos, divisões e ciclos de treino"),
      ).toBeDefined();

      // Seção Ativo Agora
      expect(screen.getByText("Rotina em Execução")).toBeDefined();
      expect(screen.getByText("Nenhum plano ativo no momento")).toBeDefined();
      expect(
        screen.getByText(
          "Ative um plano existente ou crie uma nova rotina personalizada para acompanhar seus treinos.",
        ),
      ).toBeDefined();
    });

    it("renderiza card de destaque quando activeContext = STANDALONE_PLAN", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "STANDALONE_PLAN",
            plan: {
              id: "plan-standalone-1",
              name: "Upper / Lower",
              workoutDaysCount: 7,
              createdAt: "2026-09-01T10:00:00.000Z",
            },
          },
          plans: [
            {
              id: "plan-standalone-1",
              name: "Upper / Lower",
              workoutDaysCount: 7,
              isActive: true,
              createdAt: "2026-09-01T10:00:00.000Z",
              periodization: null,
            },
          ],
          periodizations: [],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      expect(screen.getByText("PLANO ATUAL")).toBeDefined();
      expect(screen.getAllByText("Upper / Lower").length).toBeGreaterThan(0);
      expect(screen.getAllByText("7 dias")).toHaveLength(2);

      const viewPlanLink = screen.getByRole("link", {
        name: /Abrir rotina ativa/i,
      });
      expect(viewPlanLink.getAttribute("href")).toBe(
        "/workout-plans/plan-standalone-1",
      );
    });

    it("renderiza card de destaque quando activeContext = PERIODIZATION", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "PERIODIZATION",
            periodization: {
              id: "per-123",
              name: "Pré-Temporada",
              goal: "Preparação para o campeonato regional",
              startedAt: "2026-09-01T10:00:00.000Z",
              totalBlocks: 4,
              completedBlocks: 1,
              currentBlock: {
                id: "block-2",
                order: 2,
                workoutPlanId: "plan-block-2",
                workoutPlanName: "Força",
                activatedAt: "2026-09-29T10:00:00.000Z",
                plannedStartDate: "2026-10-01",
                plannedEndDate: "2026-10-28",
              },
            },
          },
          plans: [],
          periodizations: [],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      expect(screen.getByText("PERIODIZAÇÃO ATIVA")).toBeDefined();
      expect(screen.getByText("Pré-Temporada")).toBeDefined();
      expect(screen.getByText("Bloco atual: Força")).toBeDefined();
      expect(screen.getByText("Etapa 2 de 4")).toBeDefined();
      expect(screen.getByText("Previsto até 28/10")).toBeDefined();

      const viewPeriodizationLink = screen.getByRole("link", {
        name: /Ver ciclo completo/i,
      });
      expect(viewPeriodizationLink.getAttribute("href")).toBe(
        "/planning/periodizations/per-123",
      );
    });
  });

  describe("2. Seção 'Meus planos' e contextos associados", () => {
    it("renderiza lista de planos e identifica planos standalone vs planos em periodização", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "NONE",
          },
          plans: [
            {
              id: "plan-1",
              name: "Hipertrofia ABC",
              workoutDaysCount: 3,
              isActive: false,
              createdAt: "2026-09-01T10:00:00.000Z",
              periodization: null,
            },
            {
              id: "plan-2",
              name: "Força Máxima",
              workoutDaysCount: 5,
              isActive: true,
              createdAt: "2026-09-02T10:00:00.000Z",
              periodization: {
                id: "per-1",
                name: "Pré-Temporada Vôlei",
                periodizationPlanId: "pp-2",
                order: 2,
                status: "ACTIVE",
              },
            },
            {
              id: "plan-3",
              name: "Base Aeróbica",
              workoutDaysCount: 4,
              isActive: false,
              createdAt: "2026-09-03T10:00:00.000Z",
              periodization: {
                id: "per-1",
                name: "Pré-Temporada Vôlei",
                periodizationPlanId: "pp-1",
                order: 1,
                status: "COMPLETED",
              },
            },
            {
              id: "plan-4",
              name: "Potência",
              workoutDaysCount: 4,
              isActive: false,
              createdAt: "2026-09-04T10:00:00.000Z",
              periodization: {
                id: "per-1",
                name: "Pré-Temporada Vôlei",
                periodizationPlanId: "pp-3",
                order: 3,
                status: "PLANNED",
              },
            },
          ],
          periodizations: [],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      expect(screen.getByText("Hipertrofia ABC")).toBeDefined();
      expect(screen.getByText("3 dias")).toBeDefined();

      expect(screen.getByText("Força Máxima")).toBeDefined();
      const activeBlock = screen.getByRole("link", { name: /Força Máxima/i });
      expect(
        within(activeBlock).getByText("Pré-Temporada Vôlei"),
      ).toBeDefined();
      expect(activeBlock.textContent).toContain("(Etapa 2)");
      expect(screen.getByText("Em andamento")).toBeDefined();

      expect(screen.getByText("Base Aeróbica")).toBeDefined();
      expect(screen.getByText("Concluído")).toBeDefined();

      expect(screen.getByText("Potência")).toBeDefined();
      expect(screen.getByText("Planejado")).toBeDefined();
    });
  });

  describe("3. Seção 'Minhas periodizações' e badges de status", () => {
    it("renderiza periodizações nos status ACTIVE, PAUSED, DRAFT e COMPLETED", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "NONE",
          },
          plans: [],
          periodizations: [
            {
              id: "per-act",
              name: "Ciclo Hipertrofia",
              goal: "Ganho de massa",
              status: "ACTIVE",
              isActive: true,
              totalBlocks: 4,
              completedBlocks: 2,
              createdAt: "2026-09-01T10:00:00.000Z",
              startedAt: "2026-09-02T10:00:00.000Z",
              completedAt: null,
              currentBlock: {
                id: "block-3",
                order: 3,
                workoutPlanId: "wp-3",
                workoutPlanName: "Intensificação",
                activatedAt: "2026-09-10T10:00:00.000Z",
                plannedStartDate: null,
                plannedEndDate: null,
              },
            },
            {
              id: "per-pau",
              name: "Ciclo Definição",
              goal: "Perda de gordura",
              status: "PAUSED",
              isActive: false,
              totalBlocks: 3,
              completedBlocks: 1,
              createdAt: "2026-09-01T10:00:00.000Z",
              startedAt: "2026-09-02T10:00:00.000Z",
              completedAt: null,
              currentBlock: {
                id: "block-2",
                order: 2,
                workoutPlanId: "wp-2",
                workoutPlanName: "Cutting 2",
                activatedAt: "2026-09-10T10:00:00.000Z",
                plannedStartDate: null,
                plannedEndDate: null,
              },
            },
            {
              id: "per-dra",
              name: "Planejamento Futuro",
              goal: "Retorno aos treinos",
              status: "DRAFT",
              isActive: false,
              totalBlocks: 2,
              completedBlocks: 0,
              createdAt: "2026-09-01T10:00:00.000Z",
              startedAt: null,
              completedAt: null,
              currentBlock: null,
            },
            {
              id: "per-com",
              name: "Ciclo Finalizado",
              goal: "Preparação concluída",
              status: "COMPLETED",
              isActive: false,
              totalBlocks: 3,
              completedBlocks: 3,
              createdAt: "2026-09-01T10:00:00.000Z",
              startedAt: "2026-09-02T10:00:00.000Z",
              completedAt: "2026-09-30T10:00:00.000Z",
              currentBlock: null,
            },
          ],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      fireEvent.click(screen.getByRole("button", { name: /Periodizações/i }));

      // ACTIVE
      expect(screen.getByText("Ciclo Hipertrofia")).toBeDefined();
      expect(screen.getByText("ATIVA")).toBeDefined();
      expect(screen.getByText("2 de 4 etapas concluídas")).toBeDefined();

      // PAUSED
      expect(screen.getByText("Ciclo Definição")).toBeDefined();
      expect(screen.getByText("PAUSADA")).toBeDefined();
      expect(screen.getByText("Última etapa: Cutting 2")).toBeDefined();

      // DRAFT
      expect(screen.getByText("Planejamento Futuro")).toBeDefined();
      expect(screen.getByText("RASCUNHO")).toBeDefined();
      expect(screen.getByText("2 etapas")).toBeDefined();

      // COMPLETED
      expect(screen.getByText("Ciclo Finalizado")).toBeDefined();
      expect(screen.getByText("CONCLUÍDA")).toBeDefined();
      expect(screen.getByText("3 de 3 etapas executadas")).toBeDefined();
    });
  });

  describe("4. Estados Vazios e de Erro do Hub", () => {
    it("exibe empty states explicativos quando não há planos nem periodizações", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 200,
        data: {
          activeContext: {
            type: "NONE",
          },
          plans: [],
          periodizations: [],
        },
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      expect(
        screen.getByText("Nenhum plano de treino cadastrado"),
      ).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: /Periodizações/i }));
      expect(screen.getByText("Nenhuma periodização criada")).toBeDefined();
      expect(
        screen.getByText(
          "Periodizações organizam etapas e blocos de treino progressivos ao longo das semanas.",
        ),
      ).toBeDefined();
    });

    it("apresenta mensagem amigável em caso de erro no overview (500 ou INCONSISTENT_PLANNING_STATE)", async () => {
      vi.mocked(api.getPlanningOverview).mockResolvedValue({
        status: 500,
        data: null,
      } as any);

      const pageJsx = await PlanningPage();
      render(pageJsx);

      expect(
        screen.getByText("Não foi possível carregar seu planejamento."),
      ).toBeDefined();
      expect(
        screen.getByText(
          "Ocorreu uma instabilidade ao recuperar suas periodizações e planos. Tente novamente em instantes.",
        ),
      ).toBeDefined();
    });
  });

  describe("5. Detalhe Read-Only de Periodização (/planning/periodizations/[id])", () => {
    it("renderiza detalhes da periodização com vertical timeline e estados dos blocos", async () => {
      vi.mocked(api.getPeriodization).mockResolvedValue({
        status: 200,
        data: {
          id: "per-detail-1",
          name: "Pré-Temporada Vôlei",
          goal: "Preparação para o campeonato regional",
          notes: "Foco em pliometria e força explosiva",
          status: "ACTIVE",
          isActive: true,
          startedAt: "2026-09-01T10:00:00.000Z",
          completedAt: null,
          createdAt: "2026-08-30T10:00:00.000Z",
          updatedAt: "2026-09-01T10:00:00.000Z",
          plans: [
            {
              id: "block-1",
              periodizationId: "per-detail-1",
              workoutPlanId: "wp-1",
              order: 1,
              plannedStartDate: "2026-09-01",
              plannedEndDate: "2026-09-28",
              activatedAt: "2026-09-01T10:00:00.000Z",
              completedAt: "2026-09-28T10:00:00.000Z",
              notes: null,
              createdAt: "2026-08-30T10:00:00.000Z",
              updatedAt: "2026-09-28T10:00:00.000Z",
              workoutPlan: {
                id: "wp-1",
                name: "Base Aeróbica & Core",
                workoutDaysCount: 4,
              },
            },
            {
              id: "block-2",
              periodizationId: "per-detail-1",
              workoutPlanId: "wp-2",
              order: 2,
              plannedStartDate: "2026-09-29",
              plannedEndDate: "2026-10-25",
              activatedAt: "2026-09-29T10:00:00.000Z",
              completedAt: null,
              notes: "Aumentar cargas progressivamente",
              createdAt: "2026-08-30T10:00:00.000Z",
              updatedAt: "2026-09-29T10:00:00.000Z",
              workoutPlan: {
                id: "wp-2",
                name: "Força Pura",
                workoutDaysCount: 5,
              },
            },
            {
              id: "block-3",
              periodizationId: "per-detail-1",
              workoutPlanId: "wp-3",
              order: 3,
              plannedStartDate: "2026-10-26",
              plannedEndDate: "2026-11-20",
              activatedAt: null,
              completedAt: null,
              notes: null,
              createdAt: "2026-08-30T10:00:00.000Z",
              updatedAt: "2026-08-30T10:00:00.000Z",
              workoutPlan: {
                id: "wp-3",
                name: "Potência & Salto",
                workoutDaysCount: 4,
              },
            },
          ],
        },
      } as any);

      const pageJsx = await PeriodizationDetailPage({
        params: Promise.resolve({ id: "per-detail-1" }),
      });
      render(pageJsx);

      // Nome e objetivo
      expect(screen.getByText("Pré-Temporada Vôlei")).toBeDefined();
      expect(
        screen.getByText("Preparação para o campeonato regional"),
      ).toBeDefined();
      expect(screen.getAllByText("ATIVA").length).toBeGreaterThan(0);

      // Timeline dos blocos
      expect(screen.getByText("1.")).toBeDefined();
      expect(screen.getByText("Base Aeróbica & Core")).toBeDefined();
      expect(screen.getByText("Concluído")).toBeDefined();

      expect(screen.getByText("2.")).toBeDefined();
      expect(screen.getByText("Força Pura")).toBeDefined();
      expect(screen.getByText("Em andamento")).toBeDefined();
      expect(
        screen.getByText("Aumentar cargas progressivamente"),
      ).toBeDefined();

      expect(screen.getByText("3.")).toBeDefined();
      expect(screen.getByText("Potência & Salto")).toBeDefined();
      expect(screen.getByText("Planejado")).toBeDefined();

      // Link para o plano
      const planLinks = screen.getAllByRole("link", {
        name: /ver treinos do bloco/i,
      });
      expect(planLinks[1].getAttribute("href")).toBe("/workout-plans/wp-2");
    });
  });

  describe("6. BottomNav — Nova Navegação e Marcação de Planning", () => {
    it("aponta a segunda posição sempre para /planning com o rótulo 'Planejamento'", () => {
      render(<BottomNav activePage="planning" />);

      const planningLink = screen.getByRole("link", { name: /treinos/i });
      expect(planningLink.getAttribute("href")).toBe("/planning");
      // Verifica ícone ativo
      const planningIcon = planningLink.querySelector("svg");
      expect(planningIcon?.getAttribute("class")).toContain("text-foreground");
    });

    it("destaca 'Início' quando activePage='home' enquanto link de planejamento permanece /planning", () => {
      render(<BottomNav activePage="home" />);

      const homeLink = screen.getByRole("link", { name: /início/i });
      expect(homeLink.getAttribute("href")).toBe("/");
      const homeIcon = homeLink.querySelector("svg");
      expect(homeIcon?.getAttribute("class")).toContain("text-foreground");

      const planningLink = screen.getByRole("link", { name: /treinos/i });
      expect(planningLink.getAttribute("href")).toBe("/planning");
      const planningIcon = planningLink.querySelector("svg");
      expect(planningIcon?.getAttribute("class")).toContain(
        "text-muted-foreground",
      );
    });
  });

  describe("7. Home sem plano ativo (activeContext = NONE / activeWorkoutPlanId = null)", () => {
    it("não redireciona para /onboarding quando usuário já possui trainData mas está sem plano ativo", async () => {
      // Home data sem plano ativo (404 ou 200 com activeWorkoutPlanId null)
      vi.mocked(api.getHomeData).mockResolvedValue({
        status: 404,
        data: null,
      } as any);

      vi.mocked(api.getActiveWorkoutSession).mockResolvedValue({
        status: 200,
        data: null,
      } as any);

      const pageJsx = await HomePage();
      render(pageJsx);

      // Não chamou redirect para onboarding
      expect(mockRedirect).not.toHaveBeenCalledWith("/onboarding");

      // Mostra card amigável na Home
      expect(screen.getByText("Nenhum plano ativo")).toBeDefined();
      expect(
        screen.getByText(
          "Você pode iniciar um treino avulso ou organizar seu planejamento.",
        ),
      ).toBeDefined();

      // Botão para ir para o planejamento
      const toPlanningLink = screen.getByRole("link", {
        name: /ir para planejamento/i,
      });
      expect(toPlanningLink.getAttribute("href")).toBe("/planning");

      // Botão de treino avulso continua disponível
      expect(
        screen.getByRole("button", { name: /treino avulso/i }),
      ).toBeDefined();

      // Branding Trainvy na Home
      expect(screen.getByText("Trainvy")).toBeDefined();

      const historyLink = screen.getByRole("link", { name: /ver histórico/i });
      expect(historyLink.getAttribute("href")).toBe("/history");
    });

    it("redireciona para /onboarding SOMENTE quando faltam dados de treino iniciais (trainData vazio)", async () => {
      vi.mocked(api.getUserTrainData).mockResolvedValue({
        status: 200,
        data: null,
      } as any);

      await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/onboarding");
      expect(mockRedirect).toHaveBeenCalledWith("/onboarding");
    });
  });
});
