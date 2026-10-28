import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GetEditableWorkoutPlan200,
  ListAdminPlans200Item,
} from "@/app/_lib/api/fetch-generated";
const mocks = vi.hoisted(() => ({
  sports: vi.fn(),
  metrics: vi.fn(),
  create: vi.fn(),
  permissions: vi.fn(),
  edit: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/app/_actions/sports-profile", () => ({
  saveSportsProfileAction: mocks.sports,
}));
vi.mock("@/app/_actions/metrics", () => ({
  saveUserMetricsAction: mocks.metrics,
}));
vi.mock("@/app/admin/_actions", () => ({
  createAdminPlanAction: mocks.create,
  saveAdminEntitlements: mocks.permissions,
}));
vi.mock("@/app/planning/_actions", () => ({
  editWorkoutPlanAction: mocks.edit,
  createStandaloneWorkoutPlanAction: vi.fn(),
  createWorkoutPlanInPeriodizationAction: vi.fn(),
}));
vi.mock("@/app/planning/_components/athlete-ai-workout-plan-modal", () => ({
  AthleteAiWorkoutPlanModal: () => null,
}));
import { SportsProfileForm } from "@/app/profile/_components/sports-profile-form";
import { EditMetricsDialog } from "@/app/_components/metrics/edit-metrics-dialog";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import {
  createInitialWorkoutDays,
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
} from "@/app/planning/_lib/workout-plan-builder";
import { PlansList } from "@/app/admin/_components/plans-list";
import { PrescriptionTargets } from "@/app/_components/prescription-targets";
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
const emptyProfile = {
  trainingGoals: null,
  experienceLevel: null,
  availableEquipment: [],
  trainingRestrictions: null,
};
const commercial: ListAdminPlans200Item = {
  id: "plan",
  code: "COACH",
  name: "Coach",
  description: null,
  audience: "COACH",
  monthlyPriceInCents: 3990,
  currency: "BRL",
  isPublic: true,
  isActive: true,
  sortOrder: 0,
  entitlements: [{ entitlement: "MANAGE_ATHLETES", limitValue: 5 }],
};
describe("Optional sports profile", () => {
  it("saves goals, experience, equipment and restrictions without requiring body measurements", async () => {
    mocks.sports.mockResolvedValue({ success: true, data: emptyProfile });
    render(<SportsProfileForm initial={emptyProfile} />);
    fireEvent.click(screen.getByText("Editar objetivos e preferências"));
    fireEvent.change(screen.getByLabelText("Objetivos"), {
      target: { value: "Ganhar força" },
    });
    fireEvent.change(screen.getByLabelText("Experiência"), {
      target: { value: "INTERMEDIATE" },
    });
    fireEvent.change(screen.getByLabelText("Equipamentos disponíveis"), {
      target: { value: "Barra, Halteres, Barra" },
    });
    fireEvent.change(
      screen.getByLabelText("Restrições e cuidados declarados"),
      { target: { value: "Cuidado declarado" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar perfil esportivo" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("salvo"),
    );
    expect(mocks.sports).toHaveBeenCalledWith({
      trainingGoals: "Ganhar força",
      experienceLevel: "INTERMEDIATE",
      availableEquipment: ["Barra", "Halteres"],
      trainingRestrictions: "Cuidado declarado",
    });
    expect(mocks.metrics).not.toHaveBeenCalled();
  });
  it("retains input after failure", async () => {
    mocks.sports.mockResolvedValue({ success: false, error: "Sem conexão" });
    render(<SportsProfileForm initial={emptyProfile} />);
    fireEvent.click(screen.getByText("Editar objetivos e preferências"));
    fireEvent.change(screen.getByLabelText("Objetivos"), {
      target: { value: "Objetivo mantido" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar perfil esportivo" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Sem conexão"),
    );
    expect(
      (screen.getByLabelText("Objetivos") as HTMLTextAreaElement).value,
    ).toBe("Objetivo mantido");
  });
  it("submits an empty body-fat field as null instead of inventing zero", async () => {
    mocks.metrics.mockResolvedValue({ success: true });
    render(
      <EditMetricsDialog
        isOpen
        onClose={vi.fn()}
        initialData={{
          weightInGrams: 80000,
          heightInCentimeters: 180,
          age: 30,
          bodyFatPercentage: null,
        }}
      />,
    );
    const field = screen.getByLabelText(
      "Gordura (% GC, opcional)",
    ) as HTMLInputElement;
    expect(field.required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Medições" }));
    await waitFor(() =>
      expect(mocks.metrics).toHaveBeenCalledWith({
        weightInGrams: 80000,
        heightInCentimeters: 180,
        age: 30,
        bodyFatPercentage: null,
      }),
    );
  });
});
describe("Optional advanced prescription", () => {
  const initial: GetEditableWorkoutPlan200 = {
    id: "plan",
    name: "Plano",
    isActive: false,
    workoutDays: [
      {
        id: "day",
        order: 0,
        weekDay: "MONDAY",
        name: "A",
        isRest: false,
        estimatedDurationInSeconds: 3600,
        exercises: [
          {
            id: "ex",
            name: "Supino",
            order: 0,
            warmupSets: 0,
            sets: 3,
            reps: 10,
            restTimeInSeconds: 90,
          },
        ],
      },
    ],
  };
  it("converts target kilograms to grams, keeps zero RIR and submits cadence and range", async () => {
    mocks.edit.mockResolvedValue({ success: true, data: { id: "plan" } });
    render(<WorkoutPlanBuilder mode="edit" initialPlan={initial} />);
    const article = screen.getByRole("article");
    fireEvent.click(
      within(article).getByText("Prescrição avançada (opcional)"),
    );
    fireEvent.change(within(article).getByLabelText("Repetições mínimas"), {
      target: { value: "8" },
    });
    fireEvent.change(within(article).getByLabelText("Repetições máximas"), {
      target: { value: "12" },
    });
    fireEvent.change(within(article).getByLabelText("RIR alvo"), {
      target: { value: "0" },
    });
    fireEvent.change(within(article).getByLabelText("Carga alvo (kg)"), {
      target: { value: "12.5" },
    });
    fireEvent.change(within(article).getByLabelText("Cadência"), {
      target: { value: "3-1-1-0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.edit).toHaveBeenCalled());
    expect(
      mocks.edit.mock.calls[0][1].workoutDays[0].exercises[0],
    ).toMatchObject({
      repsMin: 8,
      repsMax: 12,
      targetRir: 0,
      targetLoadInGrams: 12500,
      tempo: "3-1-1-0",
    });
  });
  it("rejects partial/inverted ranges but retains the fixed-rep workflow", () => {
    const days = createInitialWorkoutDays().map((day) => ({
      ...day,
      exercises: [{ exerciseId: "catalog-supino", name: "Supino", sets: 3, reps: 10, restTimeInSeconds: 90 }],
    }));
    expect(validateWorkoutPlanDraft("Plano", days)).toBeNull();
    expect(serializeWorkoutDays(days)[0].exercises[0]).toMatchObject({
      reps: 10,
      repsMin: null,
      repsMax: null,
      targetRir: null,
    });
    expect(
      validateWorkoutPlanDraft("Plano", [
        { ...days[0], exercises: [{ ...days[0].exercises[0], repsMin: 8 }] },
      ]),
    ).toContain("faixa");
    expect(
      validateWorkoutPlanDraft("Plano", [
        {
          ...days[0],
          exercises: [{ ...days[0].exercises[0], repsMin: 12, repsMax: 8 }],
        },
      ]),
    ).toContain("faixa");
  });
  it("labels prescribed goals and preserves zeros in presentation", () => {
    render(
      <PrescriptionTargets
        value={{
          repsMin: 8,
          repsMax: 12,
          targetRir: 0,
          targetLoadInGrams: 0,
          tempo: "3-1-1-0",
        }}
      />,
    );
    expect(screen.getByText("8–12 reps")).toBeTruthy();
    expect(screen.getByText("RIR alvo 0")).toBeTruthy();
    expect(screen.getByText("Carga alvo 0 kg")).toBeTruthy();
  });
});
describe("Dynamic commercial plans in admin", () => {
  it("edits permissions and quota without sending a price change", async () => {
    mocks.permissions.mockResolvedValue({
      success: true,
      data: {
        ...commercial,
        entitlements: [
          { entitlement: "MANAGE_ATHLETES", limitValue: 0 },
          { entitlement: "ASSIGN_WORKOUTS", limitValue: null },
        ],
      },
    });
    render(<PlansList initial={[commercial]} />);
    fireEvent.click(screen.getByText("Editar permissões"));
    fireEvent.click(screen.getByLabelText("Atribuir treinos"));
    fireEvent.change(
      screen.getByLabelText("Limite de atletas (vazio = sem limite)"),
      { target: { value: "0" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar permissões" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("salvas"),
    );
    expect(mocks.permissions).toHaveBeenCalledWith("plan", {
      entitlements: [
        { entitlement: "MANAGE_ATHLETES", limitValue: 0 },
        { entitlement: "ASSIGN_WORKOUTS", limitValue: null },
      ],
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("creates a private plan by default with initial price and selected permissions", async () => {
    mocks.create.mockResolvedValue({
      success: true,
      data: {
        ...commercial,
        id: "new",
        code: "NOVO",
        name: "Novo Coach",
        monthlyPriceInCents: 4990,
        isPublic: false,
      },
    });
    render(<PlansList initial={[commercial]} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo plano" }));
    fireEvent.change(screen.getByLabelText("Nome do plano"), {
      target: { value: "Novo Coach" },
    });
    fireEvent.change(screen.getByLabelText("Código único"), {
      target: { value: "novo" },
    });
    fireEvent.change(
      screen.getByLabelText("Preço inicial de referência (R$)"),
      { target: { value: "49,90" } },
    );
    const form = screen.getByRole("form", { name: "Criar plano comercial" });
    fireEvent.click(within(form).getByLabelText("Área do personal"));
    fireEvent.click(within(form).getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Plano criado."),
    );
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "NOVO",
        monthlyPriceInCents: 4990,
        isPublic: false,
        entitlements: [{ entitlement: "COACH_DASHBOARD", limitValue: null }],
      }),
    );
    expect(screen.getByText("Novo Coach")).toBeTruthy();
  });
  it("preserves the creation form on a duplicate-code error", async () => {
    mocks.create.mockResolvedValue({
      success: false,
      code: "PLAN_CODE_ALREADY_EXISTS",
    });
    render(<PlansList initial={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo plano" }));
    fireEvent.change(screen.getByLabelText("Nome do plano"), {
      target: { value: "Novo" },
    });
    fireEvent.change(screen.getByLabelText("Código único"), {
      target: { value: "COACH" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Já existe"),
    );
    expect(
      (screen.getByLabelText("Nome do plano") as HTMLInputElement).value,
    ).toBe("Novo");
  });
});
