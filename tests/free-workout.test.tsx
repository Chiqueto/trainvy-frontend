import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Orval generated API
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  startFreeWorkoutSession: vi.fn(),
  listExercises: vi.fn(),
  createExercise: vi.fn(),
  addExerciseToWorkoutSession: vi.fn(),
  removeExerciseFromWorkoutSession: vi.fn(),
  createWorkoutSet: vi.fn(),
  updateWorkoutSet: vi.fn(),
  deleteWorkoutSet: vi.fn(),
  completeWorkoutSession: vi.fn(),
  getWorkoutSession: vi.fn(),
  getActiveWorkoutSession: vi.fn(),
}));

import * as api from "@/app/_lib/api/fetch-generated";
import { StartFreeWorkoutButton } from "@/app/_components/start-free-workout-button";
import {
  addExerciseToWorkoutSessionAction,
  createExerciseAction,
  listExercisesAction,
  removeExerciseFromWorkoutSessionAction,
  startFreeWorkoutAction,
} from "@/app/workout-sessions/[sessionId]/_actions";
import { ExerciseSelectorModal } from "@/app/workout-sessions/[sessionId]/_components/exercise-selector-modal";
import { WorkoutSessionTracker } from "@/app/workout-sessions/[sessionId]/_components/workout-session-tracker";

