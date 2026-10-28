import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  activateWorkoutPlanAction: vi.fn(),
  deactivateWorkoutPlanAction: vi.fn(),
  duplicateWorkoutPlanAction: vi.fn(),
  deleteWorkoutPlanAction: vi.fn(),
  activatePeriodizationAction: vi.fn(),
  deactivatePeriodizationAction: vi.fn(),
  advancePeriodizationAction: vi.fn(),
  completePeriodizationAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/app/planning/_actions", () => ({
  activateWorkoutPlanAction: mocks.activateWorkoutPlanAction,
  deactivateWorkoutPlanAction: mocks.deactivateWorkoutPlanAction,
  duplicateWorkoutPlanAction: mocks.duplicateWorkoutPlanAction,
  deleteWorkoutPlanAction: mocks.deleteWorkoutPlanAction,
  activatePeriodizationAction: mocks.activatePeriodizationAction,
  deactivatePeriodizationAction: mocks.deactivatePeriodizationAction,
  advancePeriodizationAction: mocks.advancePeriodizationAction,
  completePeriodizationAction: mocks.completePeriodizationAction,
}));

import { PeriodizationActions } from "@/app/planning/_components/periodization-actions";
import { WorkoutPlanCard } from "@/app/planning/_components/workout-plan-card";

const inactivePlan = {
  id: "plan-1",
  name: "Hipertrofia ABC",
  isActive: false,
  workoutDaysCount: 3,
  createdAt: "2026-09-01T10:00:00.000Z",
  periodization: null,
};

const activePlan = { ...inactivePlan, isActive: true };

function successfulPeriodization(status = "ACTIVE") {
  return {
    success: true,
    data: {
      id: "periodization-1",
      name: "Pré-temporada",
      status,
      startedAt: "2026-09-01T10:00:00.000Z",
      completedAt: status === "COMPLETED" ? "2026-09-30T10:00:00.000Z" : null,
      currentBlock: null,
    },
  };
}

