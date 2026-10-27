import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetAdminAiUsage200, GetEditableWorkoutPlan200, GetSessionFeedback200 } from "@/app/_lib/api/fetch-generated";

const mocks = vi.hoisted(() => ({ edit: vi.fn(), save: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/app/planning/_actions", () => ({ editWorkoutPlanAction: mocks.edit, createStandaloneWorkoutPlanAction: vi.fn(), createWorkoutPlanInPeriodizationAction: vi.fn() }));
vi.mock("@/app/_actions/session-feedback", () => ({ saveSessionFeedbackAction: mocks.save }));
vi.mock("@/app/planning/_components/athlete-ai-workout-plan-modal", () => ({ AthleteAiWorkoutPlanModal: () => null }));

import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import { SummaryFeedbackWidget } from "@/app/workout-sessions/[sessionId]/summary/_components/summary-feedback-widget";
import { AiUsageDashboard } from "@/app/admin/_components/ai-usage-dashboard";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const plan: GetEditableWorkoutPlan200 = { id: "plan", name: "Plano atual", isActive: true, workoutDays: [{
  id: "day", name: "Treino A", weekDay: "MONDAY", isRest: false, order: 0,
  estimatedDurationInSeconds: 2700, coverImageUrl: "https://images.unsplash.com/example.jpg", exercises: [{
    id: "prescription", exerciseId: "canonical", order: 0, name: "Supino", sets: 3, warmupSets: 2, reps: 10,
    restTimeInSeconds: 90, alternative1Name: "Flexão", alternative1ExerciseId: "alternative",
  }],
}] };

describe("Editing saved plans", () => {
  it("loads the existing plan and saves IDs, cover, alternatives and edited sets without reactivating", async () => {
    mocks.edit.mockResolvedValue({ success: true, data: { id: plan.id } });
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan} />);
    expect((screen.getByLabelText("Nome do plano *") as HTMLInputElement).value).toBe("Plano atual");
    const card = screen.getByRole("article");
    fireEvent.change(within(card).getByLabelText("Séries válidas"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.edit).toHaveBeenCalled());
    expect(mocks.edit).toHaveBeenCalledWith("plan", expect.objectContaining({ name: "Plano atual", workoutDays: [expect.objectContaining({
      id: "day", coverImageUrl: plan.workoutDays[0].coverImageUrl,
      exercises: [expect.objectContaining({ id: "prescription", exerciseId: "canonical", sets: 5, warmupSets: 2, alternative1ExerciseId: "alternative" })],
    })] }));
    expect(mocks.edit.mock.calls[0][1]).not.toHaveProperty("activate");
    expect(mocks.push).toHaveBeenCalledWith("/workout-plans/plan");
  });
  it("keeps edits after failure and clears the old canonical ID when the movement changes", async () => {
    mocks.edit.mockResolvedValue({ success: false, error: "Conclua sua sessão" });
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan} />);
    fireEvent.change(within(screen.getByRole("article")).getByLabelText("Nome"), { target: { value: "Remada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Conclua sua sessão"));
    expect((within(screen.getByRole("article")).getByLabelText("Nome") as HTMLInputElement).value).toBe("Remada");
    expect(mocks.edit.mock.calls[0][1].workoutDays[0].exercises[0].exerciseId).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("Persistent session feedback", () => {
  const initial: GetSessionFeedback200 = { workoutSessionId: "session", feeling: "great", pain: 0, fatigue: 2, sleepQuality: null, notes: "Boa sessão", updatedAt: "2026-10-27T10:00:00Z" };
  it("restores persisted feelings, zeros and notes", () => {
    render(<SummaryFeedbackWidget sessionId="session" initial={initial} />);
    expect(screen.getByRole("button", { name: /Ótimo/ }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("Dor (0 nenhuma, 10 máxima)") as HTMLSelectElement).value).toBe("0");
    expect((screen.getByLabelText("Observações") as HTMLTextAreaElement).value).toBe("Boa sessão");
    expect(screen.getByRole("status").textContent).toContain("Salvo");
  });
  it("does not claim to save until the API succeeds and retains failed input for retry", async () => {
    mocks.save.mockResolvedValueOnce({ success: false, error: "Sem conexão" }).mockResolvedValueOnce({ success: true, data: initial });
    render(<SummaryFeedbackWidget sessionId="session" />);
    fireEvent.click(screen.getByRole("button", { name: /Cansado/ }));
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Cansado hoje" } });
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Sem conexão"));
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText("Observações") as HTMLTextAreaElement).value).toBe("Cansado hoje");
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Salvo"));
    expect(mocks.save).toHaveBeenLastCalledWith("session", { feeling: "fatigued", pain: null, fatigue: null, sleepQuality: null, notes: "Cansado hoje" });
  });
  it("offers retry if loading fails, without showing an empty saved evaluation", () => {
    render(<SummaryFeedbackWidget sessionId="session" loadFailed />);
    expect(screen.queryByRole("button", { name: "Salvar avaliação" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mocks.refresh).toHaveBeenCalled();
  });
});

describe("Admin AI cost visibility", () => {
  const totals = { calls: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cachedInputTokens: 0, estimatedCostUsd: 0, unpricedCalls: 0, errors: 0 };
  const data: GetAdminAiUsage200 = { from: "2026-10-01", to: "2026-10-27", trackingStartedAt: null,
    pricingSource: "https://ai.google.dev/gemini-api/docs/pricing", pricingVersion: "test", totals, byFeature: [], byUser: [], daily: [], recent: [] };
  it("provides period/user filters, a clear empty state and cost limitations", () => {
    render(<AiUsageDashboard data={data} days={30} />);
    expect(screen.getByText("Nenhuma chamada de IA registrada para este filtro.")).toBeTruthy();
    expect(screen.getByLabelText("Período (UTC)")).toBeTruthy();
    expect(screen.getByLabelText("ID do usuário (opcional)")).toBeTruthy();
    expect(screen.getByText(/O consumo anterior à implantação não é reconstruído/)).toBeTruthy();
  });
  it("distinguishes missing token/cost data from measured zero", () => {
    render(<AiUsageDashboard days={7} data={{ ...data, totals: { ...totals, calls: 1, errors: 1, unpricedCalls: 1 }, recent: [{
      id: "usage", userId: "user", feature: "CHAT", model: "gemini-2.5-flash", status: "ERROR", inputTokens: null, outputTokens: null, estimatedCostUsd: null, createdAt: "2026-10-27T10:00:00Z",
    }] }} />);
    expect(screen.getByText("Não informado")).toBeTruthy();
    expect(screen.getByText("Falha")).toBeTruthy();
  });
});
