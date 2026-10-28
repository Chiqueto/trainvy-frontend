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
  createPeriodizationAction: vi.fn(),
  createStandaloneWorkoutPlanAction: vi.fn(),
  createWorkoutPlanInPeriodizationAction: vi.fn(),
  catalogRefresh: vi.fn().mockResolvedValue([]),
  catalog: ["Agachamento", "Remada", "Desenvolvimento"].map((name, index) => ({
    id: `catalog-${index}`,
    name,
    muscles: [],
    ownerUserId: null,
    hasMedia: false,
  })),
}));

vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({
    exercises: mocks.catalog,
    search: (query: string) =>
      mocks.catalog.filter((exercise) =>
        exercise.name.toLowerCase().includes(query.toLowerCase()),
      ),
    isSyncing: false,
    refresh: mocks.catalogRefresh,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/app/planning/_actions", () => ({
  createPeriodizationAction: mocks.createPeriodizationAction,
  createStandaloneWorkoutPlanAction: mocks.createStandaloneWorkoutPlanAction,
  createWorkoutPlanInPeriodizationAction:
    mocks.createWorkoutPlanInPeriodizationAction,
}));

import { PeriodizationForm } from "@/app/planning/_components/periodization-form";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import {
  createInitialWorkoutDays,
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
} from "@/app/planning/_lib/workout-plan-builder";

describe("WorkoutPlanBuilder — lógica de contrato", () => {
  it("inicia com três treinos sequenciais independentes de dias da semana", () => {
    const days = createInitialWorkoutDays();
    expect(days).toHaveLength(3);
    expect(days.map((day) => day.name)).toEqual([
      "Treino A - Peito e Tríceps",
      "Treino B - Costas e Bíceps",
      "Treino C - Pernas e Ombros",
    ]);
    expect(days.every((day) => !day.isRest && day.weekDay === undefined)).toBe(
      true,
    );
  });

  it("serializa descanso, duração, exercícios e ordem no contrato Orval", () => {
    const days = createInitialWorkoutDays();
    days[0] = {
      ...days[0],
      isRest: false,
      name: "Treino A",
      estimatedDurationInMinutes: 50,
      exercises: [
        { name: "Agachamento", sets: 4, reps: 6, restTimeInSeconds: 120 },
        { name: "Afundo", sets: 3, reps: 10, restTimeInSeconds: 60 },
      ],
    };

    days[1] = { ...days[1], isRest: true };
    const serialized = serializeWorkoutDays(days);
    expect(serialized[0]).toMatchObject({
      name: "Treino A",
      weekDay: "MONDAY",
      isRest: false,
      estimatedDurationInSeconds: 3000,
      order: 0,
    });
    expect(serialized[0].exercises.map((exercise) => exercise.order)).toEqual([
      0, 1,
    ]);
    expect(serialized[1]).toMatchObject({
      isRest: true,
      estimatedDurationInSeconds: 0,
      exercises: [],
    });
  });

  it("valida plano, dia de treino e intervalo de datas", () => {
    const days = createInitialWorkoutDays();
    expect(validateWorkoutPlanDraft("", days)).toBe("Informe o nome do plano.");
    expect(
      validateWorkoutPlanDraft("Plano", days, "2027-03-10", "2027-03-01"),
    ).toContain("data final");
    days[0] = {
      ...days[0],
      isRest: false,
      estimatedDurationInMinutes: 45,
      exercises: [],
    };
    expect(validateWorkoutPlanDraft("Plano", days)).toContain(
      "Adicione ao menos um exercício",
    );
  });
});

