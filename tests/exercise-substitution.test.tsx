/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Orval generated API
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  substituteSessionExercise: vi.fn(),
  listExercises: vi.fn(),
}));

import * as api from "@/app/_lib/api/fetch-generated";
import { substituteSessionExerciseAction } from "@/app/workout-sessions/[sessionId]/_actions";
import { SessionExerciseCard } from "@/app/workout-sessions/[sessionId]/_components/session-exercise-card";
import { HistorySessionDetail } from "@/app/history/_components/history-session-detail";
import { CoachProgressSessionModal } from "@/app/personal/alunos/[athleteId]/_components/coach-progress-session-modal";

describe("Task 6.4 — Substituição de Exercícios na Sessão de Treino", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Server Action: substituteSessionExerciseAction", () => {
    it("chama a API e retorna sucesso com os dados atualizados", async () => {
      const mockResult = {
        status: 200,
        data: {
          id: "session-ex-1",
          exerciseId: "new-ex-id",
          exerciseNameSnapshot: "Leg Press 45°",
          plannedExerciseId: "orig-ex-id",
          plannedExerciseNameSnapshot: "Agachamento Livre",
          wasSubstituted: true,
          substitutedAt: "2026-10-19T12:00:00.000Z",
          alternative1ExerciseId: "alt-1-id",
          alternative1ExerciseNameSnapshot: "Leg Press 45°",
          alternative2ExerciseId: null,
          alternative2ExerciseNameSnapshot: null,
          order: 1,
          plannedSets: 4,
          plannedWarmupSets: 0,
          plannedReps: 10,
          plannedRestTimeInSeconds: 90,
        },
      };

      vi.mocked(api.substituteSessionExercise).mockResolvedValueOnce(
        mockResult as any,
      );

      const res = await substituteSessionExerciseAction(
        "session-1",
        "session-ex-1",
        "new-ex-id",
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.exerciseNameSnapshot).toBe("Leg Press 45°");
        expect(res.data.wasSubstituted).toBe(true);
        expect(res.data.plannedExerciseNameSnapshot).toBe("Agachamento Livre");
      }
      expect(api.substituteSessionExercise).toHaveBeenCalledWith(
        "session-1",
        "session-ex-1",
        { newExerciseId: "new-ex-id" },
      );
    });

    it("trata erro retornado pela API", async () => {
      vi.mocked(api.substituteSessionExercise).mockResolvedValueOnce({
        status: 400,
        data: { error: "Exercício não encontrado no catálogo.", code: "NOT_FOUND" },
      } as any);

      const res = await substituteSessionExerciseAction(
        "session-1",
        "session-ex-1",
        "invalid-id",
      );

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Exercício não encontrado no catálogo.");
      }
    });
  });

  describe("UI: SessionExerciseCard e Modal de Substituição", () => {
    const defaultExercise: any = {
      id: "se-1",
      exerciseId: "main-ex-1",
      exerciseNameSnapshot: "Agachamento Livre",
      order: 1,
      plannedSets: 4,
      plannedWarmupSets: 1,
      plannedReps: 10,
      plannedRestTimeInSeconds: 90,
      notes: null,
      wasSubstituted: false,
      plannedExerciseId: "main-ex-1",
      plannedExerciseNameSnapshot: "Agachamento Livre",
      alternative1ExerciseId: "alt-ex-1",
      alternative1ExerciseNameSnapshot: "Leg Press 45°",
      alternative2ExerciseId: "alt-ex-2",
      alternative2ExerciseNameSnapshot: "Hack Squat",
      sets: [],
    };

    it("renderiza o botão 'Substituir' para exercícios prescritos em treino planejado", () => {
      render(
        <SessionExerciseCard
          exercise={defaultExercise}
          exerciseIndex={0}
          isReadOnly={false}
          isFreeWorkout={false}
          onRemoveExercise={vi.fn()}
          onSubstituteExercise={vi.fn()}
          onError={vi.fn()}
          onMutationStart={vi.fn()}
          onMutationEnd={vi.fn()}
        />,
      );

      expect(screen.getByRole("button", { name: /substituir/i })).toBeDefined();
    });

    it("não renderiza o botão 'Substituir' quando o treino for avulso (isFreeWorkout = true)", () => {
      render(
        <SessionExerciseCard
          exercise={defaultExercise}
          exerciseIndex={0}
          isReadOnly={false}
          isFreeWorkout={true}
          onRemoveExercise={vi.fn()}
          onSubstituteExercise={vi.fn()}
          onError={vi.fn()}
          onMutationStart={vi.fn()}
          onMutationEnd={vi.fn()}
        />,
      );

      expect(screen.queryByRole("button", { name: /substituir/i })).toBeNull();
    });

    it("abre o modal com as alternativas sugeridas ao clicar em 'Substituir'", async () => {
      vi.mocked(api.listExercises).mockResolvedValueOnce({
        status: 200,
        data: [],
      } as any);

      render(
        <SessionExerciseCard
          exercise={defaultExercise}
          exerciseIndex={0}
          isReadOnly={false}
          isFreeWorkout={false}
          onRemoveExercise={vi.fn()}
          onSubstituteExercise={vi.fn()}
          onError={vi.fn()}
          onMutationStart={vi.fn()}
          onMutationEnd={vi.fn()}
        />,
      );

      const subBtn = screen.getByRole("button", { name: /substituir/i });
      fireEvent.click(subBtn);

      await waitFor(() => {
        expect(screen.getByText("Substituir Exercício")).toBeDefined();
        expect(screen.getByText("Leg Press 45°")).toBeDefined();
        expect(screen.getByText("Hack Squat")).toBeDefined();
      });
    });

    it("exibe badge 'Substituído' e 'Planejado: {original}' quando o exercício foi substituído", () => {
      const substitutedExercise: any = {
        ...defaultExercise,
        exerciseId: "alt-ex-1",
        exerciseNameSnapshot: "Leg Press 45°",
        wasSubstituted: true,
        substitutedAt: "2026-10-19T14:00:00.000Z",
        plannedExerciseId: "main-ex-1",
        plannedExerciseNameSnapshot: "Agachamento Livre",
      };

      render(
        <SessionExerciseCard
          exercise={substitutedExercise}
          exerciseIndex={0}
          isReadOnly={false}
          isFreeWorkout={false}
          onRemoveExercise={vi.fn()}
          onSubstituteExercise={vi.fn()}
          onError={vi.fn()}
          onMutationStart={vi.fn()}
          onMutationEnd={vi.fn()}
        />,
      );

      expect(screen.getByText("Substituído")).toBeDefined();
      expect(screen.getByText(/Original planejado:/i)).toBeDefined();
      expect(screen.getByText("Agachamento Livre")).toBeDefined();
    });
  });

  describe("UI: Histórico do Atleta (HistorySessionDetail)", () => {
    it("exibe badge Substituído e Original planejado no histórico", () => {
      const mockSession: any = {
        id: "hist-1",
        workoutDayId: "day-1",
        origin: "PLANNED",
        workoutPlanNameSnapshot: "Hipertrofia A",
        workoutDayNameSnapshot: "Inferiores",
        completedAt: "2026-10-19T13:00:00.000Z",
        durationInSeconds: 3600,
        summary: {
          exercisesCount: 1,
          workingSetsCount: 3,
          warmupSetsCount: 0,
          totalLoadVolumeKg: 3000,
        },
        exercises: [
          {
            id: "ex-hist-1",
            exerciseId: "alt-1",
            exerciseNameSnapshot: "Leg Press 45°",
            order: 1,
            notes: null,
            wasSubstituted: true,
            substitutedAt: "2026-10-19T12:15:00.000Z",
            plannedExerciseId: "orig-1",
            plannedExerciseNameSnapshot: "Agachamento Livre",
            planned: {
              warmupSets: 0,
              workingSets: 3,
              reps: 10,
              restTimeInSeconds: 90,
            },
            performed: {
              warmupSetsCount: 0,
              workingSetsCount: 3,
              loadVolumeKg: 3000,
            },
            sets: [],
          },
        ],
      };

      render(<HistorySessionDetail session={mockSession} />);

      expect(screen.getByText("Leg Press 45°")).toBeDefined();
      expect(screen.getByText("Substituído")).toBeDefined();
      expect(screen.getByText(/Original planejado:/i)).toBeDefined();
      expect(screen.getByText("Agachamento Livre")).toBeDefined();
    });
  });

  describe("UI: Inspeção da Sessão pelo Personal (CoachProgressSessionModal)", () => {
    it("exibe badge Substituído e Original prescrito na modal de inspeção do personal", () => {
      const mockCoachSession: any = {
        id: "sess-coach-1",
        origin: "PLANNED",
        workoutPlanNameSnapshot: "Plano do Atleta",
        workoutDayNameSnapshot: "Dia 1",
        completedAt: "2026-10-19T14:00:00.000Z",
        durationInSeconds: 3200,
        summary: {
          exercisesCount: 1,
          workingSetsCount: 3,
          warmupSetsCount: 0,
          totalLoadVolumeKg: 2500,
        },
        exercises: [
          {
            id: "coach-ex-1",
            exerciseId: "alt-leg-press",
            exerciseNameSnapshot: "Leg Press 45°",
            order: 1,
            notes: "Sentiu cansaço na lombar",
            wasSubstituted: true,
            substitutedAt: "2026-10-19T13:30:00.000Z",
            plannedExerciseId: "orig-squat",
            plannedExerciseNameSnapshot: "Agachamento Livre",
            planned: {
              workingSets: 3,
              reps: 10,
              restTimeInSeconds: 90,
            },
            performed: {
              workingSetsCount: 3,
              loadVolumeKg: 2500,
            },
            sets: [],
          },
        ],
      };

      render(
        <CoachProgressSessionModal
          session={mockCoachSession}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByText("Leg Press 45°")).toBeDefined();
      expect(screen.getByText("Substituído")).toBeDefined();
      expect(screen.getByText(/Original prescrito:/i)).toBeDefined();
      expect(screen.getByText("Agachamento Livre")).toBeDefined();
    });
  });
});
