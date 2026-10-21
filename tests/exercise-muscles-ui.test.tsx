import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  ALL_MUSCLE_GROUPS,
  getMuscleGroupLabel,
  MUSCLE_GROUP_LABELS,
} from "@/app/_lib/muscle-labels";
import * as api from "@/app/_lib/api/fetch-generated";
import {
  createExerciseAction,
  updateExerciseMusclesAction,
} from "@/app/workout-sessions/[sessionId]/_actions";
import { ExerciseSelectorModal } from "@/app/workout-sessions/[sessionId]/_components/exercise-selector-modal";

vi.mock("@/app/_lib/api/fetch-generated", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/_lib/api/fetch-generated")>();
  return {
    ...actual,
    listExercises: vi.fn(),
    createExercise: vi.fn(),
    updateExerciseMuscles: vi.fn(),
  };
});

describe("Task 3.1C - Grupos Musculares no Frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Labels em Português Centralizados (Item 16)", () => {
    it("mapeia todos os 13 grupos musculares para o português", () => {
      expect(getMuscleGroupLabel("CHEST")).toBe("Peito");
      expect(getMuscleGroupLabel("BACK")).toBe("Costas");
      expect(getMuscleGroupLabel("SHOULDERS")).toBe("Ombros");
      expect(getMuscleGroupLabel("BICEPS")).toBe("Bíceps");
      expect(getMuscleGroupLabel("TRICEPS")).toBe("Tríceps");
      expect(getMuscleGroupLabel("FOREARMS")).toBe("Antebraços");
      expect(getMuscleGroupLabel("QUADRICEPS")).toBe("Quadríceps");
      expect(getMuscleGroupLabel("HAMSTRINGS")).toBe("Posteriores");
      expect(getMuscleGroupLabel("GLUTES")).toBe("Glúteos");
      expect(getMuscleGroupLabel("ADDUCTORS")).toBe("Adutores");
      expect(getMuscleGroupLabel("HIP_ABDUCTORS")).toBe("Abdutores");
      expect(getMuscleGroupLabel("CALVES")).toBe("Panturrilhas");
      expect(getMuscleGroupLabel("CORE")).toBe("Core");
    });

    it("ALL_MUSCLE_GROUPS contém 13 itens com labels válidos", () => {
      expect(ALL_MUSCLE_GROUPS).toHaveLength(13);
      for (const item of ALL_MUSCLE_GROUPS) {
        expect(item.label).toBe(MUSCLE_GROUP_LABELS[item.value]);
      }
    });
  });

  describe("2. Server Actions de Músculos (Items 13 & 17)", () => {
    it("createExerciseAction envia primaryMuscleGroups e secondaryMuscleGroups", async () => {
      vi.mocked(api.createExercise).mockResolvedValueOnce({
        status: 201,
        data: {
          id: "ex-new-1",
          name: "Supino Inclinado",
          ownerUserId: "user-1",
          hasMedia: false,
          muscles: [
            { id: "m-1", muscleGroup: "CHEST", role: "PRIMARY" },
            { id: "m-2", muscleGroup: "TRICEPS", role: "SECONDARY" },
          ],
        },
        headers: new Headers(),
      });

      const res = await createExerciseAction({
        name: "Supino Inclinado",
        primaryMuscleGroups: ["CHEST"],
        secondaryMuscleGroups: ["TRICEPS"],
      });

      expect(res.success).toBe(true);
      expect(api.createExercise).toHaveBeenCalledWith({
        name: "Supino Inclinado",
        primaryMuscleGroups: ["CHEST"],
        secondaryMuscleGroups: ["TRICEPS"],
      });
    });

    it("updateExerciseMusclesAction envia payload correto para endpoint PUT", async () => {
      vi.mocked(api.updateExerciseMuscles).mockResolvedValueOnce({
        status: 200,
        data: {
          id: "ex-custom-1",
          name: "Remada Articulada",
          ownerUserId: "user-1",
          hasMedia: false,
          muscles: [
            { id: "m-3", muscleGroup: "BACK", role: "PRIMARY" },
            { id: "m-4", muscleGroup: "BICEPS", role: "SECONDARY" },
          ],
        },
        headers: new Headers(),
      });

      const res = await updateExerciseMusclesAction("ex-custom-1", {
        primaryMuscleGroups: ["BACK"],
        secondaryMuscleGroups: ["BICEPS"],
      });

      expect(res.success).toBe(true);
      expect(api.updateExerciseMuscles).toHaveBeenCalledWith("ex-custom-1", {
        primaryMuscleGroups: ["BACK"],
        secondaryMuscleGroups: ["BICEPS"],
      });
    });
  });

  describe("3. ExerciseSelectorModal UI (Items 15 & 19)", () => {
    it("renderiza músculos e permite definir classificação de exercício próprio", async () => {
      vi.mocked(api.listExercises).mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: "ex-classified",
            name: "Supino Reto com Barra",
            ownerUserId: null,
            hasMedia: false,
            muscles: [
              { id: "m-1", muscleGroup: "CHEST", role: "PRIMARY" },
              { id: "m-2", muscleGroup: "TRICEPS", role: "SECONDARY" },
            ],
          },
          {
            id: "ex-unclassified-custom",
            name: "Meu Exercício Sem Classificação",
            ownerUserId: "user-me",
            hasMedia: false,
            muscles: [],
          },
        ],
        headers: new Headers(),
      });

      render(
        <ExerciseSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectExercise={vi.fn()}
        />,
      );

      // Aguarda carregar
      await waitFor(() => {
        expect(screen.getByText("Supino Reto com Barra")).toBeTruthy();
      });

      // Músculo primário "Peito" e secundário "Tríceps"
      expect(screen.getAllByText("Peito").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tríceps/).length).toBeGreaterThan(0);

      const classify = screen.getByRole("button", {
        name: "Definir grupo muscular",
      });
      expect(classify).toBeTruthy();
      fireEvent.click(classify);
      expect(
        screen.getByRole("heading", { name: "Classificar Músculos" }),
      ).toBeTruthy();
    });

    it("abre formulário de criação com seleção de músculo principal e auxiliares", async () => {
      vi.mocked(api.listExercises).mockResolvedValueOnce({
        status: 200,
        data: [],
        headers: new Headers(),
      });

      render(
        <ExerciseSelectorModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectExercise={vi.fn()}
        />,
      );

      // Clica em "Criar novo personalizado"
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Criar novo personalizado/i }),
        ).toBeTruthy();
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Criar novo personalizado/i }),
      );

      // Formulário exibido
      expect(screen.getByText("Novo Exercício")).toBeTruthy();
      expect(screen.getByLabelText(/Nome do exercício \*/i)).toBeTruthy();
      expect(screen.getByLabelText(/Músculo principal \*/i)).toBeTruthy();
      expect(
        screen.getByText(/Músculos auxiliares \(opcional\)/i),
      ).toBeTruthy();
    });
  });
});
