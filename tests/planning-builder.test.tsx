// Existing form coverage explicitly exercises the classic view. Tactical parity has its own suite.
vi.mock("@/app/planning/_components/tactical/view-mode-toggle", () => ({
  useBuilderMode: () => ({
    builderMode: "classic",
    changeMode: vi.fn(),
    syncError: false,
  }),
  ViewModeToggle: () => null,
}));
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
  getExerciseMediaAction: vi.fn(),
  catalogRefresh: vi.fn().mockResolvedValue([]),
  catalog: ["Agachamento", "Remada", "Desenvolvimento"].map((name, index) => ({
    id: `catalog-${index}`,
    name,
    muscles: [],
    ownerUserId: null,
    hasMedia: name !== "Desenvolvimento",
    thumbnailUrl:
      name === "Agachamento"
        ? "/exercises/catalog-0/thumbnail?v=frame.webp"
        : undefined,
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

vi.mock("@/app/_actions/exercise-media", () => ({
  getExerciseMediaAction: mocks.getExerciseMediaAction,
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

import { ExerciseThumbnail } from "@/app/_components/exercise-media/exercise-thumbnail";
import { EXERCISE_ANIMATIONS } from "@/app/_components/exercise-3d/exercises";
import { PeriodizationForm } from "@/app/planning/_components/periodization-form";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";
import {
  createInitialWorkoutDays,
  deserializeWorkoutDays,
  duplicateDraftWorkoutDay,
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
} from "@/app/planning/_lib/workout-plan-builder";

describe("WorkoutPlanBuilder — lógica de contrato", () => {
  it("duplica parâmetros e referências do catálogo sem reutilizar IDs de registros salvos", () => {
    const original = {
      ...createInitialWorkoutDays()[0],
      id: "saved-day",
      exercises: [
        {
          id: "saved-exercise",
          exerciseId: "catalog-1",
          alternative1ExerciseId: "catalog-2",
          name: "Remada",
          sets: 4,
          reps: 8,
          restTimeInSeconds: 90,
          targetRir: 2,
        },
      ],
    };
    const copy = duplicateDraftWorkoutDay(original);
    expect(copy.id).toBeUndefined();
    expect(copy.clientId).not.toBe(original.clientId);
    expect(copy.exercises[0]).toMatchObject({
      exerciseId: "catalog-1",
      alternative1ExerciseId: "catalog-2",
      sets: 4,
      targetRir: 2,
    });
    expect(copy.exercises[0].id).toBeUndefined();
    copy.exercises[0].sets = 2;
    expect(original.exercises[0].sets).toBe(4);
  });
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

  it("serializa somente treinos e compacta a ordem sem dias de descanso", () => {
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
    expect(serialized).toHaveLength(2);
    expect(serialized[1]).toMatchObject({
      name: days[2].name,
      order: 1,
      isRest: false,
    });
    expect(serialized.every((day) => day.isRest === false)).toBe(true);
  });

  it("carrega apenas treinos de um plano legado preservando os IDs e exercícios", () => {
    const legacy = {
      workoutDays: [
        {
          id: "off",
          name: "Descanso legado",
          weekDay: "TUESDAY",
          isRest: true,
          estimatedDurationInSeconds: 0,
          coverImageUrl: null,
          exercises: [],
        },
        {
          id: "training",
          name: "Treino A",
          weekDay: "MONDAY",
          isRest: false,
          estimatedDurationInSeconds: 3600,
          coverImageUrl: null,
          exercises: [
            {
              id: "exercise",
              name: "Remada",
              sets: 3,
              reps: 10,
              restTimeInSeconds: 60,
            },
          ],
        },
      ],
    };
    const days = deserializeWorkoutDays(
      legacy as Parameters<typeof deserializeWorkoutDays>[0],
    );
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      id: "training",
      exercises: [{ id: "exercise", name: "Remada" }],
    });
    expect(legacy.workoutDays).toHaveLength(2);
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
    mocks.getExerciseMediaAction.mockImplementation(async (id: string) => ({
      success: true,
      data: {
        endImagePath:
          id === "catalog-0"
            ? "/exercise-media/repdb/squat-peak.webp"
            : "/exercise-media/repdb/t-bar-row-peak.webp",
      },
    }));
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

  function workoutTabs() {
    return within(
      screen.getByRole("navigation", { name: "Selecionar treino para editar" }),
    ).getAllByRole("button");
  }

  function addExercise(name: string) {
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    fireEvent.click(screen.getByRole("button", { name: `Selecionar ${name}` }));
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar 1 ao treino" }),
    );
  }

  function configureWorkouts() {
    fireEvent.change(screen.getByLabelText("Nome do plano *"), {
      target: { value: "Plano novo" },
    });
    const exercises = ["Agachamento", "Remada", "Desenvolvimento"];
    workoutTabs().forEach((tab, index) => {
      fireEvent.click(tab);
      addExercise(exercises[index]);
    });
    fireEvent.click(workoutTabs()[0]);
  }

  function openAlternatives() {
    fireEvent.click(screen.getByText("Agachamento", { exact: true }));
    fireEvent.click(screen.getByText("Alternativas do exercício (opcional)"));
  }

  it("cria standalone inativo por padrão", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    expect(screen.queryByLabelText(/dia de descanso/i)).toBeNull();
    configureWorkouts();
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

  it("permite duplicar e revisar sem gravar até confirmar", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureWorkouts();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Duplicar Treino A - Peito e Tríceps",
      }),
    );
    expect(workoutTabs()).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Revisar ficha" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(mocks.createStandaloneWorkoutPlanAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Voltar à edição" }));
    expect(screen.getByDisplayValue("Plano novo")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Revisar ficha" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));
    await waitFor(() =>
      expect(mocks.createStandaloneWorkoutPlanAction).toHaveBeenCalledOnce(),
    );
    expect(
      mocks.createStandaloneWorkoutPlanAction.mock.calls[0][0].workoutDays,
    ).toHaveLength(4);
  });

  it("preserva o preenchimento e permite tentar novamente após falha de conexão", async () => {
    mocks.createStandaloneWorkoutPlanAction.mockRejectedValueOnce(
      new Error("offline"),
    );
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureWorkouts();
    fireEvent.click(screen.getByRole("button", { name: "Criar plano" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Seus dados continuam aqui",
      ),
    );
    expect(screen.getByDisplayValue("Plano novo")).toBeDefined();
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Criar plano" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/planning"));
  });

  it("oferece ativação explícita no standalone", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureWorkouts();
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
    configureWorkouts();
    fireEvent.click(
      screen.getByRole("button", { name: "Mover treino para baixo" }),
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
    configureWorkouts();
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
    configureWorkouts();
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
    configureWorkouts();
    openAlternatives();
    expect(screen.queryByRole("textbox", { name: "Nome" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
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
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    const picker = within(
      screen.getByRole("dialog", { name: "Montar sequência de exercícios" }),
    );
    fireEvent.click(
      picker.getByRole("button", { name: "Selecionar Desenvolvimento" }),
    );
    fireEvent.click(picker.getByRole("button", { name: "Selecionar Remada" }));
    fireEvent.click(
      picker.getByRole("button", { name: "Adicionar 2 ao treino" }),
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
      expect.objectContaining({
        exerciseId: "catalog-1",
        name: "Remada",
        order: 2,
      }),
    ]);
  });

  it("permite remover uma alternativa e cancelar uma adição sem alterar o treino", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    configureWorkouts();
    openAlternatives();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Alternativa 2: Selecionar exercício",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Remada" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Remover alternativa 2" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
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

  it("carrega a miniatura 3D do S3 e recorre à mídia 2D ou ao aviso", async () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    const picker = within(
      screen.getByRole("dialog", { name: "Montar sequência de exercícios" }),
    );
    const squatOption = picker.getByRole("button", {
      name: "Selecionar Agachamento",
    });
    const rowOption = picker.getByRole("button", { name: "Selecionar Remada" });
    const missingOption = picker.getByRole("button", {
      name: "Selecionar Desenvolvimento",
    });
    fireEvent.click(squatOption);
    expect(squatOption.getAttribute("aria-pressed")).toBe("true");
    expect(squatOption.querySelector("img")?.getAttribute("src")).toContain(
      "/backend/exercises/catalog-0/thumbnail?v=frame.webp",
    );
    await waitFor(() =>
      expect(rowOption.querySelector("img")?.getAttribute("src")).toMatch(
        /\/exercise-media\/repdb\/t-bar-row-peak\.webp$/,
      ),
    );
    expect(
      within(missingOption).getByText("Sem imagem cadastrada"),
    ).toBeDefined();
    fireEvent.click(rowOption);
    fireEvent.click(missingOption);
    fireEvent.click(
      picker.getByRole("button", { name: "Adicionar 3 ao treino" }),
    );

    const squat = screen.getByRole("article", {
      name: "Exercício 1: Agachamento",
    });
    const hostedFrame = squat.querySelector("img")!;
    expect(hostedFrame.getAttribute("src")).toContain(
      "/backend/exercises/catalog-0/thumbnail?v=frame.webp",
    );
    fireEvent.error(hostedFrame);
    await waitFor(() =>
      expect(squat.querySelector("img")?.getAttribute("src")).toMatch(
        /\/exercise-media\/repdb\/squat-peak\.webp$/,
      ),
    );

    const row = screen.getByRole("article", { name: "Exercício 2: Remada" });
    await waitFor(() =>
      expect(row.querySelector("img")?.getAttribute("src")).toMatch(
        /\/exercise-media\/repdb\/t-bar-row-peak\.webp$/,
      ),
    );
    expect(mocks.getExerciseMediaAction).toHaveBeenCalledWith("catalog-0");
    expect(mocks.getExerciseMediaAction).toHaveBeenCalledWith("catalog-1");
    const missing = screen.getByRole("article", {
      name: "Exercício 3: Desenvolvimento",
    });
    expect(within(missing).getByText("Sem imagem cadastrada")).toBeDefined();
  });

  it("usa a miniatura remota da animação escolhida pelo personal", () => {
    const item = mocks.catalog[0];
    const { container } = render(
      <ExerciseThumbnail
        name={item.name}
        exerciseId={item.id}
        catalogEntry={{
          ...item,
          demonstration: { animationKey: "hammer-curl", youtubeUrl: null },
        }}
      />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/backend/exercises/" +
        EXERCISE_ANIMATIONS["hammer-curl"].id +
        "/thumbnail",
    );
    expect(mocks.getExerciseMediaAction).not.toHaveBeenCalled();
  });

  it("edita um treino por vez e mantém as alterações ao alternar", () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    expect(screen.getAllByLabelText("Nome do treino")).toHaveLength(1);
    expect(
      screen.getByDisplayValue("Treino A - Peito e Tríceps"),
    ).toBeDefined();
    fireEvent.change(screen.getByLabelText("Duração estimada (min)"), {
      target: { value: "42" },
    });
    fireEvent.click(workoutTabs()[1]);
    expect(
      screen.getByDisplayValue("Treino B - Costas e Bíceps"),
    ).toBeDefined();
    expect(workoutTabs()[1].getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByDisplayValue("42")).toBeNull();
    fireEvent.click(workoutTabs()[0]);
    expect(screen.getByDisplayValue("42")).toBeDefined();
  });

  it("abre o treino novo e mostra o resumo no editor compartilhado", () => {
    render(<WorkoutPlanBuilder mode="standalone" />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar treino" }));
    expect(workoutTabs()).toHaveLength(4);
    expect(screen.getByDisplayValue("Treino D")).toBeDefined();
    expect(workoutTabs()[3].getAttribute("aria-pressed")).toBe("true");
    const summary = screen.getByRole("complementary", {
      name: "Resumo do treino",
    });
    expect(within(summary).getByText("Volume por músculo")).toBeDefined();
    expect(
      within(summary).getByRole("tab", { name: "Atributos" }),
    ).toBeDefined();
    expect(within(summary).getByRole("tab", { name: "SNC" })).toBeDefined();
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
