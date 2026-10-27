import { describe, expect, it } from "vitest";
import {
  calculateSessionMuscleStats,
  getMuscleFillColor,
  resolveExerciseMuscles,
} from "../app/_lib/workout-session-muscles";

describe("workout-session-muscles", () => {
  it("resolve músculos por catálogo quando disponível", () => {
    const ex = {
      id: "se-1",
      exerciseId: "ex-bench-id",
      exerciseNameSnapshot: "Supino Inclinado com Halteres",
    };
    const catalog = [
      {
        id: "ex-bench-id",
        name: "Supino Inclinado com Halteres",
        muscles: [
          { muscleGroup: "CHEST", role: "PRIMARY" },
          { muscleGroup: "TRICEPS", role: "SECONDARY" },
        ],
      },
    ];

    const result = resolveExerciseMuscles(ex, catalog);
    expect(result.primary).toEqual(["CHEST"]);
    expect(result.secondary).toEqual(["TRICEPS"]);
  });

  it("resolve músculos por snapshot direto no sessionExercise", () => {
    const ex = {
      id: "se-2",
      exerciseNameSnapshot: "Puxada Aberta",
      muscles: [
        { muscleGroup: "BACK", role: "PRIMARY" },
        { muscleGroup: "BICEPS", role: "SECONDARY" },
      ],
    };

    const result = resolveExerciseMuscles(ex);
    expect(result.primary).toEqual(["BACK"]);
    expect(result.secondary).toEqual(["BICEPS"]);
  });

  it("faz fallback resiliente por palavras-chave quando sem catálogo", () => {
    const bench = resolveExerciseMuscles({
      id: "1",
      exerciseNameSnapshot: "Supino Reto Barra",
    });
    expect(bench.primary).toContain("CHEST");

    const squat = resolveExerciseMuscles({
      id: "2",
      exerciseNameSnapshot: "Agachamento Livre",
    });
    expect(squat.primary).toContain("QUADRICEPS");

    const curl = resolveExerciseMuscles({
      id: "3",
      exerciseNameSnapshot: "Rosca Direta com Barra W",
    });
    expect(curl.primary).toContain("BICEPS");
  });

  it("calcula corretamente volume de séries e intensidade por grupo muscular", () => {
    const sessionExercises = [
      {
        id: "se-1",
        exerciseNameSnapshot: "Supino Reto",
        sets: [
          { completedAt: "2026-10-27T10:00:00Z", type: "WORKING", weightInGrams: 80000, reps: 10 },
          { completedAt: "2026-10-27T10:05:00Z", type: "WORKING", weightInGrams: 80000, reps: 10 },
          { completedAt: "2026-10-27T10:10:00Z", type: "WORKING", weightInGrams: 80000, reps: 8 },
        ],
      },
      {
        id: "se-2",
        exerciseNameSnapshot: "Crucifixo Reto",
        sets: [
          { completedAt: "2026-10-27T10:15:00Z", type: "WORKING", weightInGrams: 20000, reps: 12 },
          { completedAt: "2026-10-27T10:20:00Z", type: "WORKING", weightInGrams: 20000, reps: 12 },
        ],
      },
      {
        id: "se-3",
        exerciseNameSnapshot: "Tríceps Corda",
        sets: [
          { completedAt: "2026-10-27T10:25:00Z", type: "WORKING", weightInGrams: 25000, reps: 12 },
          { completedAt: "2026-10-27T10:30:00Z", type: "WORKING", weightInGrams: 25000, reps: 10 },
        ],
      },
    ];

    const stats = calculateSessionMuscleStats(sessionExercises);

    // CHEST teve 3 séries (supino) + 2 séries (crucifixo) = 5 séries
    expect(stats.muscles.CHEST.totalSets).toBe(5);
    expect(stats.muscles.CHEST.isPrimary).toBe(true);

    // TRICEPS teve 2 séries diretas + secundário de supino (~2) + crucifixo (~1) = ~5
    expect(stats.muscles.TRICEPS.totalSets).toBeGreaterThan(0);

    // Músculo não treinado tem 0 séries e 0 intensidade
    expect(stats.muscles.HAMSTRINGS.totalSets).toBe(0);
    expect(stats.muscles.HAMSTRINGS.intensity).toBe(0);

    // Top muscle deve ser CHEST ou TRICEPS
    expect(stats.activeMusclesList.length).toBeGreaterThan(0);
    expect(stats.topMuscleGroup?.muscleGroup).toBe("CHEST");
    expect(stats.topMuscleGroup?.intensity).toBe(1);
  });

  it("getMuscleFillColor varia tons de vermelho conforme volume e neutro quando 0", () => {
    const neutral = getMuscleFillColor(0);
    expect(neutral).toBe("#27272a");

    const low = getMuscleFillColor(0.4);
    expect(low).toBe("#f87171");

    const high = getMuscleFillColor(0.9);
    expect(high).toBe("#ff1f3d");
  });
});