describe("WorkoutPlanBuilder — interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createStandaloneWorkoutPlanAction.mockResolvedValue({
      success: true,
      data: {
        id: "plan-new",
        name: "Plano novo",
        isActive: false,
        workoutDays: [],
      },
    });
    mocks.createWorkoutPlanInPeriodizationAction.mockResolvedValue({
      success: true,
      data: { id: "block-new", workoutPlan: { isActive: false } },
    });
  });

  afterEach(cleanup);

  function configureMonday() {
    fireEvent.change(screen.getByLabelText("Nome do plano *"), {
      target: { value: "Plano novo" },
    });
    const exercises = ["Agachamento", "Remada", "Desenvolvimento"];
    screen.getAllByRole("article").forEach((card, index) => {
      const expandBtn = within(card).queryByRole("button", {
        name: "Expandir treino",
      });
      if (expandBtn) fireEvent.click(expandBtn);
      fireEvent.click(
        within(card).getByRole("button", {
          name: "Exercício: Selecionar exercício",
        }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: `Selecionar ${exercises[index]}` }),
      );
    });
  }

  it("cria standalone inativo por padrão", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));

    await waitFor(() => {
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalledOnce();
      expect(mocks.push).toHaveBeenCalledWith("/planning");
    });
    const payload = mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0];
    expect(payload.activate).toBe(false);
    expect(payload.workoutDays).toHaveLength(3);
    expect(payload.workoutDays[0].exercises[0]).toMatchObject({
      name: "Agachamento",
      exerciseId: "catalog-0",
      order: 0,
    });
  });

  it("oferece ativação explícita no standalone", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    fireEvent.click(screen.getByLabelText("Tornar este meu plano atual"));
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalled(),
    );
    expect(
      mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0].activate,
    ).toBe(true);
  });

  it("reordena treinos e serializa ordem sequencial com os exercícios preservados", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    const first = screen.getAllByRole("article")[0];
    fireEvent.click(
      within(first).getByRole("button", { name: "Mover treino para baixo" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalledOnce(),
    );
    const days =
      mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0].workoutDays;
    expect(days.map((day: { order: number }) => day.order)).toEqual([0, 1, 2]);
    expect(days[0]).toMatchObject({
      name: "Treino B - Costas e Bíceps",
      exercises: [expect.objectContaining({ name: "Remada" })],
    });
    expect(days[1]).toMatchObject({
      name: "Treino A - Peito e Tríceps",
      exercises: [expect.objectContaining({ name: "Agachamento" })],
    });
  });

  it("cria plano dentro da periodização sem campo de ativação", async () => {
    render(
      <WorkoutPlanBuilder
        mode="periodization"
        periodizationId="periodization-1"
      />,
    );
    configureMonday();
    expect(screen.queryByLabelText("Tornar este meu plano atual")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Criar plano e adicionar etapa" }),
    );
    await waitFor(() =>
      expect(mocks.createWorkoutPlanInPeriodizationAction).toHaveBeenCalledWith(
        "periodization-1",
        expect.not.objectContaining({ activate: expect.anything() }),
      ),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      "/planning/periodizations/periodization-1",
    );
  });

  it("preserva valores após erro da API", async () => {
    mocks.createStandaloneWorkoutPlanAction.mockResolvedValue({
      success: false,
      error: "Existe uma periodização ativa.",
      code: "ACTIVE_PERIODIZATION",
    });
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    fireEvent.change(screen.getByLabelText("Nome do plano *"), {
      target: { value: "Meu plano preservado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));

    expect(
      await screen.findByText("Existe uma periodização ativa."),
    ).toBeDefined();
    expect(
      (screen.getByLabelText("Nome do plano *") as HTMLInputElement).value,
    ).toBe("Meu plano preservado");
  });

  it("busca no catálogo e vincula alternativas e novos exercícios por ID", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    const card = screen.getAllByRole("article")[0];
    expect(within(card).queryByRole("textbox", { name: "Nome" })).toBeNull();
    fireEvent.click(
      within(card).getByRole("button", {
        name: "Alternativa 1: Selecionar exercício",
      }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Buscar exercícios" }),
      { target: { value: "Remada" } },
    );
    expect(
      screen.queryByRole("button", { name: "Selecionar Agachamento" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Remada" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(
      within(card).getByRole("button", {
        name: "Adicionar exercício: Selecionar exercício",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar Desenvolvimento" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalled(),
    );
    expect(
      mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0].workoutDays[0]
        .exercises,
    ).toEqual([
      expect.objectContaining({
        exerciseId: "catalog-0",
        alternative1Name: "Remada",
        alternative1ExerciseId: "catalog-1",
      }),
      expect.objectContaining({
        exerciseId: "catalog-2",
        name: "Desenvolvimento",
        order: 1,
      }),
    ]);
  });

  it("permite remover uma alternativa e cancelar uma adição sem alterar o treino", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureMonday();
    const card = screen.getAllByRole("article")[0];
    fireEvent.click(
      within(card).getByRole("button", {
        name: "Alternativa 2: Selecionar exercício",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Remada" }));
    fireEvent.click(
      within(card).getByRole("button", { name: "Remover alternativa 2" }),
    );
    fireEvent.click(
      within(card).getByRole("button", {
        name: "Adicionar exercício: Selecionar exercício",
      }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Buscar exercícios" }),
      { target: { value: "inexistente" } },
    );
    expect(screen.getByText(/Nenhum exercício encontrado/)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /criar exercício/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fechar catálogo" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalled(),
    );
    const exercises =
      mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0].workoutDays[0]
        .exercises;
    expect(exercises).toHaveLength(1);
    expect(exercises[0]).toMatchObject({
      alternative2Name: null,
      alternative2ExerciseId: null,
    });
  });

  it("inicia com cards recolhidos e expande ao clicar na setinha", () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);

    // Inicialmente recolhidos: inputs internos não estão visíveis
    expect(within(articles[0]).queryByLabelText("Nome do treino")).toBeNull();
    expect(within(articles[0]).getByRole("button", { name: "Expandir treino" })).toBeDefined();

    // Clica para expandir o primeiro treino
    fireEvent.click(within(articles[0]).getByRole("button", { name: "Expandir treino" }));
    expect(within(articles[0]).getByLabelText("Nome do treino")).toBeDefined();
    expect(within(articles[0]).getByLabelText("Duração (min)")).toBeDefined();
    expect(within(articles[0]).getByRole("button", { name: "Recolher treino" })).toBeDefined();

    // Clica para recolher novamente
    fireEvent.click(within(articles[0]).getByRole("button", { name: "Recolher treino" }));
    expect(within(articles[0]).queryByLabelText("Nome do treino")).toBeNull();
  });

  it("expande e recolhe todos os treinos pelo botão global", () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    const toggleAllBtn = screen.getByRole("button", { name: "Expandir todos" });
    fireEvent.click(toggleAllBtn);

    const articles = screen.getAllByRole("article");
    articles.forEach((card) => {
      expect(within(card).getByLabelText("Nome do treino")).toBeDefined();
    });

    const collapseAllBtn = screen.getByRole("button", { name: "Recolher todos" });
    fireEvent.click(collapseAllBtn);

    articles.forEach((card) => {
      expect(within(card).queryByLabelText("Nome do treino")).toBeNull();
    });
  });

  it("ao adicionar um novo treino, ele vem automaticamente expandido", () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Treino" }));

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(4);
    // O último treino (recém adicionado) está expandido
    expect(within(articles[3]).getByLabelText("Nome do treino")).toBeDefined();
    // Os anteriores continuam recolhidos
    expect(within(articles[0]).queryByLabelText("Nome do treino")).toBeNull();
  });

  it("não salva nomes livres de exercícios em rascunhos novos", () => {
    const days = createInitialWorkoutDays().slice(0, 1);
    days[0].exercises[0].name = "Nome livre";
    expect(validateWorkoutPlanDraft("Plano", days)).toContain("no catálogo");
    days[0].exercises[0].exerciseId = "catalog-0";
    expect(validateWorkoutPlanDraft("Plano", days)).toBeNull();
    days[0].exercises[0].alternative1Name = "Outra opção livre";
    expect(validateWorkoutPlanDraft("Plano", days)).toContain("alternativas");
  });
});

describe("PeriodizationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createPeriodizationAction.mockResolvedValue({
      success: true,
      data: { id: "periodization-new", status: "DRAFT" },
    });
  });

  afterEach(cleanup);

  it("cria draft e navega ao detalhe", async () => {
    render(<PeriodizationForm />);
    fireEvent.change(screen.getByLabelText("Nome *"), {
      target: { value: "Pré-Temporada 2027" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar periodização" }));
    await waitFor(() => {
      expect(mocks.createPeriodizationAction).toHaveBeenCalledWith({
        name: "Pré-Temporada 2027",
        goal: null,
        notes: null,
      });
      expect(mocks.push).toHaveBeenCalledWith(
        "/planning/periodizations/periodization-new",
      );
    });
  });

  it("valida nome e preserva o formulário após erro", async () => {
    mocks.createPeriodizationAction.mockResolvedValue({
      success: false,
      error: "Não foi possível concluir a ação.",
    });
    render(<PeriodizationForm />);
    fireEvent.click(screen.getByRole("button", { name: "Criar periodização" }));
    expect(screen.getByText("Informe o nome da periodização.")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Nome *"), {
      target: { value: "Ciclo salvo localmente" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar periodização" }));
    expect(
      await screen.findByText("Não foi possível concluir a ação."),
    ).toBeDefined();
    expect((screen.getByLabelText("Nome *") as HTMLInputElement).value).toBe(
      "Ciclo salvo localmente",
    );
  });
});