describe("Task 1.8 — Treino Avulso Frontend Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseFreeSession: api.GetWorkoutSession200 = {
    id: "free-session-123",
    workoutDayId: null,
    startedAt: "2026-09-30T10:00:00.000Z",
    completedAt: null,
    sessionExercises: [],
  };

  const plannedSession: api.GetWorkoutSession200 = {
    id: "planned-session-456",
    workoutDayId: "day-789",
    startedAt: "2026-09-30T10:00:00.000Z",
    completedAt: null,
    sessionExercises: [
      {
        id: "ex-planned-1",
        exerciseNameSnapshot: "Supino Reto",
        order: 1,
        plannedSets: 3,
        plannedReps: 10,
        plannedRestTimeInSeconds: 90,
        notes: null,
        sets: [],
      },
    ],
  };

  describe("1. Botão 'Treino avulso' na Home", () => {
    it("renderiza o botão '+ Treino avulso' habilitado quando não existe sessão ativa", () => {
      render(<StartFreeWorkoutButton hasActiveSession={false} />);

      const button = screen.getByRole("button", { name: /treino avulso/i });
      expect(button).toBeDefined();
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });

    it("renderiza desabilitado quando já existe sessão ativa", () => {
      render(<StartFreeWorkoutButton hasActiveSession={true} />);

      const button = screen.getByRole("button", { name: /treino avulso/i });
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it("criação e redirect: startFreeWorkoutAction inicia sessão avulsa e redireciona", async () => {
      vi.mocked(api.startFreeWorkoutSession).mockResolvedValueOnce({
        status: 201,
        data: {
          userWorkoutSessionId: "new-free-session-999",
          workoutSessionId: "new-free-session-999",
          workoutDayId: null,
          startedAt: "2026-09-30T10:00:00.000Z",
          completedAt: null,
        },
        headers: new Headers(),
      });

      try {
        await startFreeWorkoutAction();
      } catch (err: unknown) {
        expect((err as Error).message).toBe(
          "NEXT_REDIRECT:/workout-sessions/new-free-session-999",
        );
      }

      expect(mockRedirect).toHaveBeenCalledWith(
        "/workout-sessions/new-free-session-999",
      );
    });
  });

  describe("2. Identificação 'Treino avulso' e Botão de Adicionar Exercício", () => {
    it("exibe badge 'Treino avulso' quando workoutDayId == null", () => {
      render(<WorkoutSessionTracker session={baseFreeSession} />);

      expect(screen.getByText("Treino avulso")).toBeDefined();
      expect(screen.queryByText(/ID #free-ses/)).toBeNull();
    });

    it("exibe 'ID #' em sessão planejada com workoutDayId != null", () => {
      render(<WorkoutSessionTracker session={plannedSession} />);

      expect(screen.queryByText("Treino avulso")).toBeNull();
      expect(screen.getByText(/ID #planned-/)).toBeDefined();
    });

    it("exibe botão '+ Adicionar exercício' em sessão avulsa aberta", () => {
      render(<WorkoutSessionTracker session={baseFreeSession} />);

      const addButtons = screen.getAllByRole("button", {
        name: /adicionar exercício/i,
      });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it("NÃO exibe botão '+ Adicionar exercício' em sessão planejada", () => {
      render(<WorkoutSessionTracker session={plannedSession} />);

      expect(
        screen.queryByRole("button", { name: /adicionar exercício/i }),
      ).toBeNull();
    });
  });

  describe("3. Catálogo e Seletor de Exercício (Modal)", () => {
    it("listExercisesAction busca exercícios globais e próprios", async () => {
      vi.mocked(api.listExercises).mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: "ex-1",
            name: "Supino Reto",
            ownerUserId: null,
            hasMedia: false,
            muscles: [
              {
                id: "m-1",
                muscleGroup: "CHEST",
                role: "PRIMARY",
              },
            ],
          },
        ],
        headers: new Headers(),
      });

      const res = await listExercisesAction("supino");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toHaveLength(1);
        expect(res.data[0].name).toBe("Supino Reto");
      }
    });

    it("createExerciseAction normaliza nome e cria exercício personalizado", async () => {
      vi.mocked(api.createExercise).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "ex-custom-1",
          name: "Supino Hammer",
          ownerUserId: "user-123",
          hasMedia: false,
          muscles: [],
        },
        headers: new Headers(),
      });

      const res = await createExerciseAction("   Supino Hammer   ");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe("Supino Hammer");
      }
      expect(api.createExercise).toHaveBeenCalledWith({
        name: "Supino Hammer",
        primaryMuscleGroups: undefined,
        secondaryMuscleGroups: undefined,
      });
    });

    it("createExerciseAction rejeita nome vazio", async () => {
      const res = await createExerciseAction("   ");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe("Nome do exercício é obrigatório");
      }
    });

    it("busca no modal e exibe botão de criar se não houver match exato", async () => {
      vi.mocked(api.listExercises).mockResolvedValue({
        status: 200,
        data: [
          {
            id: "ex-1",
            name: "Supino Reto",
            ownerUserId: null,
            hasMedia: false,
            muscles: [],
          },
        ],
        headers: new Headers(),
      });

      const onSelect = vi.fn().mockResolvedValue(undefined);
      render(
        <ExerciseSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectExercise={onSelect}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Buscar exercício...");
      fireEvent.change(searchInput, { target: { value: "Supino Hammer" } });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /criar "supino hammer"/i }),
        ).toBeDefined();
      });
    });

    it("addExerciseToWorkoutSessionAction adiciona exercício e revalida path", async () => {
      vi.mocked(api.addExerciseToWorkoutSession).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "session-ex-1",
          exerciseNameSnapshot: "Supino",
          order: 1,
          plannedSets: null,
          plannedReps: null,
          plannedRestTimeInSeconds: null,
          notes: null,
          sets: [],
        },
        headers: new Headers(),
      });

      const res = await addExerciseToWorkoutSessionAction("session-1", "ex-1");
      expect(res.success).toBe(true);
    });

    it("removeExerciseFromWorkoutSessionAction remove exercício e revalida path", async () => {
      vi.mocked(api.removeExerciseFromWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: { success: true },
        headers: new Headers(),
      });

      const res = await removeExerciseFromWorkoutSessionAction(
        "session-1",
        "session-ex-1",
      );
      expect(res.success).toBe(true);
    });
  });

  describe("4. Adicionar Exercício ao Tracker Avulso", () => {
    it("exercício adicionado aparece imediatamente no tracker", async () => {
      vi.mocked(api.listExercises).mockResolvedValue({
        status: 200,
        data: [
          {
            id: "ex-agachamento",
            name: "Agachamento Livre",
            ownerUserId: null,
            hasMedia: false,
            muscles: [],
          },
        ],
        headers: new Headers(),
      });

      vi.mocked(api.addExerciseToWorkoutSession).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "session-ex-agachamento",
          exerciseNameSnapshot: "Agachamento Livre",
          order: 1,
          plannedSets: null,
          plannedReps: null,
          plannedRestTimeInSeconds: null,
          notes: null,
          sets: [],
        },
        headers: new Headers(),
      });

      render(<WorkoutSessionTracker session={baseFreeSession} />);

      // Abre modal de adicionar exercício
      const addBtn = screen.getAllByRole("button", {
        name: /adicionar exercício/i,
      })[0];
      fireEvent.click(addBtn);

      // Espera item aparecer no modal
      await waitFor(() => {
        expect(screen.getByText("Agachamento Livre")).toBeDefined();
      });

      // Clica para selecionar o exercício
      const selectBtn = screen.getByRole("button", {
        name: /agachamento livre/i,
      });
      fireEvent.click(selectBtn);

      // Exercício deve aparecer no tracker
      await waitFor(() => {
        expect(screen.getByText("Agachamento Livre")).toBeDefined();
        expect(screen.getByText("Exercícios (1)")).toBeDefined();
      });
    });

    it("permite registrar WorkoutSet normalmente no exercício avulso", async () => {
      const sessionWithExercise: api.GetWorkoutSession200 = {
        ...baseFreeSession,
        sessionExercises: [
          {
            id: "session-ex-1",
            exerciseNameSnapshot: "Supino Reto",
            order: 1,
            plannedSets: null,
            plannedReps: null,
            plannedRestTimeInSeconds: null,
            notes: null,
            sets: [],
          },
        ],
      };

      vi.mocked(api.createWorkoutSet).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "set-free-1",
          sessionExerciseId: "session-ex-1",
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

      render(<WorkoutSessionTracker session={sessionWithExercise} />);

      const addSetBtn = screen.getByRole("button", {
        name: /adicionar série/i,
      });
      fireEvent.click(addSetBtn);

      await waitFor(() => {
        expect(api.createWorkoutSet).toHaveBeenCalledWith("session-ex-1", {
          type: "WORKING",
        });
      });
    });
  });

  describe("5. Remoção de Exercício Avulso", () => {
    it("remove exercício sem séries diretamente sem modal de confirmação", async () => {
      const sessionWithExercise: api.GetWorkoutSession200 = {
        ...baseFreeSession,
        sessionExercises: [
          {
            id: "session-ex-empty",
            exerciseNameSnapshot: "Exercício Sem Séries",
            order: 1,
            plannedSets: null,
            plannedReps: null,
            plannedRestTimeInSeconds: null,
            notes: null,
            sets: [],
          },
        ],
      };

      vi.mocked(api.removeExerciseFromWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: { success: true },
        headers: new Headers(),
      });

      render(<WorkoutSessionTracker session={sessionWithExercise} />);

      const deleteBtn = screen.getByRole("button", {
        name: /remover exercício/i,
      });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(api.removeExerciseFromWorkoutSession).toHaveBeenCalledWith(
          "session-ex-empty",
        );
        expect(screen.queryByText("Exercício Sem Séries")).toBeNull();
      });
    });

    it("exige confirmação antes de remover exercício que possui séries", async () => {
      const sessionWithExerciseAndSets: api.GetWorkoutSession200 = {
        ...baseFreeSession,
        sessionExercises: [
          {
            id: "session-ex-with-sets",
            exerciseNameSnapshot: "Supino com Séries",
            order: 1,
            plannedSets: null,
            plannedReps: null,
            plannedRestTimeInSeconds: null,
            notes: null,
            sets: [
              {
                id: "set-1",
                order: 1,
                type: "WORKING",
                weightInGrams: 50000,
                reps: 10,
                rir: 1,
                durationInSeconds: null,
                notes: null,
                completedAt: "2026-09-30T10:10:00.000Z",
              },
            ],
          },
        ],
      };

      render(<WorkoutSessionTracker session={sessionWithExerciseAndSets} />);

      const deleteBtn = screen.getByRole("button", {
        name: /remover exercício/i,
      });
      fireEvent.click(deleteBtn);

      // Deve abrir o modal de confirmação
      await waitFor(() => {
        expect(screen.getByText("Remover exercício?")).toBeDefined();
        expect(screen.getByText(/possui 1 série registrada/i)).toBeDefined();
      });

      // Clicar em Cancelar não remove
      const cancelBtn = within(
        screen.getByRole("dialog", { name: /remover exercício/i }),
      ).getByRole("button", { name: /^cancelar$/i });
      fireEvent.click(cancelBtn);

      expect(api.removeExerciseFromWorkoutSession).not.toHaveBeenCalled();
      expect(screen.getByText("Supino com Séries")).toBeDefined();

      // Clicar novamente e Confirmar
      fireEvent.click(deleteBtn);
      let modal: HTMLElement | null = null;
      await waitFor(() => {
        modal = screen.getByRole("dialog", { name: /remover exercício\?/i });
        expect(modal).toBeDefined();
      });

      vi.mocked(api.removeExerciseFromWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: { success: true },
        headers: new Headers(),
      });

      const confirmBtn = within(modal!).getByRole("button", {
        name: /^remover$/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(api.removeExerciseFromWorkoutSession).toHaveBeenCalledWith(
          "session-ex-with-sets",
        );
        expect(screen.queryByText("Supino com Séries")).toBeNull();
      });
    });

    it("NÃO exibe botão de remoção para exercícios de sessão planejada", () => {
      render(<WorkoutSessionTracker session={plannedSession} />);

      expect(
        screen.queryByRole("button", { name: /remover exercício/i }),
      ).toBeNull();
    });
  });

  describe("6. Finalização e Modo Read-Only", () => {
    it("sessão avulsa finalizada desabilita mutações e fica read-only", () => {
      const completedFreeSession: api.GetWorkoutSession200 = {
        ...baseFreeSession,
        completedAt: "2026-09-30T11:00:00.000Z",
        sessionExercises: [
          {
            id: "session-ex-1",
            exerciseNameSnapshot: "Supino Reto",
            order: 1,
            plannedSets: null,
            plannedReps: null,
            plannedRestTimeInSeconds: null,
            notes: null,
            sets: [],
          },
        ],
      };

      render(<WorkoutSessionTracker session={completedFreeSession} />);

      expect(screen.getByText(/Treino concluído!/i)).toBeDefined();
      expect(screen.getByText(/esta sessão foi finalizada/i)).toBeDefined();
      expect(
        screen.queryByRole("button", { name: /adicionar exercício/i }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: /remover exercício/i }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: /adicionar série/i }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: /finalizar treino/i }),
      ).toBeNull();
    });
  });
});
