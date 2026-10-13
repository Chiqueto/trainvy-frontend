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

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  updatePeriodizationAction: vi.fn(),
  deletePeriodizationAction: vi.fn(),
  addWorkoutPlanToPeriodizationAction: vi.fn(),
  updatePeriodizationPlanAction: vi.fn(),
  removeWorkoutPlanFromPeriodizationAction: vi.fn(),
  reorderPeriodizationPlansAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/app/planning/_actions", () => ({
  updatePeriodizationAction: mocks.updatePeriodizationAction,
  deletePeriodizationAction: mocks.deletePeriodizationAction,
  addWorkoutPlanToPeriodizationAction:
    mocks.addWorkoutPlanToPeriodizationAction,
  updatePeriodizationPlanAction: mocks.updatePeriodizationPlanAction,
  removeWorkoutPlanFromPeriodizationAction:
    mocks.removeWorkoutPlanFromPeriodizationAction,
  reorderPeriodizationPlansAction: mocks.reorderPeriodizationPlansAction,
}));

import { PeriodizationManagement } from "@/app/planning/_components/periodization-management";
import { PeriodizationStructureEditor } from "@/app/planning/_components/periodization-structure-editor";

const overviewPlans = [
  {
    id: "eligible-plan",
    name: "Upper / Lower",
    isActive: false,
    workoutDaysCount: 7,
    createdAt: "2026-09-01T10:00:00.000Z",
    periodization: null,
  },
  {
    id: "active-plan",
    name: "Plano ativo oculto",
    isActive: true,
    workoutDaysCount: 5,
    createdAt: "2026-09-01T10:00:00.000Z",
    periodization: null,
  },
  {
    id: "linked-plan",
    name: "Plano vinculado oculto",
    isActive: false,
    workoutDaysCount: 4,
    createdAt: "2026-09-01T10:00:00.000Z",
    periodization: {
      id: "other-periodization",
      name: "Outro ciclo",
      periodizationPlanId: "other-block",
      order: 1,
      status: "PLANNED" as const,
    },
  },
];

function block(
  id: string,
  name: string,
  order: number,
  state: "COMPLETED" | "ACTIVE" | "PLANNED",
) {
  return {
    id,
    periodizationId: "periodization-1",
    workoutPlanId: `plan-${id}`,
    order,
    plannedStartDate: null,
    plannedEndDate: null,
    activatedAt: state === "PLANNED" ? null : "2026-09-01T10:00:00.000Z",
    completedAt: state === "COMPLETED" ? "2026-09-20T10:00:00.000Z" : null,
    notes: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    workoutPlan: { id: `plan-${id}`, name, isActive: state === "ACTIVE" },
  };
}

describe("gerenciamento da periodização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updatePeriodizationAction.mockResolvedValue({
      success: true,
      data: { id: "periodization-1", name: "Ciclo editado" },
    });
    mocks.deletePeriodizationAction.mockResolvedValue({
      success: true,
      data: { success: true, message: "ok" },
    });
    mocks.addWorkoutPlanToPeriodizationAction.mockResolvedValue({
      success: true,
      data: { id: "block-new" },
    });
  });

  afterEach(cleanup);

  function renderManagement(
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" = "DRAFT",
  ) {
    return render(
      <PeriodizationManagement
        id="periodization-1"
        status={status}
        name="Pré-temporada"
        goal="Competição"
        notes="Notas"
        plans={overviewPlans}
      />,
    );
  }

  it("edita metadados inclusive em periodização concluída", async () => {
    renderManagement("COMPLETED");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome *"), {
      target: { value: "Ciclo editado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mocks.updatePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
        { name: "Ciclo editado", goal: "Competição", notes: "Notas" },
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Adicionar etapa" }),
    ).toBeNull();
  });

  it("filtra planos elegíveis e adiciona datas opcionais", async () => {
    renderManagement();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar etapa" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Usar plano existente" }),
    );

    expect(screen.getByText("Upper / Lower")).toBeDefined();
    expect(screen.queryByText("Plano ativo oculto")).toBeNull();
    expect(screen.queryByText("Plano vinculado oculto")).toBeNull();
    fireEvent.click(screen.getByLabelText(/Upper \/ Lower/));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Adicionar etapa",
      }),
    );

    await waitFor(() =>
      expect(mocks.addWorkoutPlanToPeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
        {
          workoutPlanId: "eligible-plan",
          plannedStartDate: null,
          plannedEndDate: null,
          notes: null,
        },
      ),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("impede datas inválidas e preserva os campos", () => {
    renderManagement();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar etapa" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Usar plano existente" }),
    );
    fireEvent.click(screen.getByLabelText(/Upper \/ Lower/));
    fireEvent.change(screen.getByLabelText("Início previsto"), {
      target: { value: "2027-03-10" },
    });
    fireEvent.change(screen.getByLabelText("Fim previsto"), {
      target: { value: "2027-03-01" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Adicionar etapa",
      }),
    );
    expect(screen.getByText(/data final não pode/)).toBeDefined();
    expect(mocks.addWorkoutPlanToPeriodizationAction).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText("Início previsto") as HTMLInputElement).value,
    ).toBe("2027-03-10");
  });

  it("exclui somente draft e redireciona ao Hub", async () => {
    const view = renderManagement("DRAFT");
    fireEvent.click(
      screen.getByRole("button", { name: /Excluir periodização/i }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /Excluir definitivamente/i,
      }),
    );
    await waitFor(() => {
      expect(mocks.deletePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
      );
      expect(mocks.push).toHaveBeenCalledWith("/planning");
    });

    view.unmount();
    renderManagement("PAUSED");
    expect(
      screen.queryByRole("button", { name: "Excluir periodização" }),
    ).toBeNull();
  });
});

