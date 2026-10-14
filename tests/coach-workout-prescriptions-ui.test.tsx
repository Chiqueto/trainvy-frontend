/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import AthleteDetailsPage from "@/app/personal/alunos/[athleteId]/page";
import { CoachPrescriptionsList } from "@/app/personal/alunos/[athleteId]/_components/coach-prescriptions-list";
import { CoachPrescriptionBuilder } from "@/app/personal/alunos/[athleteId]/_components/coach-prescription-builder";
import { ReceivedPrescriptionsCard } from "@/app/planning/_components/received-prescriptions-card";
import {
  cancelPrescriptionAction,
  createPrescriptionDraftAction,
  sendPrescriptionAction,
} from "@/app/personal/_actions";
import {
  acceptPrescriptionAction,
  declinePrescriptionAction,
} from "@/app/planning/_actions";
import {
  getCoachAthleteDetails,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";

// Mocks
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT: ${url}`);
});
const mockNotFound = vi.fn().mockImplementation(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/personal/alunos/ath-1",
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

vi.mock("@/app/personal/_actions", () => ({
  cancelPrescriptionAction: vi.fn(),
  createPrescriptionDraftAction: vi.fn(),
  updatePrescriptionDraftAction: vi.fn(),
  sendPrescriptionAction: vi.fn(),
}));

vi.mock("@/app/planning/_actions", () => ({
  acceptPrescriptionAction: vi.fn(),
  declinePrescriptionAction: vi.fn(),
  activateWorkoutPlanAction: vi.fn(),
}));

vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: vi.fn(),
  getCoachAthleteDetails: vi.fn(),
  listCoachAthletePrescriptions: vi.fn(),
}));

vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn().mockResolvedValue({
    accountType: "COACH",
    accountSetupCompletedAt: "2026-01-01T00:00:00.000Z",
  }),
}));

vi.mock("nuqs", () => ({
  useQueryStates: () => [{}, vi.fn()],
  parseAsBoolean: { withDefault: () => ({}) },
  parseAsString: {},
}));

vi.mock("@/app/_components/chat-open-button", () => ({
  ChatOpenButton: () => <button aria-label="Abrir Chat">Chat</button>,
}));

describe("TASK 6.2B — Coach Workout Prescriptions UI & UX Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Correção de UX da Task 6.2A (Diferenciação 404 vs 403 vs 500)", () => {
    beforeEach(() => {
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
          entitlements: [{ key: "MANAGE_ATHLETES", limitValue: 5 }],
        },
      });
    });

    it("404 real: chama notFound() quando o aluno não for encontrado ou não tiver vínculo", async () => {
      (getCoachAthleteDetails as any).mockResolvedValue({
        status: 404,
        data: { error: "Aluno não encontrado ou vínculo inativo com este treinador." },
      });

      await expect(
        AthleteDetailsPage({
          params: Promise.resolve({ athleteId: "ath-inexistente" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });

    it("403: renderiza tela de Acesso Não Permitido sem mascarar como 404", async () => {
      (getCoachAthleteDetails as any).mockResolvedValue({
        status: 403,
        data: { error: "Acesso negado a este aluno." },
      });

      const Page = await AthleteDetailsPage({
        params: Promise.resolve({ athleteId: "ath-sem-permissao" }),
      });

      render(Page);

      expect(screen.getByText("Acesso Não Permitido")).toBeDefined();
      expect(screen.getByText(/Você não tem autorização para visualizar este aluno/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /voltar para alunos/i })).toBeDefined();
    });

    it("500 / Erro de Rede: exibe card de erro com RetryButton e NÃO dispara notFound()", async () => {
      (getCoachAthleteDetails as any).mockResolvedValue({
        status: 500,
        data: { error: "Internal Server Error" },
      });

      const Page = await AthleteDetailsPage({
        params: Promise.resolve({ athleteId: "ath-error" }),
      });

      render(Page);

      expect(screen.getByText("Falha ao carregar dados do aluno")).toBeDefined();
      expect(screen.getByText(/Não foi possível recuperar as informações/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeDefined();
    });
  });

  describe("2. Área do Personal — Treinos Prescritos e Ciclo de Vida", () => {
    const mockPrescriptions = [
      {
        id: "presc-1",
        coachId: "coach-1",
        athleteId: "ath-1",
        status: "DRAFT" as const,
        name: "Hipertrofia ABC - Iniciante",
        notes: "Planejamento inicial para adaptação neuromuscular",
        version: 1,
        payload: {
          days: [
            {
              dayOfWeek: 1,
              name: "Treino A - Peito e Tríceps",
              isRestDay: false,
              estimatedDurationMinutes: 50,
              exercises: [
                {
                  exerciseId: "ex-1",
                  name: "Supino Reto com Barra",
                  orderIndex: 0,
                  sets: 4,
                  warmupSets: 1,
                  reps: 10,
                  restSeconds: 90,
                },
              ],
            },
          ],
        },
        sentAt: null,
        respondedAt: null,
        acceptedWorkoutPlanId: null,
        createdAt: "2026-10-14T00:00:00.000Z",
        updatedAt: "2026-10-14T00:00:00.000Z",
      },
      {
        id: "presc-2",
        coachId: "coach-1",
        athleteId: "ath-1",
        status: "SENT" as const,
        name: "Força Pura 5x5",
        notes: "Foco em progressão de carga",
        version: 1,
        payload: {
          days: [],
        },
        sentAt: "2026-10-14T01:00:00.000Z",
        respondedAt: null,
        acceptedWorkoutPlanId: null,
        createdAt: "2026-10-14T00:30:00.000Z",
        updatedAt: "2026-10-14T01:00:00.000Z",
      },
    ];

    it("renderiza lista de prescrições com badges e links de navegação", () => {
      render(
        <CoachPrescriptionsList
          athleteId="ath-1"
          athleteName="Carlos Atleta"
          prescriptions={mockPrescriptions as any}
        />
      );

      expect(screen.getByText("Hipertrofia ABC - Iniciante")).toBeDefined();
      expect(screen.getByText("Força Pura 5x5")).toBeDefined();
      expect(screen.getByText("Rascunho")).toBeDefined();
      expect(screen.getByText("Enviado")).toBeDefined();

      // Botão Nova Prescrição
      const newBtn = screen.getByRole("button", { name: /nova prescrição/i });
      expect(newBtn.closest("a")?.getAttribute("href")).toBe("/personal/alunos/ath-1/prescrever");

      // Botão Editar Rascunho
      const editBtn = screen.getByRole("button", { name: /editar/i });
      expect(editBtn.closest("a")?.getAttribute("href")).toBe("/personal/alunos/ath-1/prescricoes/presc-1/editar");
    });

    it("abre modal de detalhes da prescrição ao clicar em 'Ver Detalhes'", () => {
      render(
        <CoachPrescriptionsList
          athleteId="ath-1"
          athleteName="Carlos Atleta"
          prescriptions={mockPrescriptions as any}
        />
      );

      const viewButtons = screen.getAllByRole("button", { name: /ver detalhes/i });
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText("Estrutura dos Treinos:")).toBeDefined();
      expect(screen.getByText("Prescrição para Carlos Atleta")).toBeDefined();
      expect(screen.getByText("Treino A - Peito e Tríceps")).toBeDefined();
      expect(screen.getByText("50 min")).toBeDefined();
      expect(screen.getByText("Supino Reto com Barra")).toBeDefined();
      expect(screen.getByText(/4x10 • 90s/i)).toBeDefined();
    });

    it("permite cancelar envio de prescrição com diálogo de confirmação", async () => {
      (cancelPrescriptionAction as any).mockResolvedValue({ success: true });

      render(
        <CoachPrescriptionsList
          athleteId="ath-1"
          athleteName="Carlos Atleta"
          prescriptions={mockPrescriptions as any}
        />
      );

      const cancelBtn = screen.getByRole("button", { name: /cancelar envio/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText("Confirmar Cancelamento")).toBeDefined();
      expect(screen.getByText(/Tem certeza que deseja cancelar esta prescrição/i)).toBeDefined();

      const confirmBtn = screen.getByRole("button", { name: "Cancelar Prescrição" });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(cancelPrescriptionAction).toHaveBeenCalledWith({
          id: "presc-2",
          athleteId: "ath-1",
        });
      });
    });
  });

  describe("3. Construtor de Prescrição (CoachPrescriptionBuilder)", () => {
    const validInitialData = {
      name: "Planejamento Força 2026",
      workoutDays: [
        {
          name: "Treino A - Peito",
          isRest: false,
          estimatedDurationInSeconds: 3000,
          exercises: [
            {
              name: "Supino Reto com Barra",
              sets: 4,
              warmupSets: 1,
              reps: 10,
              restTimeInSeconds: 90,
            },
          ],
        },
      ],
    };

    it("permite salvar rascunho com dias e exercícios validados", async () => {
      (createPrescriptionDraftAction as any).mockResolvedValue({
        success: true,
        data: { id: "presc-new" },
      });

      render(
        <CoachPrescriptionBuilder
          athleteId="ath-1"
          athleteName="Carlos Atleta"
          initialData={validInitialData}
        />
      );

      // Clica em Salvar Rascunho
      const saveDraftBtn = screen.getByRole("button", { name: /salvar rascunho/i });
      fireEvent.click(saveDraftBtn);

      await waitFor(() => {
        expect(createPrescriptionDraftAction).toHaveBeenCalledWith(
          expect.objectContaining({
            athleteId: "ath-1",
            name: "Planejamento Força 2026",
          })
        );
      });
    });

    it("permite salvar e enviar diretamente ao atleta", async () => {
      (createPrescriptionDraftAction as any).mockResolvedValue({
        success: true,
        data: { id: "presc-sent" },
      });
      (sendPrescriptionAction as any).mockResolvedValue({
        success: true,
      });

      render(
        <CoachPrescriptionBuilder
          athleteId="ath-1"
          athleteName="Carlos Atleta"
          initialData={validInitialData}
        />
      );

      // Clica em Salvar e Enviar
      const sendBtn = screen.getByRole("button", { name: /salvar e enviar ao aluno/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(createPrescriptionDraftAction).toHaveBeenCalledWith(
          expect.objectContaining({
            athleteId: "ath-1",
            name: "Planejamento Força 2026",
          })
        );
        expect(sendPrescriptionAction).toHaveBeenCalledWith({
          id: "presc-sent",
          athleteId: "ath-1",
        });
      });
    });
  });

  describe("4. Experiência do Atleta (ReceivedPrescriptionsCard no /planning)", () => {
    const receivedPrescriptions = [
      {
        id: "presc-sent-1",
        coachId: "coach-1",
        coachName: "Prof. Ricardo Silva",
        athleteId: "ath-1",
        status: "SENT" as const,
        name: "Planejamento Upper/Lower",
        notes: "Periodização de hipertrofia com foco em cadeia posterior",
        version: 1,
        payload: {
          days: [
            {
              dayOfWeek: 1,
              name: "Upper Power",
              isRestDay: false,
              estimatedDurationMinutes: 60,
              exercises: [
                {
                  exerciseId: "ex-supino",
                  name: "Supino Reto com Halteres",
                  orderIndex: 0,
                  sets: 4,
                  warmupSets: 2,
                  reps: 8,
                  restSeconds: 120,
                },
              ],
            },
          ],
        },
        sentAt: "2026-10-14T02:00:00.000Z",
        respondedAt: null,
        acceptedWorkoutPlanId: null,
        createdAt: "2026-10-14T01:00:00.000Z",
        updatedAt: "2026-10-14T02:00:00.000Z",
      },
    ];

    it("renderiza card de prescrição recebida com nome do treinador e botões", () => {
      render(<ReceivedPrescriptionsCard prescriptions={receivedPrescriptions as any} />);

      expect(screen.getByText("Prescrição de Treino Recebida")).toBeDefined();
      expect(screen.getByText("Planejamento Upper/Lower")).toBeDefined();
      expect(screen.getByText(/Prof\. Ricardo Silva/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /revisar treino/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /recusar/i })).toBeDefined();
    });

    it("abre modal de revisão ao clicar em 'Revisar Treino'", () => {
      render(<ReceivedPrescriptionsCard prescriptions={receivedPrescriptions as any} />);

      fireEvent.click(screen.getByRole("button", { name: /revisar treino/i }));

      expect(screen.getByText("Exercícios Prescritos:")).toBeDefined();
      expect(screen.getByText("Upper Power")).toBeDefined();
      expect(screen.getByText("Supino Reto com Halteres")).toBeDefined();
      expect(screen.getByText(/4x8 • 120s/i)).toBeDefined();
      expect(screen.getAllByRole("button", { name: /aceitar prescrição/i }).length).toBe(2);
    });

    it("ao aceitar a prescrição, cria o plano inativo e apresenta opção voluntária de ativação", async () => {
      (acceptPrescriptionAction as any).mockResolvedValue({
        success: true,
        data: {
          workoutPlanId: "plan-created-123",
          workoutPlanName: "Planejamento Upper/Lower",
        },
      });

      render(<ReceivedPrescriptionsCard prescriptions={receivedPrescriptions as any} />);

      // Abre modal
      fireEvent.click(screen.getByRole("button", { name: /revisar treino/i }));

      // Clica em Aceitar Prescrição dentro do modal
      const acceptButtons = screen.getAllByRole("button", { name: /aceitar prescrição/i });
      fireEvent.click(acceptButtons[acceptButtons.length - 1]);

      await waitFor(() => {
        expect(acceptPrescriptionAction).toHaveBeenCalledWith("presc-sent-1");
      });

      // Feedback de sucesso com opção voluntária de ativação
      expect(screen.getByText("Prescrição Aceita com Sucesso!")).toBeDefined();
      expect(screen.getByText(/O planejamento foi adicionado à sua conta como/i)).toBeDefined();
      expect(screen.getByRole("link", { name: /ver e ativar planejamento agora/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /manter inativo por enquanto/i })).toBeDefined();
    });

    it("permite recusar prescrição pendente com diálogo de confirmação", async () => {
      (declinePrescriptionAction as any).mockResolvedValue({ success: true });

      render(<ReceivedPrescriptionsCard prescriptions={receivedPrescriptions as any} />);

      const declineBtn = screen.getByRole("button", { name: /recusar/i });
      fireEvent.click(declineBtn);

      expect(screen.getByText("Recusar Prescrição")).toBeDefined();
      expect(screen.getByText(/Tem certeza de que deseja recusar a prescrição/i)).toBeDefined();

      const confirmBtn = screen.getByRole("button", { name: /sim, recusar/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(declinePrescriptionAction).toHaveBeenCalledWith("presc-sent-1");
      });
    });
  });
});
