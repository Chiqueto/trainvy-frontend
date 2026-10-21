import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  normalizeSearchTerm,
  filterExercisesInstant,
  getStoredExercises,
  persistExercisesToCache,
  addExerciseToLocalCache,
  updateExerciseInLocalCache,
  subscribeToExerciseCatalog,
  type CachedExercise,
} from "@/app/_lib/exercise-catalog-cache";

describe("Exercise Catalog Client Cache & Instant Search", () => {
  const sampleExercises: CachedExercise[] = [
    {
      id: "ex-1",
      name: "Supino Reto com Barra",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [
        { id: "m-1", muscleGroup: "CHEST", role: "PRIMARY" },
        { id: "m-2", muscleGroup: "TRICEPS", role: "SECONDARY" },
      ],
    },
    {
      id: "ex-2",
      name: "Puxada Frontal",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [
        { id: "m-3", muscleGroup: "BACK", role: "PRIMARY" },
        { id: "m-4", muscleGroup: "BICEPS", role: "SECONDARY" },
      ],
    },
    {
      id: "ex-3",
      name: "Agachamento Livre",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [
        { id: "m-5", muscleGroup: "QUADRICEPS", role: "PRIMARY" },
        { id: "m-6", muscleGroup: "GLUTES", role: "SECONDARY" },
      ],
    },
    {
      id: "ex-4",
      name: "Elevação Lateral com Halteres",
      ownerUserId: "user-123",
      isUnilateral: true,
      hasMedia: false,
      muscles: [
        { id: "m-7", muscleGroup: "SHOULDERS", role: "PRIMARY" },
      ],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    persistExercisesToCache(sampleExercises, "v1-init");
  });

  describe("1. normalizeSearchTerm", () => {
    it("remove acentos, cedilha e converte para minúsculas", () => {
      expect(normalizeSearchTerm("Elevação Lateral")).toBe("elevacao lateral");
      expect(normalizeSearchTerm("Tríceps")).toBe("triceps");
      expect(normalizeSearchTerm("Músculo")).toBe("musculo");
      expect(normalizeSearchTerm("  AGACHAMENTO  ")).toBe("agachamento");
    });
  });

  describe("2. filterExercisesInstant", () => {
    it("retorna todos os exercícios quando busca está vazia", () => {
      const results = filterExercisesInstant(sampleExercises, "");
      expect(results).toHaveLength(4);
    });

    it("busca por nome com acento e sem acento (insensível a diacríticos)", () => {
      const withAccent = filterExercisesInstant(sampleExercises, "elevação");
      const withoutAccent = filterExercisesInstant(sampleExercises, "elevacao");

      expect(withAccent).toHaveLength(1);
      expect(withAccent[0].id).toBe("ex-4");
      expect(withoutAccent).toHaveLength(1);
      expect(withoutAccent[0].id).toBe("ex-4");
    });

    it("prioriza prefixos de palavras", () => {
      const results = filterExercisesInstant(sampleExercises, "sup");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Supino Reto com Barra");
    });

    it("encontra exercícios por grupo muscular digitado em português", () => {
      // "peito" mapeia para CHEST
      const chestResults = filterExercisesInstant(sampleExercises, "peito");
      expect(chestResults.some((e) => e.name === "Supino Reto com Barra")).toBe(true);

      // "costas" mapeia para BACK
      const backResults = filterExercisesInstant(sampleExercises, "costas");
      expect(backResults.some((e) => e.name === "Puxada Frontal")).toBe(true);

      // "ombro" mapeia para SHOULDERS
      const shoulderResults = filterExercisesInstant(sampleExercises, "ombro");
      expect(shoulderResults.some((e) => e.name === "Elevação Lateral com Halteres")).toBe(true);
    });

    it("filtra por grupo muscular específico via muscleFilter", () => {
      const legResults = filterExercisesInstant(sampleExercises, "", "QUADRICEPS");
      expect(legResults).toHaveLength(1);
      expect(legResults[0].name).toBe("Agachamento Livre");
    });
  });

  describe("3. Operações síncronas de Cache e Invalidação", () => {
    it("recupera exercícios e versão do cache", () => {
      const { exercises, version } = getStoredExercises();
      expect(exercises).toHaveLength(4);
      expect(version).toBe("v1-init");
    });

    it("adiciona exercício customizado otimisticamente no topo do cache", () => {
      const newEx: CachedExercise = {
        id: "ex-custom-1",
        name: "Crucifixo Inclinado",
        ownerUserId: "user-123",
        isUnilateral: false,
        hasMedia: false,
        muscles: [{ id: "m-new", muscleGroup: "CHEST", role: "PRIMARY" }],
      };

      addExerciseToLocalCache(newEx);

      const { exercises } = getStoredExercises();
      expect(exercises).toHaveLength(5);
      expect(exercises[0].id).toBe("ex-custom-1");
    });

    it("atualiza grupos musculares de exercício existente no cache", () => {
      updateExerciseInLocalCache({
        ...sampleExercises[2],
        muscles: [
          { id: "m-5", muscleGroup: "QUADRICEPS", role: "PRIMARY" },
          { id: "m-extra", muscleGroup: "CALVES", role: "SECONDARY" },
        ],
      });

      const { exercises } = getStoredExercises();
      const updated = exercises.find((e) => e.id === "ex-3");
      expect(updated?.muscles).toHaveLength(2);
      expect(updated?.muscles.some((m) => m.muscleGroup === "CALVES")).toBe(true);
    });

    it("notifica ouvintes inscritos ao atualizar o cache", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToExerciseCatalog(listener);

      persistExercisesToCache(sampleExercises, "v2-updated");

      expect(listener).toHaveBeenCalledWith(sampleExercises, "v2-updated");

      unsubscribe();
    });
  });
});