describe("edição estrutural das etapas", () => {
  const startedPlans = [
    block("completed", "Base concluída", 1, "COMPLETED"),
    block("active", "Força ativa", 2, "ACTIVE"),
    block("future-a", "Potência", 3, "PLANNED"),
    block("future-b", "Pico", 4, "PLANNED"),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updatePeriodizationPlanAction.mockResolvedValue({
      success: true,
      data: {
        id: "future-a",
        plannedStartDate: "2027-03-01",
        plannedEndDate: "2027-03-20",
        notes: "Carga progressiva",
      },
    });
    mocks.removeWorkoutPlanFromPeriodizationAction.mockResolvedValue({
      success: true,
      data: { success: true, message: "ok" },
    });
    mocks.reorderPeriodizationPlansAction.mockResolvedValue({
      success: true,
      data: [],
    });
  });

  afterEach(cleanup);

  it("permite editar etapa planejada e atualiza o detalhe", async () => {
    render(
      <PeriodizationStructureEditor
        periodizationId="periodization-1"
        status="ACTIVE"
        initialPlans={startedPlans}
      />,
    );
    const futureCard = screen.getByText("Potência").closest("article")!;
    fireEvent.click(
      within(futureCard).getByRole("button", { name: "Editar etapa" }),
    );
    fireEvent.change(screen.getByLabelText("Início previsto"), {
      target: { value: "2027-03-01" },
    });
    fireEvent.change(screen.getByLabelText("Fim previsto"), {
      target: { value: "2027-03-20" },
    });
    fireEvent.change(screen.getByLabelText("Notas"), {
      target: { value: "Carga progressiva" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar etapa" }));

    await waitFor(() =>
      expect(mocks.updatePeriodizationPlanAction).toHaveBeenCalledWith(
        "periodization-1",
        "future-a",
        {
          plannedStartDate: "2027-03-01",
          plannedEndDate: "2027-03-20",
          notes: "Carga progressiva",
        },
      ),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("remove apenas etapa planejada", async () => {
    render(
      <PeriodizationStructureEditor
        periodizationId="periodization-1"
        status="ACTIVE"
        initialPlans={startedPlans}
      />,
    );
    expect(
      screen.queryByRole("button", {
        name: "Remover Força ativa da periodização",
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: "Remover Base concluída da periodização",
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Remover Potência da periodização" }),
    );
    expect(
      screen.getByText('Remover "Potência" desta periodização?'),
    ).toBeDefined();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Remover etapa",
      }),
    );
    await waitFor(() =>
      expect(
        mocks.removeWorkoutPlanFromPeriodizationAction,
      ).toHaveBeenCalledWith("periodization-1", "future-a"),
    );
  });

  it("reordena somente blocos futuros e salva uma única vez", async () => {
    render(
      <PeriodizationStructureEditor
        periodizationId="periodization-1"
        status="ACTIVE"
        initialPlans={startedPlans}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Mover Pico para cima" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));

    await waitFor(() =>
      expect(mocks.reorderPeriodizationPlansAction).toHaveBeenCalledWith(
        "periodization-1",
        { periodizationPlanIds: ["future-b", "future-a"] },
      ),
    );
    expect(mocks.reorderPeriodizationPlansAction).toHaveBeenCalledTimes(1);
  });

  it("em draft permite reordenar todos os blocos planejados", async () => {
    const draftPlans = [
      block("draft-a", "A", 1, "PLANNED"),
      block("draft-b", "B", 2, "PLANNED"),
    ];
    render(
      <PeriodizationStructureEditor
        periodizationId="periodization-1"
        status="DRAFT"
        initialPlans={draftPlans}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mover B para cima" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar ordem" }));
    await waitFor(() =>
      expect(mocks.reorderPeriodizationPlansAction).toHaveBeenCalledWith(
        "periodization-1",
        { periodizationPlanIds: ["draft-b", "draft-a"] },
      ),
    );
  });

  it("completed não oferece edição, remoção ou reorder", () => {
    render(
      <PeriodizationStructureEditor
        periodizationId="periodization-1"
        status="COMPLETED"
        initialPlans={[block("completed", "Final", 1, "COMPLETED")]}
      />,
    );
    expect(screen.queryByText("Editar etapa")).toBeNull();
    expect(screen.queryByLabelText(/Mover/)).toBeNull();
    expect(screen.queryByLabelText(/Remover/)).toBeNull();
  });
});
