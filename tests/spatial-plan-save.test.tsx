import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import { CoachTemplateBuilder } from "@/app/personal/modelos/_components/coach-template-builder";
import { CoachPrescriptionBuilder } from "@/app/personal/alunos/[athleteId]/_components/coach-prescription-builder";
import type { GetEditableWorkoutPlan200 } from "@/app/_lib/api/fetch-generated";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  edit: vi.fn(),
  periodization: vi.fn(),
  template: vi.fn(),
  updateTemplate: vi.fn(),
  prescription: vi.fn(),
  updatePrescription: vi.fn(),
  send: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  catalog: [
    {
      id: "catalog-bench",
      name: "Supino com barra",
      ownerUserId: null,
      hasMedia: false,
      muscles: [{ id: "chest", muscleGroup: "CHEST", role: "PRIMARY" }],
    },
  ],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/planning/_actions", () => ({
  createStandaloneWorkoutPlanAction: mocks.create,
  editWorkoutPlanAction: mocks.edit,
  createWorkoutPlanInPeriodizationAction: mocks.periodization,
}));
vi.mock("@/app/personal/_actions", () => ({
  createTemplateAction: mocks.template,
  updateTemplateAction: mocks.updateTemplate,
  createPrescriptionDraftAction: mocks.prescription,
  updatePrescriptionDraftAction: mocks.updatePrescription,
  sendPrescriptionAction: mocks.send,
}));
vi.mock("@/app/planning/_components/tactical/preference-actions", () => ({
  loadBuilderPreference: vi.fn(async () => ({
    userId: "user",
    mode: "tactical",
  })),
  saveBuilderPreference: vi.fn(async () => true),
}));
vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({
    exercises: mocks.catalog,
    search: () => mocks.catalog,
    isSyncing: false,
    refresh: vi.fn(async () => mocks.catalog),
  }),
}));
vi.mock("@/app/planning/_components/athlete-ai-workout-plan-modal", () => ({
  AthleteAiWorkoutPlanModal: () => null,
}));
vi.mock(
  "@/app/personal/alunos/[athleteId]/_components/coach-ai-prescription-modal",
  () => ({ CoachAiPrescriptionModal: () => null }),
);

const exercise = {
  id: "saved-exercise",
  exerciseId: "catalog-bench",
  name: "Supino com barra",
  order: 0,
  sets: 3,
  reps: 10,
  restTimeInSeconds: 75,
  warmupSets: 0,
};
const day = {
  id: "saved-day",
  name: "Treino A",
  weekDay: "MONDAY" as const,
  order: 0,
  isRest: false,
  estimatedDurationInSeconds: 3600,
  exercises: [exercise],
};
const plan = {
  id: "plan",
  name: "Plano original",
  isActive: false,
  workoutDays: [day],
} as GetEditableWorkoutPlan200;
const header = () => screen.getByRole("textbox", { name: "Nome do plano" });
function openSettings() {
  fireEvent.click(
    screen.getByRole("button", { name: "Configurações do plano" }),
  );
  return screen.getByRole("dialog", { name: "Configurações do plano" });
}
function closeSettings(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("button", { name: "Concluir" }));
}
function prepareOneDay() {
  const dialog = openSettings();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Excluir treino" }),
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Excluir treino" }),
  );
  fireEvent.change(within(dialog).getByLabelText("Nome do treino"), {
    target: { value: "Treino principal" },
  });
  fireEvent.change(within(dialog).getByLabelText("Duração (min)"), {
    target: { value: "45" },
  });
  closeSettings(dialog);
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar Supino com barra" }),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  for (const action of [
    mocks.create,
    mocks.edit,
    mocks.periodization,
    mocks.template,
    mocks.updateTemplate,
  ])
    action.mockResolvedValue({ success: true, data: { id: "created" } });
  mocks.prescription.mockResolvedValue({
    success: true,
    data: { id: "draft", version: 1 },
  });
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
});

