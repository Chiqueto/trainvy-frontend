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

// Mock actions
const mockActions = vi.hoisted(() => ({
  confirmWorkoutSetProposalAction: vi.fn(),
  discardWorkoutSetProposalAction: vi.fn(),
  listWorkoutSetProposalsAction: vi.fn(),
  getAiConsentAction: vi.fn(),
  updateAiConsentAction: vi.fn(),
}));
vi.mock(
  "@/app/workout-sessions/[sessionId]/_actions",
  () => mockActions,
);

// Mock @ai-sdk/react
const mockSendMessage = vi.fn();
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    sendMessage: mockSendMessage,
    status: "ready",
  }),
}));

// Mock streamdown
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

import { SetProposalCard } from "@/app/workout-sessions/[sessionId]/_components/set-proposal-card";
import { SessionAiAssistantDrawer } from "@/app/workout-sessions/[sessionId]/_components/session-ai-assistant-drawer";
import type { ListWorkoutSetProposals200ProposalsItem } from "@/app/_lib/api/fetch-generated";

describe("Task 6.5A — In-Session AI Assistant & Set Proposal Card UI", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockProposal: ListWorkoutSetProposals200ProposalsItem = {
    id: "prop-1",
    userId: "user-1",
    workoutSessionId: "session-1",
    sessionExerciseId: "se-1",
    targetExerciseId: "ex-1",
    targetExerciseNameSnapshot: "Supino Inclinado com Halteres",
    targetSessionExerciseRevision: 1,
    status: "PENDING",
    invalidationReason: null,
    expiresAt: "2026-10-21T12:00:00.000Z",
    createdAt: "2026-10-21T10:00:00.000Z",
    updatedAt: "2026-10-21T10:00:00.000Z",
    suggestedSets: [
      {
        type: "WARMUP",
        weightKg: 20,
        reps: 12,
        rir: 4,
        durationInSeconds: null,
        notes: "Aquecimento progressivo",
      },
      {
        type: "WORKING",
        weightKg: 32,
        reps: 10,
        rir: 2,
        durationInSeconds: null,
        notes: null,
      },
    ],
  };

  it("renderiza proposta pendente com os campos de carga e repetições", () => {
    render(
      <SetProposalCard
        proposal={mockProposal}
        sessionId="session-1"
        onConfirmed={vi.fn()}
        onDiscarded={vi.fn()}
      />,
    );

    expect(screen.getByText("Supino Inclinado com Halteres")).toBeDefined();
    expect(screen.getByText(/Pendente/i)).toBeDefined();
    expect(screen.getByDisplayValue("20")).toBeDefined();
    expect(screen.getByDisplayValue("12")).toBeDefined();
    expect(screen.getByDisplayValue("32")).toBeDefined();
    expect(screen.getByDisplayValue("10")).toBeDefined();
    expect(screen.getByText("Confirmar Séries")).toBeDefined();
  });

  it("permite alterar carga/reps e confirmar com sucesso chamando action e callback", async () => {
    const onConfirmed = vi.fn();
    mockActions.confirmWorkoutSetProposalAction.mockResolvedValueOnce({
      success: true,
      data: {
        proposal: { ...mockProposal, status: "CONFIRMED" },
        createdSets: [
          { id: "set-1", order: 1, type: "WARMUP", weightKg: 22, reps: 12 },
          { id: "set-2", order: 2, type: "WORKING", weightKg: 34, reps: 8 },
        ],
      },
    });

    render(
      <SetProposalCard
        proposal={mockProposal}
        sessionId="session-1"
        onConfirmed={onConfirmed}
      />,
    );

    // Altera peso da série 1 para 22
    const weightInput1 = screen.getByDisplayValue("20");
    fireEvent.change(weightInput1, { target: { value: "22" } });

    // Altera reps da série 2 para 8
    const repsInput2 = screen.getByDisplayValue("10");
    fireEvent.change(repsInput2, { target: { value: "8" } });

    // Clica em confirmar
    const confirmBtn = screen.getByText("Confirmar Séries");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockActions.confirmWorkoutSetProposalAction).toHaveBeenCalledTimes(1);
      expect(mockActions.confirmWorkoutSetProposalAction).toHaveBeenCalledWith(
        "session-1",
        "prop-1",
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^proposal-prop-1-/),
          sets: expect.arrayContaining([
            expect.objectContaining({ weightKg: 22, reps: 12 }),
            expect.objectContaining({ weightKg: 32, reps: 8 }),
          ]),
        }),
      );
      expect(onConfirmed).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith(
        "Séries registradas com sucesso no treino!",
      );
    });
  });

  it("exibe aviso de desatualização quando revisão do contexto divergir (CONTEXT_REVISION_MISMATCH)", async () => {
    mockActions.confirmWorkoutSetProposalAction.mockResolvedValueOnce({
      success: false,
      code: "CONTEXT_REVISION_MISMATCH",
      error: "Contexto do exercício foi alterado",
    });

    render(
      <SetProposalCard
        proposal={mockProposal}
        sessionId="session-1"
      />,
    );

    const confirmBtn = screen.getByText("Confirmar Séries");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Desatualizado/i)).toBeDefined();
      expect(
        screen.getByText(
          "O exercício ou as séries sofreram alterações recentes. Esta proposta não é mais válida.",
        ),
      ).toBeDefined();
      expect(mockToast.error).toHaveBeenCalledWith(
        "Proposta desatualizada por alterações recentes",
      );
    });
  });

  it("permite descartar a proposta pendente", async () => {
    const onDiscarded = vi.fn();
    mockActions.discardWorkoutSetProposalAction.mockResolvedValueOnce({
      success: true,
      data: {
        proposal: { ...mockProposal, status: "DISCARDED" },
      },
    });

    render(
      <SetProposalCard
        proposal={mockProposal}
        sessionId="session-1"
        onDiscarded={onDiscarded}
      />,
    );

    const discardBtn = screen.getByRole("button", { name: "Descartar proposta" });
    fireEvent.click(discardBtn);

    await waitFor(() => {
      expect(mockActions.discardWorkoutSetProposalAction).toHaveBeenCalledWith(
        "session-1",
        "prop-1",
      );
      expect(onDiscarded).toHaveBeenCalledWith("prop-1");
      expect(mockToast.info).toHaveBeenCalledWith("Proposta descartada");
    });
  });

  it("renderiza o drawer do assistente e alterna consentimento LGPD de histórico", async () => {
    mockActions.getAiConsentAction.mockResolvedValueOnce({
      success: true,
      data: { aiTrainingHistoryAccess: false },
    });
    mockActions.listWorkoutSetProposalsAction.mockResolvedValueOnce({
      success: true,
      data: { proposals: [mockProposal] },
    });
    mockActions.updateAiConsentAction.mockResolvedValueOnce({
      success: true,
      data: { aiTrainingHistoryAccess: true },
    });

    const onClose = vi.fn();
    render(
      <SessionAiAssistantDrawer
        isOpen={true}
        onClose={onClose}
        sessionId="session-1"
        selectedExerciseId="se-1"
        selectedExerciseName="Supino Inclinado com Halteres"
      />,
    );

    expect(screen.getByText("Assistente de Treino")).toBeDefined();
    expect(screen.getByText("Focado em: Supino Inclinado com Halteres")).toBeDefined();
    expect(screen.getByText("Histórico de treinos anteriores")).toBeDefined();

    await waitFor(() => {
      expect(mockActions.getAiConsentAction).toHaveBeenCalledTimes(1);
      expect(mockActions.listWorkoutSetProposalsAction).toHaveBeenCalledWith("session-1");
    });

    // Alterna o toggle LGPD
    const toggleBtn = screen.getByRole("button", { name: "Alternar histórico" });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockActions.updateAiConsentAction).toHaveBeenCalledWith({
        aiTrainingHistoryAccess: true,
      });
    });
  });
});
