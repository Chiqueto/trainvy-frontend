/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock das Server Actions antes de importar os componentes
vi.mock("@/app/personal/alunos/[athleteId]/_actions", () => ({
  fetchCoachAthleteProgressOverviewAction: vi.fn(),
  fetchCoachAthleteProgressSessionsAction: vi.fn(),
  fetchCoachAthleteProgressSessionDetailAction: vi.fn(),
  fetchCoachAthleteProgressExercisesAction: vi.fn(),
  fetchCoachAthleteProgressExerciseEvolutionAction: vi.fn(),
}));

vi.mock("@/app/profile/_actions", () => ({
  updateCoachProgressSharingAction: vi.fn(),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MyCoachSection } from "@/app/profile/_components/my-coach-section";
import { CoachAthleteEvolutionDashboard } from "@/app/personal/alunos/[athleteId]/_components/coach-athlete-evolution-dashboard";
import { CoachProgressSessionModal } from "@/app/personal/alunos/[athleteId]/_components/coach-progress-session-modal";
import { CoachProgressExerciseView } from "@/app/personal/alunos/[athleteId]/_components/coach-progress-exercise-view";
import * as coachActions from "@/app/personal/alunos/[athleteId]/_actions";
import * as profileActions from "@/app/profile/_actions";

describe("TASK 6.3 — Coach Athlete Progress & Training History UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Controle de Compartilhamento do Atleta (MyCoachSection)", () => {
    const mockRelationship = {
      linkId: "link-abc-123",
      coachId: "coach-xyz-789",
      coachName: "Prof. Ricardo Personal",
      coachEmail: "ricardo@trainvy.test",
      acceptedAt: "2026-10-01T10:00:00.000Z",
    };

    it("renderiza controles de consentimento com estado desativado por padrão", () => {
      render(
        <MyCoachSection
          relationship={mockRelationship}
          initialSharingConsent={{
            enabled: false,
            includePreviousHistory: false,
            sharedAt: null,
            revokedAt: null,
          }}
        />,
      );

      expect(screen.getByText(/Compartilhamento de evolução/i)).toBeDefined();
      expect(screen.getByText("Desativado")).toBeDefined();
      expect(
        screen.getByRole("switch", {
          name: /ativar ou desativar compartilhamento/i,
        }),
      ).toBeDefined();

      // Opção de histórico anterior não aparece quando consentimento geral está desativado
      expect(
        screen.queryByText(/Incluir histórico anterior/i),
      ).toBeNull();
    });

    it("permite ativar compartilhamento e exibe opção de histórico anterior", async () => {
      (profileActions.updateCoachProgressSharingAction as any).mockResolvedValue({
        success: true,
        data: {
          enabled: true,
          includePreviousHistory: false,
          sharedAt: "2026-10-15T12:00:00.000Z",
          revokedAt: null,
        },
      });

      render(
        <MyCoachSection
          relationship={mockRelationship}
          initialSharingConsent={{
            enabled: false,
            includePreviousHistory: false,
            sharedAt: null,
            revokedAt: null,
          }}
        />,
      );

      const mainSwitch = screen.getByRole("switch", {
        name: /ativar ou desativar compartilhamento/i,
      });

      fireEvent.click(mainSwitch);

      await waitFor(() => {
        expect(profileActions.updateCoachProgressSharingAction).toHaveBeenCalledWith({
          enabled: true,
          includePreviousHistory: false,
        });
        expect(screen.getByText("Ativo")).toBeDefined();
        expect(
          screen.getByText(/Incluir histórico anterior/i),
        ).toBeDefined();
      });
    });

    it("permite habilitar e desabilitar inclusão de histórico anterior", async () => {
      (profileActions.updateCoachProgressSharingAction as any).mockResolvedValue({
        success: true,
        data: {
          enabled: true,
          includePreviousHistory: true,
          sharedAt: "2026-10-15T12:00:00.000Z",
          revokedAt: null,
        },
      });

      render(
        <MyCoachSection
          relationship={mockRelationship}
          initialSharingConsent={{
            enabled: true,
            includePreviousHistory: false,
            sharedAt: "2026-10-15T12:00:00.000Z",
            revokedAt: null,
          }}
        />,
      );

      const prevSwitch = screen.getByRole("switch", {
        name: /incluir histórico anterior ao consentimento/i,
      });

      fireEvent.click(prevSwitch);

      await waitFor(() => {
        expect(profileActions.updateCoachProgressSharingAction).toHaveBeenCalledWith({
          enabled: true,
          includePreviousHistory: true,
        });
      });
    });

    it("exibe aviso claro de que métricas corporais e IA não são compartilhadas", () => {
      render(
        <MyCoachSection
          relationship={mockRelationship}
          initialSharingConsent={{
            enabled: true,
            includePreviousHistory: false,
            sharedAt: "2026-10-15T12:00:00.000Z",
            revokedAt: null,
          }}
        />,
      );

      expect(
        screen.getByText(/Peso corporal, percentual de gordura, fotos e conversas com a IA/i),
      ).toBeDefined();
    });
  });

  describe("2. Painel de Evolução do Treinador (CoachAthleteEvolutionDashboard)", () => {
    it("exibe estado amigável quando o aluno ainda NÃO autorizou compartilhamento (403 SHARING_NOT_AUTHORIZED)", async () => {
      (coachActions.fetchCoachAthleteProgressOverviewAction as any).mockResolvedValue({
        success: false,
        status: 403,
        code: "SHARING_NOT_AUTHORIZED",
        error: "O atleta ainda não autorizou o compartilhamento.",
      });

      render(
        <CoachAthleteEvolutionDashboard
          athleteId="ath-101"
          athleteName="Ana Atleta"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Compartilhamento Não Autorizado/i),
        ).toBeDefined();
        expect(
          screen.getByText(/Este aluno ainda não autorizou o compartilhamento do histórico de treinos/i),
        ).toBeDefined();
        expect(screen.getByText(/Como o aluno pode habilitar/i)).toBeDefined();
      });

      // Guardrail: zero dados ou métricas fictícias expostas
      expect(screen.queryByText(/Volume Semanal/i)).toBeNull();
      expect(screen.queryByText(/Treinos Concluídos/i)).toBeNull();
    });

    it("renderiza métricas reais, gráficos e resumo quando o aluno está autorizado", async () => {
      (coachActions.fetchCoachAthleteProgressOverviewAction as any).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          athlete: { id: "ath-101", name: "Ana Atleta", email: "ana@test.com" },
          range: {
            weeksCount: 4,
            startDate: "2026-09-17T00:00:00.000Z",
            endDate: "2026-10-15T23:59:59.999Z",
            timezone: "America/Sao_Paulo",
          },
          summary: {
            totalWorkouts: 12,
            weeklyFrequency: 3.0,
            totalWorkingSets: 84,
            totalLoadVolumeKg: 14200.5,
            averageDurationInSeconds: 3120,
            weeksCount: 4,
          },
          weekly: {
            startDate: "2026-09-17T00:00:00.000Z",
            endDate: "2026-10-15T23:59:59.999Z",
            weeks: [
              {
                weekStartDate: "2026-09-17",
                weekEndDate: "2026-09-23",
                workoutsCompleted: 3,
                workingSets: 21,
                warmupSets: 3,
                loadVolumeGrams: 3500000,
                loadVolumeKg: 3500,
                durationSeconds: 10800,
              },
            ],
          },
          muscles: {
            startDate: "2026-09-17T00:00:00.000Z",
            endDate: "2026-10-15T23:59:59.999Z",
            muscles: [
              {
                muscleGroup: "CHEST",
                directWorkingSets: 12,
                indirectWorkingSets: 4,
              },
            ],
          },
        },
      });

      render(
        <CoachAthleteEvolutionDashboard
          athleteId="ath-101"
          athleteName="Ana Atleta"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Treinos Concluídos")).toBeDefined();
        expect(screen.getByText("Frequência Semanal")).toBeDefined();
        expect(screen.getByText("Séries Válidas")).toBeDefined();
        expect(screen.getByText("84")).toBeDefined();
        expect(screen.getByText(/Volume Total/i)).toBeDefined();
        expect(screen.getByText(/14\.200,5\s?kg/i)).toBeDefined();
      });

      expect(screen.getAllByText(/12/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/3/).length).toBeGreaterThanOrEqual(1);

      // Filtro de períodos 4, 8, 12 semanas presente
      expect(screen.getByRole("button", { name: "4 sem" })).toBeDefined();
      expect(screen.getByRole("button", { name: "8 sem" })).toBeDefined();
      expect(screen.getByRole("button", { name: "12 sem" })).toBeDefined();
    });

    it("permite alternar para a aba Sessões e listar treinos concluídos", async () => {
      (coachActions.fetchCoachAthleteProgressOverviewAction as any).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          athlete: { id: "ath-101", name: "Ana Atleta", email: "ana@test.com" },
          range: { weeksCount: 4, startDate: "2026-09-17", endDate: "2026-10-15", timezone: "UTC" },
          summary: {
            totalWorkouts: 1,
            weeklyFrequency: 0.3,
            totalWorkingSets: 10,
            totalLoadVolumeKg: 2000,
            averageDurationInSeconds: 2400,
            weeksCount: 4,
          },
          weekly: { startDate: "2026-09-17", endDate: "2026-10-15", weeks: [] },
          muscles: { startDate: "2026-09-17", endDate: "2026-10-15", muscles: [] },
        },
      });

      (coachActions.fetchCoachAthleteProgressSessionsAction as any).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          items: [
            {
              id: "session-1",
              origin: "PLANNED",
              startedAt: "2026-10-14T10:00:00.000Z",
              completedAt: "2026-10-14T11:00:00.000Z",
              durationInSeconds: 3600,
              workoutPlanNameSnapshot: "Hipertrofia A/B",
              workoutDayNameSnapshot: "Treino A - Peito e Tríceps",
              exercisesCount: 5,
              workingSetsCount: 16,
              totalLoadVolumeKg: 4200,
            },
          ],
          nextCursor: null,
          hasMore: false,
        },
      });

      render(
        <CoachAthleteEvolutionDashboard
          athleteId="ath-101"
          athleteName="Ana Atleta"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Treinos Concluídos")).toBeDefined();
      });

      const sessionsTabBtn = screen.getByRole("button", { name: /sessões/i });
      fireEvent.click(sessionsTabBtn);

      await waitFor(() => {
        expect(screen.getByText("Treino A - Peito e Tríceps")).toBeDefined();
        expect(screen.getByText(/16\s*séries/i)).toBeDefined();
        expect(screen.getAllByText(/Planejado/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("3. Modal Read-Only de Sessão (CoachProgressSessionModal)", () => {
    const mockSessionDetail: any = {
      id: "session-1",
      origin: "PLANNED",
      startedAt: "2026-10-14T10:00:00.000Z",
      completedAt: "2026-10-14T11:00:00.000Z",
      durationInSeconds: 3600,
      workoutPlanNameSnapshot: "Hipertrofia A/B",
      workoutDayNameSnapshot: "Treino A",
      summary: {
        workingSetsCount: 3,
        warmupSetsCount: 1,
        exercisesCount: 1,
        totalLoadVolumeKg: 1200,
      },
      exercises: [
        {
          id: "ex-1",
          exerciseId: "ex-canonical-1",
          exerciseNameSnapshot: "Supino Reto com Barra",
          order: 1,
          notes: "Execução controlada",
          planned: {
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetRir: 2,
            warmupSets: 1,
            workingSets: 3,
            targetRestTimeInSeconds: 90,
          },
          performed: {
            warmupSetsCount: 1,
            workingSetsCount: 3,
            loadVolumeKg: 1200,
          },
          sets: [
            {
              id: "set-1",
              order: 1,
              type: "WARMUP",
              weightInGrams: 40000,
              reps: 12,
              rir: 4,
              durationInSeconds: 45,
              notes: null,
              completedAt: "2026-10-14T10:15:00.000Z",
            },
            {
              id: "set-2",
              order: 2,
              type: "WORKING",
              weightInGrams: 80000,
              reps: 10,
              rir: 2,
              durationInSeconds: 50,
              notes: null,
              completedAt: "2026-10-14T10:20:00.000Z",
            },
          ],
        },
      ],
    };

    it("renderiza snapshots de treino, metas planejadas e séries executadas sem opções de edição", () => {
      const handleClose = vi.fn();
      render(
        <CoachProgressSessionModal
          session={mockSessionDetail}
          onClose={handleClose}
        />,
      );

      expect(screen.getByText("Treino A")).toBeDefined();
      expect(screen.getByText("Somente Leitura")).toBeDefined();
      expect(screen.getByText("Supino Reto com Barra")).toBeDefined();
      expect(screen.getByText(/40\s?kg/i)).toBeDefined();
      expect(screen.getByText(/80\s?kg/i)).toBeDefined();
      expect(screen.getByText(/Execução controlada/i)).toBeDefined();

      // Guardrail: nenhum botão de deletar ou editar sessão
      expect(screen.queryByRole("button", { name: /excluir/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /salvar/i })).toBeNull();

      // Botão fechar funciona
      const closeBtn = screen.getByRole("button", { name: "Fechar" });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("4. Evolução por Exercício (CoachProgressExerciseView)", () => {
    it("busca exercícios com histórico autorizado e carrega PR e linha do tempo", async () => {
      (coachActions.fetchCoachAthleteProgressExercisesAction as any).mockResolvedValue({
        success: true,
        status: 200,
        data: [
          {
            id: "ex-agachamento",
            name: "Agachamento Livre",
            category: "LEGS",
            primaryMuscle: "QUADRICEPS",
          },
        ],
      });

      (coachActions.fetchCoachAthleteProgressExerciseEvolutionAction as any).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          exercise: {
            id: "ex-agachamento",
            name: "Agachamento Livre",
            muscles: [{ muscleGroup: "QUADRICEPS", role: "PRIMARY" }],
          },
          loadPR: {
            weightInGrams: 120000,
            weightKg: 120,
            reps: 6,
            rir: 1,
            completedAt: "2026-10-10T12:00:00.000Z",
          },
          items: [
            {
              workoutSessionId: "sess-pr",
              completedAt: "2026-10-10T12:00:00.000Z",
              workoutPlanNameSnapshot: "Treino de Pernas",
              workoutDayNameSnapshot: "Dia 1",
              workingSetsCount: 3,
              loadVolumeKg: 2160,
              sets: [
                {
                  id: "s-1",
                  sessionExerciseId: "se-1",
                  order: 1,
                  weightInGrams: 120000,
                  weightKg: 120,
                  reps: 6,
                  rir: 1,
                  notes: null,
                  durationInSeconds: 60,
                  completedAt: "2026-10-10T12:00:00.000Z",
                },
              ],
            },
          ],
          nextCursor: null,
          hasMore: false,
        },
      });

      render(<CoachProgressExerciseView athleteId="ath-101" />);

      await waitFor(() => {
        expect(screen.getByText("Agachamento Livre")).toBeDefined();
      });

      // Clica no chip do exercício
      const exChip = screen.getByRole("button", { name: "Agachamento Livre" });
      fireEvent.click(exChip);

      await waitFor(() => {
        expect(screen.getByText(/Melhor Carga Registrada/i)).toBeDefined();
      });
      expect(screen.getAllByText(/120\s?kg/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Histórico insuficiente para avaliar tendência/i)).toBeDefined();
    });
  });
});
