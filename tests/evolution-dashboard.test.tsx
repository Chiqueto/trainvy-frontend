import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/stats/_actions", () => ({
  loadEvolutionDashboard: vi.fn(),
  searchEvolutionExercises: vi.fn(),
  loadExerciseEvolutionPage: vi.fn(),
  loadInitialEvolutionExercises: vi
    .fn()
    .mockResolvedValue({ success: true, data: [] }),
}));

import type {
  GetMuscleTrainingAnalytics200,
  GetWeeklyTrainingAnalytics200,
} from "@/app/_lib/api/fetch-generated";
import {
  loadEvolutionDashboard,
  loadInitialEvolutionExercises,
  loadExerciseEvolutionPage,
  searchEvolutionExercises,
} from "@/app/stats/_actions";
import { EvolutionDashboard } from "@/app/stats/_components/evolution-dashboard";
import { ExerciseSearch } from "@/app/stats/_components/exercise-search";

const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "QUADRICEPS",
  "HAMSTRINGS",
  "GLUTES",
  "ADDUCTORS",
  "HIP_ABDUCTORS",
  "CALVES",
  "CORE",
] as const;

function weeklyData(marker = 5, weeksCount = 4): GetWeeklyTrainingAnalytics200 {
  const weeks = Array.from({ length: weeksCount }, (_, index) => {
    const start = new Date(Date.UTC(2026, 8, 7 + index * 7));
    const end = new Date(Date.UTC(2026, 8, 13 + index * 7));
    return {
      weekStartDate: start.toISOString().slice(0, 10),
      weekEndDate: end.toISOString().slice(0, 10),
      workoutsCompleted: index === 0 ? marker : index === 1 ? 2 : 0,
      workingSets: index === 0 ? 40 : index === 1 ? 30 : 0,
      warmupSets: 0,
      loadVolumeGrams: index === 0 ? 20_000_000 : index === 1 ? 15_000_000 : 0,
      loadVolumeKg: index === 0 ? 20_000 : index === 1 ? 15_000 : 0,
      totalDurationInSeconds: index === 0 ? 7200 : index === 1 ? 5400 : 0,
      averageDurationInSeconds: 1800,
    };
  });

  return {
    timezone: "America/Sao_Paulo",
    startDate: weeks[0].weekStartDate,
    endDate: weeks[weeks.length - 1].weekEndDate,
    weeks,
  };
}

function muscleData(): GetMuscleTrainingAnalytics200 {
  return {
    timezone: "America/Sao_Paulo",
    startDate: "2026-09-07",
    endDate: "2026-10-04",
    totalWorkingSets: 8,
    classifiedWorkingSets: 7,
    unclassifiedWorkingSets: 1,
    muscles: MUSCLE_GROUPS.map((muscleGroup) => ({
      muscleGroup,
      directWorkingSets: muscleGroup === "CHEST" ? 8 : 0,
      indirectWorkingSets:
        muscleGroup === "TRICEPS" || muscleGroup === "SHOULDERS" ? 8 : 0,
    })),
  };
}