describe("ações interativas de planos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activateWorkoutPlanAction.mockResolvedValue({
      success: true,
      data: { id: "plan-1", name: "Hipertrofia ABC", isActive: true },
    });
    mocks.deactivateWorkoutPlanAction.mockResolvedValue({
      success: true,
      data: { id: "plan-1", name: "Hipertrofia ABC", isActive: false },
    });
    mocks.duplicateWorkoutPlanAction.mockResolvedValue({
      success: true,
      data: { id: "copy-1", name: "Hipertrofia ABC - Cópia", workoutDays: [] },
    });
  });

  afterEach(cleanup);

  function openMenu() {
    fireEvent.keyDown(screen.getByRole("button", { name: /ações do plano/i }), {
      key: "ArrowDown",
    });
    return screen.getByRole("menu");
  }

  it("mantém excluir acessível no menu em portal e confirma antes de excluir", async () => {
    mocks.deleteWorkoutPlanAction.mockResolvedValue({ success: true });
    const { container } = render(<WorkoutPlanCard plan={inactivePlan} />);
    const menu = openMenu();
    expect(container.contains(menu)).toBe(false);
    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Excluir definitivamente" }),
    );
    expect(mocks.deleteWorkoutPlanAction).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", {
      name: "Excluir plano definitivamente",
    });
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.textContent).toContain("continuarão preservados");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Excluir definitivamente" }),
    );
    await waitFor(() =>
      expect(mocks.deleteWorkoutPlanAction).toHaveBeenCalledWith("plan-1"),
    );
  });

  it("ativa um plano standalone após confirmação e atualiza o Hub", async () => {
    render(<WorkoutPlanCard plan={inactivePlan} />);

    fireEvent.click(
      within(openMenu()).getByRole("menuitem", { name: "Ativar plano" }),
    );
    expect(screen.getByText("Tornar este seu plano atual?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ativar plano" }));

    await waitFor(() => {
      expect(mocks.activateWorkoutPlanAction).toHaveBeenCalledWith("plan-1");
      expect(mocks.refresh).toHaveBeenCalledOnce();
      expect(screen.getByText("Plano ativado com sucesso.")).toBeDefined();
    });
  });

  it("desativa plano standalone ativo com a advertência solicitada", async () => {
    render(<WorkoutPlanCard plan={activePlan} />);

    fireEvent.click(
      within(openMenu()).getByRole("menuitem", { name: "Desativar plano" }),
    );
    expect(screen.getByText("Você ficará sem um plano ativo.")).toBeDefined();
    expect(
      screen.getByText("Treinos avulsos continuarão disponíveis."),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Desativar plano" }));

    await waitFor(() => {
      expect(mocks.deactivateWorkoutPlanAction).toHaveBeenCalledWith("plan-1");
    });
  });

  it("duplica plano com nome preenchido e editável", async () => {
    render(<WorkoutPlanCard plan={inactivePlan} />);

    fireEvent.click(
      within(openMenu()).getByRole("menuitem", { name: "Duplicar" }),
    );
    const nameInput = screen.getByLabelText(
      "Nome da cópia",
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("Hipertrofia ABC - Cópia");
    fireEvent.change(nameInput, { target: { value: "Meu novo plano" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar cópia" }));

    await waitFor(() => {
      expect(mocks.duplicateWorkoutPlanAction).toHaveBeenCalledWith(
        "plan-1",
        "Meu novo plano",
      );
      expect(
        screen.getByText("Cópia criada como plano inativo."),
      ).toBeDefined();
    });
  });

  it("desabilita a confirmação durante pending e impede double-submit", async () => {
    let resolveAction: ((value: unknown) => void) | undefined;
    mocks.activateWorkoutPlanAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    render(<WorkoutPlanCard plan={inactivePlan} />);
    fireEvent.click(
      within(openMenu()).getByRole("menuitem", { name: "Ativar plano" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ativar plano" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Ativando...",
    });
    expect(pendingButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(pendingButton);
    expect(mocks.activateWorkoutPlanAction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction?.({
        success: true,
        data: { id: "plan-1", name: "Hipertrofia ABC", isActive: true },
      });
    });
  });

  it("não oferece ativar/desativar diretamente para plano de periodização", () => {
    render(
      <WorkoutPlanCard
        plan={{
          ...inactivePlan,
          periodization: {
            id: "periodization-1",
            name: "Pré-temporada",
            periodizationPlanId: "block-1",
            order: 1,
            status: "PLANNED",
          },
        }}
      />,
    );

    const menu = openMenu();
    expect(within(menu).queryByText("Ativar plano")).toBeNull();
    expect(within(menu).queryByText("Desativar plano")).toBeNull();
    expect(within(menu).getByText("Duplicar")).toBeDefined();
  });

  it("exibe ACTIVE_WORKOUT_SESSION como erro amigável", async () => {
    mocks.activateWorkoutPlanAction.mockResolvedValue({
      success: false,
      code: "ACTIVE_WORKOUT_SESSION",
      error: "Finalize seu treino atual antes de alterar o planejamento.",
    });
    render(<WorkoutPlanCard plan={inactivePlan} />);

    fireEvent.click(
      within(openMenu()).getByRole("menuitem", { name: "Ativar plano" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ativar plano" }));

    expect(
      await screen.findByText(
        "Finalize seu treino atual antes de alterar o planejamento.",
      ),
    ).toBeDefined();
  });
});

describe("ações interativas de periodização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activatePeriodizationAction.mockResolvedValue(
      successfulPeriodization(),
    );
    mocks.deactivatePeriodizationAction.mockResolvedValue(
      successfulPeriodization("PAUSED"),
    );
    mocks.advancePeriodizationAction.mockResolvedValue(
      successfulPeriodization(),
    );
    mocks.completePeriodizationAction.mockResolvedValue(
      successfulPeriodization("COMPLETED"),
    );
  });

  afterEach(cleanup);

  it("ativa draft e retoma paused pelo mesmo endpoint", async () => {
    const firstRender = render(
      <PeriodizationActions
        id="periodization-1"
        status="DRAFT"
        totalBlocks={2}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ativar periodização" }),
    );
    expect(
      screen.getByText(
        "Ao ativar esta periodização, seu plano atual poderá ser substituído.",
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ativar" }));
    await waitFor(() =>
      expect(mocks.activatePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
      ),
    );

    firstRender.unmount();
    render(
      <PeriodizationActions
        id="periodization-1"
        status="PAUSED"
        totalBlocks={2}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Retomar periodização" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retomar" }));
    await waitFor(() =>
      expect(mocks.activatePeriodizationAction).toHaveBeenCalledTimes(2),
    );
  });

  it("pausa uma periodização ativa preservando o progresso", async () => {
    render(
      <PeriodizationActions
        id="periodization-1"
        status="ACTIVE"
        totalBlocks={2}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(
      screen.getByText(
        "O progresso será preservado e você poderá retomar depois.",
      ),
    ).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: "Pausar periodização" }),
    );
    await waitFor(() => {
      expect(mocks.deactivatePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
      );
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("avança da etapa atual para a próxima sem sair do detalhe", async () => {
    render(
      <PeriodizationActions
        id="periodization-1"
        status="ACTIVE"
        totalBlocks={2}
        currentBlockName="Força"
        nextBlockName="Potência"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Concluir etapa e avançar" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Força");
    expect(dialog.textContent).toContain("Potência");
    fireEvent.click(screen.getByRole("button", { name: "Concluir e avançar" }));
    await waitFor(() => {
      expect(mocks.advancePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
      );
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("usa copy de conclusão na última etapa", async () => {
    mocks.advancePeriodizationAction.mockResolvedValue(
      successfulPeriodization("COMPLETED"),
    );
    render(
      <PeriodizationActions
        id="periodization-1"
        status="ACTIVE"
        totalBlocks={1}
        currentBlockName="Força"
        isLastBlock
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Concluir etapa e avançar" }),
    );
    expect(
      screen.getByText("Concluir última etapa e finalizar periodização?"),
    ).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: "Concluir e finalizar" }),
    );
    expect(
      await screen.findByText(
        "Última etapa concluída. Periodização finalizada.",
      ),
    ).toBeDefined();
  });

  it("encerra manualmente com confirmação destrutiva explícita", async () => {
    render(
      <PeriodizationActions
        id="periodization-1"
        status="ACTIVE"
        totalBlocks={3}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Encerrar periodização" }),
    );
    expect(screen.getByText("Encerrar esta periodização agora?")).toBeDefined();
    expect(screen.getByText(/etapas futuras/)).toBeDefined();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Encerrar periodização",
      }),
    );
    await waitFor(() =>
      expect(mocks.completePeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
      ),
    );
  });

  it("mantém completed read-only e draft vazio sem ativação válida", () => {
    const { rerender } = render(
      <PeriodizationActions
        id="periodization-1"
        status="COMPLETED"
        totalBlocks={2}
      />,
    );
    expect(screen.queryByLabelText("Ações da periodização")).toBeNull();

    rerender(
      <PeriodizationActions
        id="periodization-1"
        status="DRAFT"
        totalBlocks={0}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Adicione uma etapa para ativar",
    });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Ativar periodização")).toBeNull();
  });
});
