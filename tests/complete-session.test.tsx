import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Orval generated API
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  completeWorkoutSession: vi.fn(),
  cancelWorkoutSession: vi.fn(),
  createWorkoutSet: vi.fn(),
  updateWorkoutSet: vi.fn(),
  deleteWorkoutSet: vi.fn(),
  getWorkoutSession: vi.fn(),
  getActiveWorkoutSession: vi.fn(),
}));

import * as api from "@/app/_lib/api/fetch-generated";
import { completeWorkoutSessionAction } from "@/app/workout-sessions/[sessionId]/_actions";
import { WorkoutSessionTracker } from "@/app/workout-sessions/[sessionId]/_components/workout-session-tracker";

describe("Task 1.7 — Finalização Segura da WorkoutSession", () => {
  const initialBaseSession: api.GetWorkoutSession200 = {
    id: "session-123",
    workoutDayId: "day-456",
    startedAt: "2026-09-29T10:00:00.000Z",
    completedAt: null,
    sessionExercises: [
      {
        id: "ex-1",
        exerciseNameSnapshot: "Supino Reto",
        order: 1,
        plannedSets: 3,
        plannedReps: 10,
        plannedRestTimeInSeconds: 90,
        notes: null,
        revision: 1,
        sets: [
          {
            id: "set-1",
            order: 1,
            type: "WORKING",
            weightInGrams: 40000,
            reps: 10,
            rir: 2,
            durationInSeconds: null,
            notes: null,
            completedAt: "2026-09-29T10:15:00.000Z",
          },
        ],
      },
    ],
  };

  const getBaseSession = (): api.GetWorkoutSession200 =>
    structuredClone(initialBaseSession);

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("1. Server Action: completeWorkoutSessionAction", () => {
    it("conclui sessão com sucesso (200) e invalida cache das rotas", async () => {
      vi.mocked(api.completeWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "session-123",
          workoutDayId: "day-456",
          startedAt: "2026-09-29T10:00:00.000Z",
          completedAt: "2026-09-29T11:00:00.000Z",
        },
        headers: new Headers(),
      });

      const res = await completeWorkoutSessionAction("session-123");

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe("session-123");
        expect(res.data.completedAt).toBe("2026-09-29T11:00:00.000Z");
      }
    });

    it("retorna erro amigável se a API rejeitar (ex: 400 com séries pendentes)", async () => {
      vi.mocked(api.completeWorkoutSession).mockResolvedValueOnce({
        status: 400,
        data: {
          error:
            "Existem 1 série(s) pendente(s) nesta sessão. Conclua ou remova todas as séries antes de finalizar o treino.",
          code: "PENDING_WORKOUT_SETS",
        },
        headers: new Headers(),
      });

      const res = await completeWorkoutSessionAction("session-123");

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Existem 1 série(s) pendente(s)");
      }
    });
  });

  describe("Cancelamento e tela de conclusão — integração da main", () => {
    it("exige confirmação explícita e Voltar não exclui a sessão", () => {
      render(<WorkoutSessionTracker session={getBaseSession()} />);
      fireEvent.click(screen.getByRole("button", { name: "Cancelar treino" }));
      const modal = screen.getByRole("dialog", {
        name: "Cancelar este treino?",
      });
      expect(api.cancelWorkoutSession).not.toHaveBeenCalled();
      fireEvent.click(within(modal).getByRole("button", { name: "Voltar" }));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(api.cancelWorkoutSession).not.toHaveBeenCalled();
      expect(screen.getByText("Supino Reto")).toBeDefined();
    });

    it("usa Orval e navega ao início só depois de confirmar o cancelamento", async () => {
      vi.mocked(api.cancelWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: { success: true, sessionId: "session-123" },
        headers: new Headers(),
      });
      render(<WorkoutSessionTracker session={getBaseSession()} />);
      fireEvent.click(screen.getByRole("button", { name: "Cancelar treino" }));
      const modal = screen.getByRole("dialog", {
        name: "Cancelar este treino?",
      });
      fireEvent.click(
        within(modal).getByRole("button", { name: "Sim, cancelar treino" }),
      );
      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
      expect(api.cancelWorkoutSession).toHaveBeenCalledExactlyOnceWith(
        "session-123",
      );
    });

    it("falha de cancelamento preserva a sessão e não navega", async () => {
      vi.mocked(api.cancelWorkoutSession).mockRejectedValueOnce(
        new Error("Servidor indisponível"),
      );
      render(<WorkoutSessionTracker session={getBaseSession()} />);
      fireEvent.click(screen.getByRole("button", { name: "Cancelar treino" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Sim, cancelar treino",
        }),
      );
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Servidor indisponível");
      });
      expect(router.push).not.toHaveBeenCalled();
      expect(screen.getByText("Supino Reto")).toBeDefined();
      expect(screen.getByDisplayValue("40")).toBeDefined();
    });
  });

  describe("2. UI e Fluxo de Finalização no WorkoutSessionTracker", () => {
    it("botão 'Finalizar treino' aparece em sessão ativa (completedAt === null)", () => {
      render(<WorkoutSessionTracker session={getBaseSession()} />);

      const finishButton = screen.getByRole("button", {
        name: /finalizar treino/i,
      });
      expect(finishButton).toBeDefined();
      expect(screen.getByText("Em Andamento")).toBeDefined();
    });

    it("sessão concluída NÃO mostra botão de finalizar treino e exibe estado read-only", () => {
      const completedSession: api.GetWorkoutSession200 = {
        ...getBaseSession(),
        completedAt: "2026-09-29T11:00:00.000Z",
      };

      render(<WorkoutSessionTracker session={completedSession} />);

      expect(
        screen.queryByRole("button", { name: /finalizar treino/i }),
      ).toBeNull();
      expect(screen.getByText(/Treino concluído!/i)).toBeDefined();
      expect(
        screen.getByText(
          /esta sessão foi finalizada e os registros estão em modo somente leitura/i,
        ),
      ).toBeDefined();
    });

    it("confirmação funciona: abre modal com mensagem não-alarmista e botão cancelar fecha", () => {
      render(<WorkoutSessionTracker session={getBaseSession()} />);

      const finishBtn = screen.getByRole("button", {
        name: /finalizar treino/i,
      });
      fireEvent.click(finishBtn);

      // Modal de confirmação deve aparecer
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(
        screen.getByRole("heading", { name: /finalizar treino\?/i }),
      ).toBeDefined();
      expect(
        screen.getByText(
          /depois disso, esta sessão ficará somente para leitura/i,
        ),
      ).toBeDefined();

      // Clicar em Cancelar deve fechar o modal
      const cancelBtn = within(
        screen.getByRole("dialog", { name: /finalizar treino/i }),
      ).getByRole("button", { name: "Voltar" });
      fireEvent.click(cancelBtn);

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("conclusão com sucesso fecha modal e atualiza a tela para read-only", async () => {
      vi.mocked(api.completeWorkoutSession).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "session-123",
          workoutDayId: "day-456",
          startedAt: "2026-09-29T10:00:00.000Z",
          completedAt: "2026-09-29T11:00:00.000Z",
        },
        headers: new Headers(),
      });

      render(<WorkoutSessionTracker session={getBaseSession()} />);

      // Abre modal
      fireEvent.click(
        screen.getByRole("button", { name: /finalizar treino/i }),
      );

      // Clica no botão de confirmar dentro do modal
      const modal = screen.getByRole("dialog");
      const confirmBtn = within(modal).getByRole("button", {
        name: /^finalizar treino$/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(screen.getByText(/Treino concluído!/i)).toBeDefined();
      });

      // Botão finalizar deve ter desaparecido
      expect(
        screen.queryByRole("button", { name: /finalizar treino/i }),
      ).toBeNull();
      expect(router.push).toHaveBeenCalledWith(
        "/workout-sessions/session-123/summary",
      );
    });

    it("erro de séries pendentes abre modal com 'Finalizar todas e concluir o treino'", async () => {
      vi.mocked(api.completeWorkoutSession).mockResolvedValueOnce({
        status: 400,
        data: {
          error:
            "Existem 1 série(s) pendente(s) nesta sessão. Conclua ou remova todas as séries antes de finalizar o treino.",
          code: "PENDING_WORKOUT_SETS",
        },
        headers: new Headers(),
      });

      render(<WorkoutSessionTracker session={getBaseSession()} />);

      // Abre modal e confirma
      fireEvent.click(
        screen.getByRole("button", { name: /finalizar treino/i }),
      );
      const modal = screen.getByRole("dialog");
      const confirmBtn = within(modal).getByRole("button", {
        name: /^finalizar treino$/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText("Séries pendentes")).toBeDefined();
        expect(
          screen.getByRole("button", { name: /finalizar todas e concluir o treino/i }),
        ).toBeDefined();
        expect(screen.getByRole("button", { name: "OK" })).toBeDefined();
      });

      // Sessão continua ativa
      expect(screen.getByText("Em Andamento")).toBeDefined();
    });

    it("clicar em 'Finalizar todas e concluir o treino' no modal chama API com forceComplete: true", async () => {
      vi.mocked(api.completeWorkoutSession)
        .mockResolvedValueOnce({
          status: 400,
          data: {
            error: "Existem 1 série(s) pendente(s) nesta sessão.",
            code: "PENDING_WORKOUT_SETS",
          },
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            id: "session-123",
            workoutDayId: "day-456",
            startedAt: "2026-09-29T10:00:00.000Z",
            completedAt: "2026-09-29T11:00:00.000Z",
          },
          headers: new Headers(),
        });

      render(<WorkoutSessionTracker session={getBaseSession()} />);

      fireEvent.click(
        screen.getByRole("button", { name: /finalizar treino/i }),
      );
      const modal = screen.getByRole("dialog");
      const confirmBtn = within(modal).getByRole("button", {
        name: /^finalizar treino$/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText("Séries pendentes")).toBeDefined();
      });

      const forceCompleteBtn = await screen.findByRole("button", {
        name: /finalizar todas e concluir o treino/i,
      });
      fireEvent.click(forceCompleteBtn);

      await waitFor(() => {
        expect(api.completeWorkoutSession).toHaveBeenLastCalledWith(
          "session-123",
          { forceComplete: true },
        );
        expect(router.push).toHaveBeenCalledWith(
          "/workout-sessions/session-123/summary",
        );
      });
    });

    it("falha da API emite toast.error e não perde dados digitados na tela", async () => {
      vi.mocked(api.completeWorkoutSession).mockResolvedValueOnce({
        status: 500,
        data: {
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        },
        headers: new Headers(),
      });

      render(<WorkoutSessionTracker session={getBaseSession()} />);

      fireEvent.click(
        screen.getByRole("button", { name: /finalizar treino/i }),
      );
      const modal = screen.getByRole("dialog");
      const confirmBtn = within(modal).getByRole("button", {
        name: /^finalizar treino$/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Internal server error");
      });

      // Dados do exercício e série continuam presentes
      expect(screen.getByText("Supino Reto")).toBeDefined();
      expect(screen.getByDisplayValue("40")).toBeDefined();
    });

    it("draft pendente: desfoca elemento ativo ao abrir modal de finalização", () => {
      render(<WorkoutSessionTracker session={getBaseSession()} />);

      const repsInput = screen.getByDisplayValue("10");
      repsInput.focus();
      expect(document.activeElement).toBe(repsInput);

      // Clica em finalizar treino
      const finishBtn = screen.getByRole("button", {
        name: /finalizar treino/i,
      });
      fireEvent.click(finishBtn);

      // O elemento ativo não deve mais ser o input (blur foi acionado)
      expect(document.activeElement).not.toBe(repsInput);
    });

    it("botão fica bloqueado com 'Salvando alterações...' durante mutation de série", async () => {
      // Cria uma promise pendente para simular request em andamento
      let resolveUpdate: (
        value: api.updateWorkoutSetResponse,
      ) => void = () => {};
      const pendingPromise = new Promise<api.updateWorkoutSetResponse>(
        (resolve) => {
          resolveUpdate = resolve;
        },
      );

      vi.mocked(api.updateWorkoutSet).mockReturnValueOnce(pendingPromise);

      render(<WorkoutSessionTracker session={getBaseSession()} />);

      const repsInput = screen.getByDisplayValue("10");
      fireEvent.change(repsInput, { target: { value: "12" } });
      fireEvent.blur(repsInput);

      // Botão Finalizar treino deve estar desabilitado mostrando indicador de salvamento
      await waitFor(() => {
        const disabledBtn = screen.getByRole("button", {
          name: /salvando alterações\.\.\./i,
        });
        expect(disabledBtn).toHaveProperty("disabled", true);
      });

      // Conclui a mutação
      resolveUpdate({
        status: 200,
        data: {
          id: "set-1",
          sessionExerciseId: "ex-1",
          order: 1,
          type: "WORKING",
          weightInGrams: 40000,
          reps: 12,
          rir: 2,
          durationInSeconds: null,
          notes: null,
          completedAt: "2026-09-29T10:15:00.000Z",
        },
        headers: new Headers(),
      });

      // Botão volta a ficar habilitado como Finalizar treino
      await waitFor(() => {
        const finishBtn = screen.getByRole("button", {
          name: /^finalizar treino$/i,
        });
        expect(finishBtn).toHaveProperty("disabled", false);
      });
    });
  });
});