describe("Spatial plan editor and save parity", () => {
  it("keeps manual creation available for an AI deep link when AI is disabled", () => {
    render(<WorkoutPlanBuilder mode="standalone" initialOpenAi />);
    expect(screen.getByTestId("tactical-viewport")).toBeDefined();
    expect(
      screen.getByRole("textbox", { name: "Nome do plano" }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", {
        name: /Gerar com IA|Abrir assistente de IA/,
      }),
    ).toBeNull();
  });

  it("creates a named plan, preserving manual duration, warm-up and technique inputs through an API failure and retry", async () => {
    mocks.create
      .mockResolvedValueOnce({
        success: false,
        error: "Falha de teste ao salvar",
      })
      .mockResolvedValueOnce({ success: true, data: { id: "created" } });
    render(<WorkoutPlanBuilder mode="standalone" />);
    expect(header()).toBeDefined();
    fireEvent.change(header(), { target: { value: "Plano de força" } });
    prepareOneDay();
    const dialog = openSettings();
    fireEvent.click(
      within(dialog).getByRole("checkbox", {
        name: "Tornar este meu plano atual",
      }),
    );
    closeSettings(dialog);
    fireEvent.click(screen.getByRole("button", { name: "Editar prescrição" }));
    const prescription = screen.getByRole("dialog", {
      name: "Supino com barra",
    });
    fireEvent.change(
      within(prescription).getByLabelText("Aquecimento (séries)"),
      { target: { value: "2" } },
    );
    fireEvent.change(
      within(prescription).getByLabelText("Descanso entre séries (s)"),
      { target: { value: "95" } },
    );
    fireEvent.click(
      within(prescription).getByRole("tab", { name: "Técnicas" }),
    );
    fireEvent.click(
      within(prescription).getByRole("checkbox", { name: "Rest-pause" }),
    );
    fireEvent.change(within(prescription).getByLabelText("Pausa interna (s)"), {
      target: { value: "17" },
    });
    expect(
      within(prescription)
        .getByRole("checkbox", { name: "Rest-pause" })
        .closest("label")
        ?.querySelector("svg"),
    ).not.toBeNull();
    fireEvent.click(
      within(prescription).getByRole("button", { name: "Concluir" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Aumentar repetições" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano" }));
    await screen.findByRole("alert");
    expect(mocks.push).not.toHaveBeenCalled();
    expect((header() as HTMLInputElement).value).toBe("Plano de força");
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Salvar plano",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
    expect(mocks.create.mock.calls[1][0]).toMatchObject({
      name: "Plano de força",
      activate: true,
      workoutDays: [
        {
          name: "Treino principal",
          estimatedDurationInSeconds: 2700,
          exercises: [
            {
              exerciseId: "catalog-bench",
              warmupSets: 2,
              reps: 11,
              restTimeInSeconds: 95,
              runes: ["REST_PAUSE"],
              runeConfig: { REST_PAUSE: 17 },
            },
          ],
        },
      ],
    });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/planning"));
  });
  it("keeps names and day organization consistent with classic view and saves edits through the original action", async () => {
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan} />);
    fireEvent.change(header(), { target: { value: "Plano atualizado" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do treino" }), {
      target: { value: "Treino de superiores" },
    });
    expect(
      screen.getByRole("tab", { name: "Treino de superiores" }),
    ).toBeDefined();
    const dialog = openSettings();
    expect(
      (within(dialog).getByLabelText("Nome do treino") as HTMLInputElement)
        .value,
    ).toBe("Treino de superiores");
    fireEvent.change(within(dialog).getByLabelText("Duração (min)"), {
      target: { value: "42" },
    });
    fireEvent.change(within(dialog).getByLabelText("Dia de referência"), {
      target: { value: "WEDNESDAY" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Duplicar treino" }),
    );
    fireEvent.change(within(dialog).getByLabelText("Nome do treino"), {
      target: { value: "Treino B" },
    });
    fireEvent.change(within(dialog).getByLabelText("Duração (min)"), {
      target: { value: "30" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "← Mover antes" }),
    );
    closeSettings(dialog);
    fireEvent.click(
      screen.getByRole("button", { name: "Voltar ao editor por cards" }),
    );
    expect(
      (screen.getByLabelText("Nome do plano *") as HTMLInputElement).value,
    ).toBe("Plano atualizado");
    fireEvent.click(screen.getByRole("button", { name: "Deck 3D" }));
    expect((header() as HTMLInputElement).value).toBe("Plano atualizado");
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(mocks.edit).toHaveBeenCalled());
    expect(mocks.edit.mock.calls[0][0]).toBe("plan");
    const payload = mocks.edit.mock.calls[0][1];
    expect(payload.name).toBe("Plano atualizado");
    expect(
      payload.workoutDays.map(
        (d: {
          name: string;
          estimatedDurationInSeconds: number;
          weekDay: string;
        }) => [d.name, d.estimatedDurationInSeconds, d.weekDay],
      ),
    ).toEqual([
      ["Treino B", 1800, "WEDNESDAY"],
      ["Treino de superiores", 2520, "WEDNESDAY"],
    ]);
  });
  it("edits periodization dates and notes from the same settings used by the normal editor", async () => {
    render(
      <WorkoutPlanBuilder mode="periodization" periodizationId="period" />,
    );
    fireEvent.change(header(), { target: { value: "Etapa força" } });
    prepareOneDay();
    const dialog = openSettings();
    fireEvent.change(within(dialog).getByLabelText("Início previsto"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.change(within(dialog).getByLabelText("Fim previsto"), {
      target: { value: "2026-12-20" },
    });
    fireEvent.change(within(dialog).getByLabelText("Notas da etapa"), {
      target: { value: "Progressão revisada" },
    });
    closeSettings(dialog);
    fireEvent.click(screen.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(mocks.periodization).toHaveBeenCalled());
    expect(mocks.periodization).toHaveBeenCalledWith(
      "period",
      expect.objectContaining({
        name: "Etapa força",
        plannedStartDate: "2026-12-01",
        plannedEndDate: "2026-12-20",
        notes: "Progressão revisada",
      }),
    );
  });
  it("edits model name and description and saves the reusable model", async () => {
    render(
      <CoachTemplateBuilder
        initialData={{ name: "Modelo original", workoutDays: [day] }}
      />,
    );
    fireEvent.change(header(), { target: { value: "Modelo editado" } });
    const dialog = openSettings();
    fireEvent.change(within(dialog).getByLabelText("Descrição (Opcional)"), {
      target: { value: "Foco em progressão" },
    });
    closeSettings(dialog);
    fireEvent.click(screen.getByRole("button", { name: "Salvar modelo" }));
    await waitFor(() => expect(mocks.template).toHaveBeenCalled());
    expect(mocks.template).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Modelo editado",
        description: "Foco em progressão",
      }),
    );
  });
  it("edits the personal plan fields and saves a draft without sending it to the athlete", async () => {
    render(
      <CoachPrescriptionBuilder
        athleteId="athlete"
        athleteName="Ana"
        initialData={{ name: "Ficha original", workoutDays: [day] }}
      />,
    );
    fireEvent.change(header(), { target: { value: "Ficha da Ana" } });
    const dialog = openSettings();
    fireEvent.change(
      within(dialog).getByLabelText("Orientações ao Aluno (opcional)"),
      { target: { value: "Ajustar carga" } },
    );
    fireEvent.click(
      within(dialog).getByRole("checkbox", {
        name: /Permitir substituições durante a sessão/,
      }),
    );
    closeSettings(dialog);
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(mocks.prescription).toHaveBeenCalled());
    expect(mocks.prescription).toHaveBeenCalledWith(
      expect.objectContaining({
        athleteId: "athlete",
        name: "Ficha da Ana",
        notes: "Ajustar carga",
        allowStudentSubstitution: false,
      }),
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
