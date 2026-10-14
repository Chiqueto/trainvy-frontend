import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Orval generated API
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  createWorkoutSet: vi.fn(),
  updateWorkoutSet: vi.fn(),
  deleteWorkoutSet: vi.fn(),
  getWorkoutSession: vi.fn(),
  getActiveWorkoutSession: vi.fn(),
}));

import * as api from "@/app/_lib/api/fetch-generated";
import { gramsToKg, gramsToKgString, kgToGrams } from "@/app/_lib/weight";
import {
  createWorkoutSetAction,
  deleteWorkoutSetAction,
  updateWorkoutSetAction,
} from "@/app/workout-sessions/[sessionId]/_actions";
import { SessionExerciseCard } from "@/app/workout-sessions/[sessionId]/_components/session-exercise-card";
import { WorkoutSessionTracker } from "@/app/workout-sessions/[sessionId]/_components/workout-session-tracker";
import { WorkoutSetRow } from "@/app/workout-sessions/[sessionId]/_components/workout-set-row";

describe("Tracker Real UI & Actions (Task 1.6)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("1. Conversão kg ↔ gramas (Helper Util)", () => {
    it("converte gramas para kg corretamente", () => {
      expect(gramsToKg(30500)).toBe(30.5);
      expect(gramsToKg(30000)).toBe(30);
      expect(gramsToKg(250)).toBe(0.25);
      expect(gramsToKg(0)).toBe(0);
      expect(gramsToKg(null)).toBeNull();
      expect(gramsToKg(undefined)).toBeNull();
    });

    it("converte gramas para string formatada de exibição", () => {
      expect(gramsToKgString(30500)).toBe("30.5");
      expect(gramsToKgString(30000)).toBe("30");
      expect(gramsToKgString(null)).toBe("");
      expect(gramsToKgString(undefined)).toBe("");
    });

    it("converte kg para gramas inteiros sem arredondamento impreciso", () => {
      expect(kgToGrams("30.5")).toBe(30500);
      expect(kgToGrams("30,5")).toBe(30500); // suporte à vírgula brasileira
      expect(kgToGrams(30.5)).toBe(30500);
      expect(kgToGrams("0")).toBe(0);
      expect(kgToGrams("")).toBeNull();
      expect(kgToGrams(null)).toBeNull();
      expect(kgToGrams(undefined)).toBeNull();
      expect(kgToGrams("-5")).toBeNull();
      expect(kgToGrams(-10)).toBeNull();
      expect(kgToGrams("abc")).toBeNull();
    });
  });

  describe("2. Server Actions (create, update, delete)", () => {
    it("createWorkoutSetAction executa com sucesso", async () => {
      vi.mocked(api.createWorkoutSet).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "set-new-1",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WORKING",
          weightInGrams: 30000,
          reps: 8,
          rir: 2,
          durationInSeconds: null,
          notes: null,
          completedAt: null,
        },
        headers: new Headers(),
      });

      const result = await createWorkoutSetAction("sess-1", "ex-1", {
        type: "WORKING",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("set-new-1");
      }
    });

    it("createWorkoutSetAction trata erro da API", async () => {
      vi.mocked(api.createWorkoutSet).mockResolvedValueOnce({
        status: 409,
        data: {
          error: "Workout session is already completed",
          code: "WORKOUT_SESSION_ALREADY_COMPLETED",
        },
        headers: new Headers(),
      });

      const result = await createWorkoutSetAction("sess-1", "ex-1", {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Workout session is already completed");
      }
    });

    it("updateWorkoutSetAction executa com sucesso", async () => {
      vi.mocked(api.updateWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "set-1",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WORKING",
          weightInGrams: 35000,
          reps: 8,
          rir: 2,
          durationInSeconds: null,
          notes: null,
          completedAt: "2026-09-29T16:00:00Z",
        },
        headers: new Headers(),
      });

      const result = await updateWorkoutSetAction("sess-1", "set-1", {
        weightInGrams: 35000,
        completed: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weightInGrams).toBe(35000);
      }
    });

    it("deleteWorkoutSetAction executa com sucesso", async () => {
      vi.mocked(api.deleteWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: { success: true },
        headers: new Headers(),
      });

      const result = await deleteWorkoutSetAction("sess-1", "set-1");
      expect(result.success).toBe(true);
    });
  });

  describe("3. Renderização de Exercício e Prescrição", () => {
    it("renderiza nome do exercício e prescrição de séries e reps", () => {
      const mockExercise = {
        id: "ex-1",
        order: 1,
        exerciseNameSnapshot: "Supino Reto",
        plannedSets: 3,
        plannedReps: 8,
        plannedRestTimeInSeconds: 120,
        notes: "Pegada fechada",
        sets: [],
      };

      render(
        <SessionExerciseCard
          sessionId="sess-1"
          exercise={mockExercise}
          isReadOnly={false}
          onError={vi.fn()}
        />,
      );

      expect(screen.getByText("Supino Reto")).toBeDefined();
      expect(screen.getByText(/3 séries × 8 reps/i)).toBeDefined();
      expect(screen.getByText(/Descanso: 120s/i)).toBeDefined();
      expect(screen.getByText("Pegada fechada")).toBeDefined();
    });
  });

  describe("4. Linhas de Séries, Carga, Reps e RIR", () => {
    it("renderiza série por reps com carga, reps e RIR", () => {
      const mockSet = {
        id: "set-1",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: 30000,
        reps: 8,
        rir: 2,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={vi.fn()}
          onDeleteSet={vi.fn()}
          onError={vi.fn()}
        />,
      );

      const inputs = screen.getAllByRole("textbox");
      // Carga (30 kg), Reps (8), RIR (2)
      expect(inputs[0]).toHaveProperty("value", "30");
      expect(inputs[1]).toHaveProperty("value", "8");
      expect(inputs[2]).toHaveProperty("value", "2");
    });

    it("renderiza série por duração", () => {
      const mockSet = {
        id: "set-dur",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: null,
        reps: null,
        rir: null,
        durationInSeconds: 45,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="duration"
          isReadOnly={false}
          onUpdateSet={vi.fn()}
          onDeleteSet={vi.fn()}
          onError={vi.fn()}
        />,
      );

      const inputs = screen.getAllByRole("textbox");
      // Carga (vazio), Duração (45s)
      expect(inputs[0]).toHaveProperty("value", "");
      expect(inputs[1]).toHaveProperty("value", "45");
    });
  });

  describe("5. Tipo da Série (WARMUP vs WORKING)", () => {
    it("permite alternar entre Aquecimento e Trabalho", async () => {
      vi.mocked(api.updateWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "set-1",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WARMUP",
          weightInGrams: null,
          reps: null,
          rir: null,
          durationInSeconds: null,
          notes: null,
          completedAt: null,
        },
        headers: new Headers(),
      });

      const onUpdateSet = vi.fn();
      const mockSet = {
        id: "set-1",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: null,
        reps: null,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={onUpdateSet}
          onDeleteSet={vi.fn()}
          onError={vi.fn()}
        />,
      );

      const typeBtn = screen.getByRole("switch", {
        name: /Série de trabalho/i,
      });
      fireEvent.click(typeBtn);

      await waitFor(() => {
        expect(api.updateWorkoutSet).toHaveBeenCalledWith(
          "set-1",
          expect.objectContaining({ type: "WARMUP" }),
        );
        expect(onUpdateSet).toHaveBeenCalled();
      });
    });
  });

  describe("6. Concluir e Desfazer Conclusão", () => {
    it("não permite concluir série sem reps e sem duração (exibe erro amigável)", () => {
      const onError = vi.fn();
      const mockSet = {
        id: "set-empty",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: 30000,
        reps: null,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={vi.fn()}
          onDeleteSet={vi.fn()}
          onError={onError}
        />,
      );

      const checkBtn = screen.getByRole("button", { name: /concluir série/i });
      fireEvent.click(checkBtn);

      expect(onError).toHaveBeenCalledWith(
        "Informe as repetições ou a duração para concluir a série.",
      );
      expect(api.updateWorkoutSet).not.toHaveBeenCalled();
    });

    it("conclui série quando possui reps", async () => {
      vi.mocked(api.updateWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "set-1",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WORKING",
          weightInGrams: 30000,
          reps: 8,
          rir: null,
          durationInSeconds: null,
          notes: null,
          completedAt: "2026-09-29T16:10:00Z",
        },
        headers: new Headers(),
      });

      const onUpdateSet = vi.fn();
      const mockSet = {
        id: "set-1",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: 30000,
        reps: 8,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={onUpdateSet}
          onDeleteSet={vi.fn()}
          onError={vi.fn()}
        />,
      );

      const checkBtn = screen.getByRole("button", { name: /concluir série/i });
      fireEvent.click(checkBtn);

      await waitFor(() => {
        expect(api.updateWorkoutSet).toHaveBeenCalledWith(
          "set-1",
          expect.objectContaining({ completed: true }),
        );
        expect(onUpdateSet).toHaveBeenCalled();
      });
    });

    it("permite desfazer conclusão (completed: false)", async () => {
      vi.mocked(api.updateWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "set-completed",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WORKING",
          weightInGrams: 30000,
          reps: 8,
          rir: null,
          durationInSeconds: null,
          notes: null,
          completedAt: null,
        },
        headers: new Headers(),
      });

      const onUpdateSet = vi.fn();
      const mockSet = {
        id: "set-completed",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: 30000,
        reps: 8,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: "2026-09-29T16:10:00Z",
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={onUpdateSet}
          onDeleteSet={vi.fn()}
          onError={vi.fn()}
        />,
      );

      const undoBtn = screen.getByRole("button", {
        name: /desfazer conclusão/i,
      });
      fireEvent.click(undoBtn);

      await waitFor(() => {
        expect(api.updateWorkoutSet).toHaveBeenCalledWith("set-completed", {
          completed: false,
        });
        expect(onUpdateSet).toHaveBeenCalledWith(
          expect.objectContaining({ completedAt: null }),
        );
      });
    });
  });

  describe("7. Exclusão de Série", () => {
    it("exclui série através de ação dedicada", async () => {
      vi.mocked(api.deleteWorkoutSet).mockResolvedValueOnce({
        status: 200,
        data: { success: true },
        headers: new Headers(),
      });

      const onDeleteSet = vi.fn();
      const mockSet = {
        id: "set-del",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: null,
        reps: null,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={vi.fn()}
          onDeleteSet={onDeleteSet}
          onError={vi.fn()}
        />,
      );

      const delBtn = screen.getByRole("button", { name: /remover/i });
      fireEvent.click(delBtn);

      const confirmBtn = screen.getByRole("button", { name: /sim/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(api.deleteWorkoutSet).toHaveBeenCalledWith("set-del");
        expect(onDeleteSet).toHaveBeenCalledWith("set-del");
      });
    });
  });

  describe("8. Erro da API preservando o draft do usuário", () => {
    it("mantém valores digitados se a API falhar no blur", async () => {
      vi.mocked(api.updateWorkoutSet).mockResolvedValueOnce({
        status: 400,
        data: {
          error: "O peso deve ser um número inteiro",
          code: "VALIDATION_ERROR",
        },
        headers: new Headers(),
      });

      const onError = vi.fn();
      const mockSet = {
        id: "set-1",
        order: 1,
        type: "WORKING" as const,
        weightInGrams: 20000,
        reps: 10,
        rir: null,
        durationInSeconds: null,
        notes: null,
        completedAt: null,
      };

      render(
        <WorkoutSetRow
          sessionId="sess-1"
          set={mockSet}
          mode="reps"
          isReadOnly={false}
          onUpdateSet={vi.fn()}
          onDeleteSet={vi.fn()}
          onError={onError}
        />,
      );

      const inputs = screen.getAllByRole("textbox");
      fireEvent.change(inputs[0], { target: { value: "32.5" } });
      fireEvent.blur(inputs[0]);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          "O peso deve ser um número inteiro",
        );
        // Valor digitado ("32.5") permanece no input sem ser perdido
        expect(inputs[0]).toHaveProperty("value", "32.5");
      });
    });
  });

  describe("9. Sessão Concluída em Modo Read-Only", () => {
    it("não exibe botões de adicionar, editar ou remover em sessão concluída", () => {
      const mockSession = {
        id: "sess-completed",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T10:00:00Z",
        completedAt: "2026-09-29T11:00:00Z",
        sessionExercises: [
          {
            id: "ex-1",
            order: 1,
            exerciseNameSnapshot: "Supino Reto",
            plannedSets: 3,
            plannedReps: 8,
            plannedRestTimeInSeconds: 90,
            notes: null,
            sets: [
              {
                id: "set-1",
                order: 1,
                type: "WORKING" as const,
                weightInGrams: 30000,
                reps: 8,
                rir: 2,
                durationInSeconds: null,
                notes: null,
                completedAt: "2026-09-29T10:30:00Z",
              },
            ],
          },
        ],
      };

      render(<WorkoutSessionTracker session={mockSession} />);

      // Verifica badge de treino concluído e aviso read-only
      expect(screen.getByText(/Treino concluído!/i)).toBeDefined();
      expect(
        screen.getByText(
          /esta sessão foi finalizada e os registros estão em modo somente leitura/i,
        ),
      ).toBeDefined();

      // Não exibe botão + Adicionar série
      expect(
        screen.queryByRole("button", { name: /adicionar série/i }),
      ).toBeNull();

      // Não exibe inputs editáveis de texto
      expect(screen.queryByRole("textbox")).toBeNull();

      // Não exibe botão de remover série
      expect(screen.queryByRole("button", { name: /remover/i })).toBeNull();
    });
  });
});
