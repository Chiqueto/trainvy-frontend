import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mocks
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

// Mock recovery actions
const mockRecoveryActions = vi.hoisted(() => ({
  getForgottenWorkoutDraftAction: vi.fn(),
  updateForgottenWorkoutDraftAction: vi.fn(),
  confirmForgottenWorkoutRecoveryAction: vi.fn(),
  discardForgottenWorkoutDraftAction: vi.fn(),
  createForgottenWorkoutDraftAction: vi.fn(),
}));
vi.mock(
  "@/app/history/_recovery-actions",
  () => mockRecoveryActions,
);

import { ForgottenWorkoutRecoveryModal } from "@/app/history/_components/forgotten-workout-recovery-modal";
import { HistorySessionCard } from "@/app/history/_components/history-session-card";
import { HistorySessionDetail } from "@/app/history/_components/history-session-detail";
import { formatDuration } from "@/app/_lib/training-formatters";
import type {
  GetForgottenWorkoutDraft200Draft,
  ListWorkoutHistory200ItemsItem,
  GetWorkoutHistorySession200,
} from "@/app/_lib/api/fetch-generated";

describe("Task 6.5B — Forgotten Workout Recovery (Frontend)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const baseDraft: GetForgottenWorkoutDraft200Draft = {
    id: "draft-123",
    userId: "user-1",
    revision: 1,
    status: "DRAFT",
    sessionDate: "2026-10-15",
    timePrecision: "DATE_ONLY",
    startedAt: null,
    completedAt: null,
    timezone: "America/Sao_Paulo",
    title: "Treino de Peito Passado",
    origin: "FREE",
    proposedExercises: [
      {
        order: 1,
        exerciseId: "ex-1",
        exerciseNameSnapshot: "Supino Reto com Barra",
        sets: [
          { order: 1, type: "WARMUP", weightKg: 20, reps: 15, rir: null },
          { order: 2, type: "WORKING", weightKg: 60, reps: 10, rir: 2 },
        ],
      },
    ],
    expiresAt: "2026-10-15T14:00:00.000Z",
    createdAt: "2026-10-15T12:00:00.000Z",
    updatedAt: "2026-10-15T12:00:00.000Z",
  };

  describe("1. ForgottenWorkoutRecoveryModal", () => {
    it("carrega rascunho, exibe aviso de data civil e lista de exercícios e séries", async () => {
      mockRecoveryActions.getForgottenWorkoutDraftAction.mockResolvedValueOnce({
        success: true,
        data: {
          draft: baseDraft,
          conflicts: {
            hasConflict: false,
            conflictingSessions: [],
          },
        },
      });

      render(
        <ForgottenWorkoutRecoveryModal
          draftId="draft-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      // Loading state
      expect(screen.getByText(/Carregando detalhes do rascunho/i)).toBeDefined();

      // Aguarda carregamento
      await waitFor(() => {
        expect(screen.getByText("Recuperação de Treino Esquecido")).toBeDefined();
        expect(screen.getByText(/Precisão por data civil/i)).toBeDefined();
        expect(screen.getByDisplayValue("Treino de Peito Passado")).toBeDefined();
        expect(screen.getByDisplayValue("2026-10-15")).toBeDefined();
        expect(screen.getByText("Supino Reto com Barra")).toBeDefined();
        expect(screen.getByDisplayValue("60")).toBeDefined();
      });
    });

    it("detecta conflito e exige checkbox para confirmar", async () => {
      mockRecoveryActions.getForgottenWorkoutDraftAction.mockResolvedValueOnce({
        success: true,
        data: {
          draft: baseDraft,
          conflicts: {
            hasConflict: true,
            conflictingSessions: [
              {
                id: "sess-existente",
                sessionDate: "2026-10-15",
                startedAt: "2026-10-15T10:00:00.000Z",
                workoutPlanNameSnapshot: "Treino de Pernas Manhã",
              },
            ],
          },
        },
      });

      render(
        <ForgottenWorkoutRecoveryModal
          draftId="draft-123"
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Conflito de Data Detectado/i)).toBeDefined();
        expect(screen.getByText(/Treino de Pernas Manhã/i)).toBeDefined();
      });

      // Botão de confirmação deve estar desabilitado enquanto confirmConflict não estiver marcado
      const confirmBtn = screen.getByRole("button", {
        name: /Confirmar e Salvar no Histórico/i,
      });
      expect(confirmBtn).toHaveProperty("disabled", true);

      // Marca o checkbox
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(confirmBtn).toHaveProperty("disabled", false);
    });

    it("confirmação chama confirmForgottenWorkoutRecoveryAction com clientRevision e fecha modal", async () => {
      mockRecoveryActions.getForgottenWorkoutDraftAction.mockResolvedValueOnce({
        success: true,
        data: {
          draft: baseDraft,
          conflicts: {
            hasConflict: false,
            conflictingSessions: [],
          },
        },
      });

      mockRecoveryActions.confirmForgottenWorkoutRecoveryAction.mockResolvedValueOnce({
        success: true,
        data: {
          sessionId: "new-session-id",
        },
      });

      const onConfirmed = vi.fn();
      const onClose = vi.fn();

      render(
        <ForgottenWorkoutRecoveryModal
          draftId="draft-123"
          isOpen={true}
          onClose={onClose}
          onConfirmed={onConfirmed}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Supino Reto com Barra")).toBeDefined();
      });

      const confirmBtn = screen.getByRole("button", {
        name: /Confirmar e Salvar no Histórico/i,
      });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(
          mockRecoveryActions.confirmForgottenWorkoutRecoveryAction,
        ).toHaveBeenCalledWith("draft-123", {
          clientRevision: 1,
          confirmConflict: false,
        });
        expect(onConfirmed).toHaveBeenCalledWith("new-session-id");
        expect(onClose).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          expect.stringMatching(/registrado no histórico/i),
        );
      });
    });

    it("descarte chama discardForgottenWorkoutDraftAction e fecha modal", async () => {
      // Mock window.confirm
      vi.spyOn(window, "confirm").mockReturnValue(true);

      mockRecoveryActions.getForgottenWorkoutDraftAction.mockResolvedValueOnce({
        success: true,
        data: {
          draft: baseDraft,
          conflicts: { hasConflict: false, conflictingSessions: [] },
        },
      });

      mockRecoveryActions.discardForgottenWorkoutDraftAction.mockResolvedValueOnce({
        success: true,
        data: { success: true },
      });

      const onClose = vi.fn();

      render(
        <ForgottenWorkoutRecoveryModal
          draftId="draft-123"
          isOpen={true}
          onClose={onClose}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Supino Reto com Barra")).toBeDefined();
      });

      const discardBtn = screen.getByRole("button", { name: /Descartar/i });
      fireEvent.click(discardBtn);

      await waitFor(() => {
        expect(
          mockRecoveryActions.discardForgottenWorkoutDraftAction,
        ).toHaveBeenCalledWith("draft-123", "Descartado pelo atleta");
        expect(onClose).toHaveBeenCalled();
        expect(mockToast.info).toHaveBeenCalledWith(
          expect.stringMatching(/descartado/i),
        );
      });
    });
  });

  describe("2. Formatação e Badges no Histórico", () => {
    it("formatDuration retorna 'Não informada' para null ou undefined", () => {
      expect(formatDuration(null)).toBe("Não informada");
      expect(formatDuration(undefined)).toBe("Não informada");
      expect(formatDuration(3600)).toBe("1h");
      expect(formatDuration(90)).toBe("1min");
    });

    it("HistorySessionCard exibe badge Retroativo e formatação civil", () => {
      const retroactiveSession: ListWorkoutHistory200ItemsItem = {
        id: "sess-ret-1",
        sessionDate: "2026-10-15",
        timePrecision: "DATE_ONLY",
        isRetroactive: true,
        origin: "FREE",
        startedAt: "2026-10-15T15:00:00.000Z",
        completedAt: "2026-10-15T15:00:00.000Z",
        workoutPlanId: null,
        workoutPlanNameSnapshot: null,
        workoutDayNameSnapshot: null,
        exercisesCount: 1,
        workingSetsCount: 3,
        warmupSetsCount: 0,
        totalLoadVolumeKg: 1800,
        totalLoadVolumeGrams: 1800000,
        durationInSeconds: null,
      };

      render(<HistorySessionCard session={retroactiveSession} />);

      expect(screen.getByText("Retroativo")).toBeDefined();
      expect(screen.getByText("Não informada")).toBeDefined();
      expect(screen.getByText("15/10")).toBeDefined();
    });

    it("HistorySessionDetail exibe badge Retroativo e duração não informada", () => {
      const sessionDetail: GetWorkoutHistorySession200 = {
        id: "sess-ret-1",
        sessionDate: "2026-10-15",
        timePrecision: "DATE_ONLY",
        isRetroactive: true,
        origin: "FREE",
        startedAt: "2026-10-15T15:00:00.000Z",
        completedAt: "2026-10-15T15:00:00.000Z",
        workoutPlanId: null,
        workoutPlanNameSnapshot: null,
        workoutDayNameSnapshot: null,
        durationInSeconds: null,
        summary: {
          exercisesCount: 1,
          workingSetsCount: 3,
          warmupSetsCount: 0,
          totalLoadVolumeKg: 1800,
          totalLoadVolumeGrams: 1800000,
        },
        exercises: [],
      };

      render(<HistorySessionDetail session={sessionDetail} />);

      expect(screen.getByText("Retroativo")).toBeDefined();
      expect(screen.getByText("Não informada")).toBeDefined();
    });
  });
});
