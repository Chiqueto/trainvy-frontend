import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getWeeklyTrainingAnalytics: vi.fn(),
  getMuscleTrainingAnalytics: vi.fn(),
  getExerciseEvolution: vi.fn(),
  listExercises: vi.fn(),
}));

import {
  getExerciseEvolution,
  getMuscleTrainingAnalytics,
  getWeeklyTrainingAnalytics,
  listExercises,
} from "@/app/_lib/api/fetch-generated";
import {
  loadEvolutionDashboard,
  loadExerciseEvolutionPage,
  searchEvolutionExercises,
  loadInitialEvolutionExercises,
} from "@/app/stats/_actions";

const weekly = {
  timezone: "America/Sao_Paulo",
  startDate: "2026-09-07",
  endDate: "2026-10-04",
  weeks: [],
};

const muscles = {
  timezone: "America/Sao_Paulo",
  startDate: "2026-09-07",
  endDate: "2026-10-04",
  totalWorkingSets: 0,
  classifiedWorkingSets: 0,
  unclassifiedWorkingSets: 0,
  muscles: [],
};

describe("Evolution server actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa timezone IANA e o range weekly exato na chamada muscular", async () => {
    vi.mocked(getWeeklyTrainingAnalytics).mockResolvedValue({
      status: 200,
      data: weekly,
      headers: new Headers(),
    });
    vi.mocked(getMuscleTrainingAnalytics).mockResolvedValue({
      status: 200,
      data: muscles,
      headers: new Headers(),
    });

    await expect(
      loadEvolutionDashboard({
        timezone: "America/Sao_Paulo",
        weeksCount: 8,
      }),
    ).resolves.toEqual({ success: true, data: { weekly, muscles } });

    expect(getWeeklyTrainingAnalytics).toHaveBeenCalledWith({
      tz: "America/Sao_Paulo",
      weeksCount: 8,
    });
    expect(getMuscleTrainingAnalytics).toHaveBeenCalledWith({
      tz: "America/Sao_Paulo",
      startDate: weekly.startDate,
      endDate: weekly.endDate,
    });
  });

  it("rejeita timezone inválido sem assumir UTC nem chamar a API", async () => {
    await expect(
      loadEvolutionDashboard({ timezone: "timezone-invalido", weeksCount: 4 }),
    ).resolves.toMatchObject({
      success: false,
      code: "INVALID_TIMEZONE",
    });
    expect(getWeeklyTrainingAnalytics).not.toHaveBeenCalled();
    expect(getMuscleTrainingAnalytics).not.toHaveBeenCalled();
  });

  it("busca apenas catálogo e limita o payload interno", async () => {
    vi.mocked(listExercises).mockResolvedValue({
      status: 200,
      data: [
        {
          id: "exercise-1",
          name: "Supino",
          ownerUserId: null,
          hasMedia: false,
          muscles: [],
        },
      ],
      headers: new Headers(),
    });

    await expect(searchEvolutionExercises(" supino ")).resolves.toMatchObject({
      success: true,
    });
    expect(listExercises).toHaveBeenCalledWith({ q: "supino" });
    expect(getExerciseEvolution).not.toHaveBeenCalled();
  });

  it("repassa exerciseId e cursor opaco com limite conservador", async () => {
    vi.mocked(getExerciseEvolution).mockResolvedValue({
      status: 200,
      data: {
        exercise: {
          id: "exercise-1",
          name: "Supino",
          ownerUserId: null,
          muscles: [],
        },
        loadPR: null,
        items: [],
        nextCursor: null,
        hasMore: false,
      },
      headers: new Headers(),
    });

    await loadExerciseEvolutionPage({
      exerciseId: "exercise-1",
      cursor: "opaque-cursor",
    });

    expect(getExerciseEvolution).toHaveBeenCalledWith("exercise-1", {
      cursor: "opaque-cursor",
      limit: 10,
    });
  });

  it("descoberta inicial usa apenas catálogo com histórico, sem N+1 de evolução", async () => {
    vi.mocked(listExercises).mockResolvedValue({
      status: 200,
      data: [],
      headers: new Headers(),
    });
    await loadInitialEvolutionExercises();
    expect(listExercises).toHaveBeenCalledExactlyOnceWith({
      onlyWithHistory: "true",
    });
    expect(getExerciseEvolution).not.toHaveBeenCalled();
  });
});
