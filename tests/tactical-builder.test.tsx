import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import {
  biomechanicalAlternatives,
  mergeExercises,
  patchExercise,
  reorderExercises,
  telemetry,
  unmergeExercises,
} from "@/app/planning/_lib/tactical";
import {
  createDraftExercise,
  deserializeWorkoutDays,
  serializeWorkoutDays,
} from "@/app/planning/_lib/workout-plan-builder";
import type {
  GetEditableWorkoutPlan200,
  ListExercises200Item,
} from "@/app/_lib/api/fetch-generated";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  pref: vi.fn(),
  catalog: [
    {
      id: "exercise-1",
      name: "Supino com barra",
      ownerUserId: null,
      hasMedia: false,
      muscles: [
        { muscleGroup: "CHEST", role: "PRIMARY" },
        { muscleGroup: "TRICEPS", role: "SECONDARY" },
      ],
    },
    {
      id: "exercise-2",
      name: "Supino com halteres",
      ownerUserId: null,
      hasMedia: false,
      muscles: [{ muscleGroup: "CHEST", role: "PRIMARY" }],
    },
  ],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/app/planning/_actions", () => ({
  editWorkoutPlanAction: mocks.save,
}));
vi.mock("@/app/planning/_components/tactical/preference-actions", () => ({
  loadBuilderPreference: vi.fn(async () => ({
    userId: "user-a",
    mode: "tactical",
  })),
  saveBuilderPreference: mocks.pref,
}));
vi.mock("@/app/planning/_components/tactical/swap-actions", () => ({
  loadSwapAlternatives: vi.fn(async () => [mocks.catalog[1]]),
}));
vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({
    exercises: mocks.catalog,
    isSyncing: false,
    refresh: vi.fn(async () => []),
    search: () => mocks.catalog,
  }),
}));
vi.mock("@/app/planning/_components/athlete-ai-workout-plan-modal", () => ({
  AthleteAiWorkoutPlanModal: () => null,
}));
const plan = () =>
  ({
    id: "plan",
    name: "Plano tático",
    isActive: false,
    workoutDays: [
      {
        id: "day",
        name: "Treino A",
        weekDay: "MONDAY",
        isRest: false,
        estimatedDurationInSeconds: 3600,
        exercises: mocks.catalog.map((e, i) => ({
          ...createDraftExercise(),
          id: `saved-${i}`,
          exerciseId: e.id,
          name: e.name,
          order: i,
          sets: 3,
          reps: 10,
          restTimeInSeconds: 75,
        })),
      },
    ],
  }) as GetEditableWorkoutPlan200;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.pref.mockResolvedValue(true);
  mocks.save.mockResolvedValue({ success: true, data: { id: "plan" } });
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(cleanup);