function dashboardResponse(marker = 3, weeksCount = 4) {
  return {
    success: true as const,
    data: {
      weekly: weeklyData(marker, weeksCount),
      muscles: muscleData(),
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe("Evolution dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      ...resolvedOptions,
      timeZone: "America/Sao_Paulo",
    });
    vi.mocked(loadEvolutionDashboard).mockResolvedValue(dashboardResponse());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("envia timezone IANA, resume fatos e preserva semana com volume zero", async () => {
    render(<EvolutionDashboard />);

    await waitFor(() =>
      expect(loadEvolutionDashboard).toHaveBeenCalledWith({
        timezone: "America/Sao_Paulo",
        weeksCount: 4,
      }),
    );

    expect(await screen.findByText("5")).toBeDefined();
    expect(screen.getByText("70")).toBeDefined();
    expect(screen.getByText("35.000 kg")).toBeDefined();
    expect(screen.getByText("3h 30min")).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: /Semana de 21\/09: 0 kg, 0 séries, 0 treinos/i,
      }),
    ).toBeDefined();
    const weeklyBars = screen.getAllByRole("button", { name: /Semana de/i });
    expect(weeklyBars[0].getAttribute("aria-label")).toContain("07/09");
    expect(weeklyBars[1].getAttribute("aria-label")).toContain("14/09");
  });

  it("mantém total real de 8 séries sem somar incidências musculares", async () => {
    render(<EvolutionDashboard />);

    expect(await screen.findByText("8 séries")).toBeDefined();
    expect(screen.getByText(/7 classificadas/i)).toBeDefined();
    expect(screen.getByText(/1 não classificadas/i)).toBeDefined();
    expect(screen.queryByText(/24 séries/i)).toBeNull();
    expect(screen.getByText("Peito")).toBeDefined();
    expect(screen.getByText("Tríceps")).toBeDefined();
    expect(screen.getByText("Ombros")).toBeDefined();

    expect(screen.queryByText("Core")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar todos" }));
    expect(screen.getByText("Core")).toBeDefined();
  });

  it("carrega 4, 8 e 12 semanas e impede resposta antiga de sobrescrever a nova", async () => {
    const eightWeeks = deferred<ReturnType<typeof dashboardResponse>>();
    const twelveWeeks = deferred<ReturnType<typeof dashboardResponse>>();
    vi.mocked(loadEvolutionDashboard).mockImplementation(({ weeksCount }) => {
      if (weeksCount === 8) return eightWeeks.promise;
      if (weeksCount === 12) return twelveWeeks.promise;
      return Promise.resolve(dashboardResponse(3, 4));
    });

    render(<EvolutionDashboard />);
    await screen.findByText("Últimas 4 semanas");

    fireEvent.click(screen.getByRole("button", { name: "8 semanas" }));
    fireEvent.click(screen.getByRole("button", { name: "12 semanas" }));
    expect(loadEvolutionDashboard).toHaveBeenCalledWith({
      timezone: "America/Sao_Paulo",
      weeksCount: 8,
    });
    expect(loadEvolutionDashboard).toHaveBeenCalledWith({
      timezone: "America/Sao_Paulo",
      weeksCount: 12,
    });

    await act(async () => {
      twelveWeeks.resolve(dashboardResponse(12, 12));
    });
    expect(await screen.findByText("Últimas 12 semanas")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();

    await act(async () => {
      eightWeeks.resolve(dashboardResponse(8, 8));
    });
    expect(screen.getByText("Últimas 12 semanas")).toBeDefined();
    expect(screen.queryByText("Últimas 8 semanas")).toBeNull();
  });

  it("mostra estado sem dados no lugar de gráfico vazio", async () => {
    const emptyWeekly = weeklyData(0, 4);
    emptyWeekly.weeks = emptyWeekly.weeks.map((week) => ({
      ...week,
      workoutsCompleted: 0,
      workingSets: 0,
      loadVolumeGrams: 0,
      loadVolumeKg: 0,
      totalDurationInSeconds: 0,
      averageDurationInSeconds: 0,
    }));
    vi.mocked(loadEvolutionDashboard).mockResolvedValue({
      success: true,
      data: { weekly: emptyWeekly, muscles: muscleData() },
    });

    render(<EvolutionDashboard />);
    expect(
      await screen.findByText(
        /Ainda não há treinos concluídos suficientes para exibir sua evolução/i,
      ),
    ).toBeDefined();
    expect(
      screen.queryByRole("img", {
        name: "Gráfico de volume de carga por semana",
      }),
    ).toBeNull();
  });

  it("mostra erro amigável para timezone inválido e permite retry", async () => {
    vi.mocked(loadEvolutionDashboard).mockResolvedValue({
      success: false,
      code: "INVALID_TIMEZONE",
      error: "Não foi possível determinar corretamente seu fuso horário.",
    });

    render(<EvolutionDashboard />);
    expect(
      await screen.findByText(
        "Não foi possível determinar corretamente seu fuso horário.",
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() =>
      expect(loadEvolutionDashboard).toHaveBeenCalledTimes(2),
    );
  });
});

describe("Exercise evolution search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadInitialEvolutionExercises).mockResolvedValue({
      success: true,
      data: [],
    });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("faz debounce, mostra loading e cria links sem buscar evolution por item", async () => {
    vi.useFakeTimers();
    const search =
      deferred<Awaited<ReturnType<typeof searchEvolutionExercises>>>();
    vi.mocked(searchEvolutionExercises).mockReturnValue(search.promise);
    await act(async () => {
      render(<ExerciseSearch />);
    });

    expect(
      screen.getByText(
        "Digite o nome de um exercício para consultar a progressão.",
      ),
    ).toBeDefined();
    fireEvent.change(screen.getByLabelText("Buscar exercício"), {
      target: { value: "supino" },
    });
    expect(searchEvolutionExercises).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchEvolutionExercises).toHaveBeenCalledTimes(1);
    expect(searchEvolutionExercises).toHaveBeenCalledWith("supino", false);
    expect(screen.getByLabelText("Buscando exercícios")).toBeDefined();

    await act(async () => {
      search.resolve({
        success: true,
        data: [
          {
            id: "exercise-1",
            name: "Supino Reto",
            ownerUserId: "user-1",
            hasMedia: false,
            muscles: [
              {
                id: "muscle-1",
                muscleGroup: "CHEST",
                role: "PRIMARY",
              },
            ],
          },
        ],
      });
      await Promise.resolve();
    });

    const result = screen.getByRole("link", { name: /Supino Reto/i });
    expect(result.getAttribute("href")).toBe("/stats/exercises/exercise-1");
    expect(screen.getByText("Custom")).toBeDefined();
  });

  it("trata busca vazia, nenhum resultado e erro", async () => {
    vi.mocked(searchEvolutionExercises)
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({
        success: false,
        code: "REQUEST_FAILED",
        error: "Não foi possível buscar exercícios.",
      });
    render(<ExerciseSearch />);

    fireEvent.change(screen.getByLabelText("Buscar exercício"), {
      target: { value: "inexistente" },
    });
    expect(
      await screen.findByText("Nenhum exercício encontrado."),
    ).toBeDefined();

    fireEvent.change(screen.getByLabelText("Buscar exercício"), {
      target: { value: "erro" },
    });
    expect(
      await screen.findByText("Não foi possível buscar exercícios."),
    ).toBeDefined();
  });

  it("preserva a descoberta de exercícios praticados e o filtro de catálogo", async () => {
    vi.mocked(loadInitialEvolutionExercises).mockResolvedValue({
      success: true,
      data: [
        {
          id: "practiced",
          name: "Supino praticado",
          ownerUserId: null,
          hasMedia: false,
          muscles: [],
        },
      ],
    });
    render(<ExerciseSearch />);
    expect(
      await screen.findByRole("link", { name: /Supino praticado/i }),
    ).toHaveProperty(
      "href",
      expect.stringContaining("/stats/exercises/practiced"),
    );
    expect(loadExerciseEvolutionPage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(
      screen.queryByRole("link", { name: /Supino praticado/i }),
    ).toBeNull();
    expect(
      screen.getByText(
        "Digite o nome de um exercício para consultar a progressão.",
      ),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Meus treinos" }));
    expect(
      screen.getByRole("link", { name: /Supino praticado/i }),
    ).toBeDefined();
  });

  it("limpar a busca invalida a resposta antiga em voo", async () => {
    vi.useFakeTimers();
    const pending =
      deferred<Awaited<ReturnType<typeof searchEvolutionExercises>>>();
    vi.mocked(searchEvolutionExercises).mockReturnValueOnce(pending.promise);
    await act(async () => {
      render(<ExerciseSearch />);
    });
    fireEvent.change(screen.getByLabelText("Buscar exercício"), {
      target: { value: "supino" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.change(screen.getByLabelText("Buscar exercício"), {
      target: { value: "" },
    });
    await act(async () => {
      pending.resolve({
        success: true,
        data: [
          {
            id: "old",
            name: "Resultado antigo",
            ownerUserId: null,
            hasMedia: false,
            muscles: [],
          },
        ],
      });
    });
    expect(screen.queryByRole("link", { name: /Resultado antigo/ })).toBeNull();
    expect(screen.queryByLabelText("Buscando exercícios")).toBeNull();
    expect(searchEvolutionExercises).toHaveBeenCalledTimes(1);
  });
});