describe("Tactical builder", () => {
  it("edits plan settings inside the immersive view using the existing save state", async () => {
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Configurações do plano" }),
    );
    const sheet = screen.getByRole("dialog", {
      name: "Configurações do plano",
    });
    fireEvent.change(within(sheet).getByLabelText(/Nome do plano/), {
      target: { value: "Plano revisado" },
    });
    fireEvent.change(within(sheet).getByLabelText("Nome do treino"), {
      target: { value: "Treino de superiores" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: "Concluir" }));
    expect(
      screen.getByRole("tab", { name: "Treino de superiores" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Selar treino" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(mocks.save.mock.calls[0][1]).toMatchObject({
      name: "Plano revisado",
      workoutDays: [expect.objectContaining({ name: "Treino de superiores" })],
    });
  });
  it("round-trips grouped techniques and per-set loads through the API draft", () => {
    const days = deserializeWorkoutDays(plan());
    days[0].exercises = mergeExercises(days[0].exercises, 1, 0);
    days[0].exercises[0] = {
      ...days[0].exercises[0],
      runes: ["DROP_SET"],
      setPrescription: [
        { reps: 10, zone: "hypertrophy", restSeconds: 75, load: 12.5 },
        { reps: 8, zone: "hypertrophy", restSeconds: 90 },
        { reps: 6, zone: "strength", restSeconds: 120 },
      ],
    };
    const body = serializeWorkoutDays(days);
    const reopened = deserializeWorkoutDays({
      ...plan(),
      workoutDays: body,
    } as GetEditableWorkoutPlan200);
    expect(reopened[0].exercises[0]).toMatchObject({
      runes: ["DROP_SET"],
      setPrescription: days[0].exercises[0].setPrescription,
      supersetGroupId: days[0].exercises[1].supersetGroupId,
    });
    const changed = patchExercise(reopened[0].exercises[0], { reps: 12 });
    expect(changed.setPrescription?.map((s) => s.reps)).toEqual([12, 12, 12]);
    expect(changed.setPrescription?.[0].load).toBe(12.5);
    expect(changed.setPrescription?.[1].restSeconds).toBe(90);
    expect(
      unmergeExercises(reopened[0].exercises, changed.supersetGroupId!)[0]
        .supersetGroupId,
    ).toBeNull();
    const solo = { ...createDraftExercise(), name: "Isolado" };
    const reordered = reorderExercises([...reopened[0].exercises, solo], 0, 2);
    expect(reordered.map((e) => e.name)).toEqual([
      "Isolado",
      ...reopened[0].exercises.map((e) => e.name),
    ]);
  });
  it("computes volume from catalog roles and constrains swaps to a movement family", () => {
    const catalog = mocks.catalog as ListExercises200Item[];
    const item = {
      ...createDraftExercise(),
      exerciseId: catalog[0].id,
      name: catalog[0].name,
    };
    const data = telemetry([item], catalog);
    expect(data.muscles).toMatchObject({ CHEST: 3, TRICEPS: 1.5 });
    expect(
      telemetry([{ ...item, sets: 12, runes: ["DROP_SET"] }], catalog).neural,
    ).toBeGreaterThan(data.neural);
    expect(
      biomechanicalAlternatives(catalog[0], catalog).map((e) => e.id),
    ).toEqual([catalog[1].id]);
  });
  it("keeps fusion, runes, series and exact loads while switching modes and saving", async () => {
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan()} />);
    await waitFor(() =>
      expect(screen.getByTestId("tactical-viewport")).toBeTruthy(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Criar bi-set com Supino com barra" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Combinar com Supino com halteres" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Técnicas de Supino com barra" }),
    );
    const techniqueSheet = screen.getByRole("dialog", {
      name: "Técnicas do exercício",
    });
    fireEvent.click(
      within(techniqueSheet).getByRole("button", { name: /Drop-set/ }),
    );
    fireEvent.click(
      within(techniqueSheet).getByRole("button", { name: "Concluir" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Adicionar série a Supino com barra",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Modo Clássico" }));
    expect(screen.getAllByDisplayValue("4")).toHaveLength(1);
    expect(
      screen
        .getAllByRole("button", { name: "🔥 Drop-set" })[0]
        .getAttribute("aria-pressed"),
    ).toBe("true");
    const loads = screen.getAllByLabelText("Carga kg · 1");
    fireEvent.change(loads[0], { target: { value: "12.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Modo Tático" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Editar Supino com barra" }),
    );
    expect(
      (screen.getAllByLabelText("Carga série 1")[0] as HTMLInputElement).value,
    ).toBe("12.5");
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Ajustar exercício" }),
      ).getByRole("button", { name: "Concluir" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Selar treino" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    const body = mocks.save.mock.calls[0][1];
    expect(body.workoutDays[0].exercises[0]).toMatchObject({
      sets: 4,
      runes: ["DROP_SET"],
      setPrescription: expect.arrayContaining([
        expect.objectContaining({ load: 12.5 }),
      ]),
    });
    expect(body.workoutDays[0].exercises[0].supersetGroupId).toBe(
      body.workoutDays[0].exercises[1].supersetGroupId,
    );
    await waitFor(() =>
      expect(localStorage.getItem("trainvy:builder-mode:user-a")).toBe(
        "tactical",
      ),
    );
  });
  it("swaps a catalog variation without changing individual doses or runes", async () => {
    const initial = plan();
    initial.workoutDays[0].exercises = [
      {
        ...initial.workoutDays[0].exercises[0],
        runes: ["CLUSTER_SET"],
        setPrescription: [
          { reps: 5, zone: "strength", restSeconds: 120, load: 35 },
          { reps: 4, zone: "strength", restSeconds: 125, load: 37.5 },
          { reps: 3, zone: "strength", restSeconds: 150, load: 40 },
        ],
      },
    ];
    render(<WorkoutPlanBuilder mode="edit" initialPlan={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Trocar exercício" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Supino com halteres" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Selar treino" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(
      mocks.save.mock.calls[0][1].workoutDays[0].exercises[0],
    ).toMatchObject({
      exerciseId: "exercise-2",
      runes: ["CLUSTER_SET"],
      setPrescription: initial.workoutDays[0].exercises[0].setPrescription,
    });
  });
  it("adds a card with one tap and selects rest-pause on the exact exercise", async () => {
    render(<WorkoutPlanBuilder mode="edit" initialPlan={plan()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar Supino com barra" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(3);
    const rows = screen.getAllByRole("article");
    fireEvent.click(
      within(rows[2]).getByRole("button", {
        name: "Técnicas de Supino com barra",
      }),
    );
    const sheet = screen.getByRole("dialog", { name: "Técnicas do exercício" });
    fireEvent.click(within(sheet).getByRole("button", { name: /Rest-pause/ }));
    expect(
      within(sheet)
        .getByRole("button", { name: /Rest-pause/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(within(sheet).getByRole("button", { name: "Concluir" }));
    expect(
      within(screen.getAllByRole("article")[2]).getByRole("button", {
        name: "Técnicas de Supino com barra",
      }).textContent,
    ).toContain("Rest-pause");
    expect(
      within(screen.getAllByRole("article")[0]).getByRole("button", {
        name: "Técnicas de Supino com barra",
      }).textContent,
    ).not.toContain("Rest-pause");
    fireEvent.click(screen.getByRole("button", { name: "Selar treino" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(
      mocks.save.mock.calls[0][1].workoutDays[0].exercises[2].runes,
    ).toEqual(["REST_PAUSE"]);
    expect(
      mocks.save.mock.calls[0][1].workoutDays[0].exercises[0].runes,
    ).toEqual([]);
  });
  it("separates a bi-set without removing its techniques, series or loads", async () => {
    const initial = plan();
    initial.workoutDays[0].exercises = initial.workoutDays[0].exercises.map(
      (e) => ({
        ...e,
        supersetGroupId: "group",
        runes: ["REST_PAUSE"],
        targetLoadInGrams: 12500,
      }),
    );
    render(<WorkoutPlanBuilder mode="edit" initialPlan={initial} />);
    expect(screen.getByRole("group", { name: /Bi-set: Supino/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desfazer bi-set" }));
    expect(screen.queryByRole("group", { name: /Bi-set: Supino/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Selar treino" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(
      mocks.save.mock.calls[0][1].workoutDays[0].exercises[0],
    ).toMatchObject({
      supersetGroupId: null,
      sets: 3,
      targetLoadInGrams: 12500,
      runes: ["REST_PAUSE"],
    });
  });
});
