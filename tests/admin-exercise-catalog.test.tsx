import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ListAdminExercises200Item } from "../app/_lib/api/fetch-generated";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/_components/exercise-media/exercise-execution-dialog", () => ({
  ExerciseExecutionDialog: () => <div>Execução aberta</div>,
}));
import { ExercisesCatalog } from "../app/admin/_components/exercises-catalog";

const exercises: ListAdminExercises200Item[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Supino Reto com Barra",
    family: null,
    isUnilateral: false,
    updatedAt: "2026-10-27T12:00:00Z",
    priority3d: null,
    muscles: [{ muscleGroup: "CHEST", role: "PRIMARY" }],
    media: [
      {
        mediaType: "IMAGE_SEQUENCE",
        hasImages: true,
        hasMotion: false,
        hasInstructions: true,
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000199",
    name: "Supino Declinado com Halteres",
    family: "Musculação tradicional — peito",
    isUnilateral: false,
    updatedAt: "2026-10-27T12:00:00Z",
    priority3d: null,
    muscles: [],
    media: [],
  },
  {
    id: "00000000-0000-4000-8000-000000000198",
    name: "Elevação Frontal com Halteres",
    family: "Ombros",
    isUnilateral: false,
    updatedAt: "2026-10-27T12:00:00Z",
    priority3d: null,
    muscles: [],
    media: [
      {
        mediaType: "IMAGE_SEQUENCE",
        hasImages: true,
        hasMotion: false,
        hasInstructions: false,
      },
    ],
  },
];
afterEach(cleanup);
describe("Admin catalog coverage", () => {
  it("keeps image availability separate from actual 3D support", () => {
    render(<ExercisesCatalog exercises={exercises} />);
    fireEvent.change(screen.getByLabelText("Conteúdo"), {
      target: { value: "3d" },
    });
    expect(screen.getByText("Supino Reto com Barra")).toBeTruthy();
    expect(screen.queryByText("Supino Declinado com Halteres")).toBeNull();
    expect(screen.queryByText("Elevação Frontal com Halteres")).toBeNull();
    fireEvent.change(screen.getByLabelText("Conteúdo"), {
      target: { value: "novisual" },
    });
    expect(screen.getByText("Supino Declinado com Halteres")).toBeTruthy();
    expect(screen.queryByText("Elevação Frontal com Halteres")).toBeNull();
  });
  it("combines accent-insensitive search and missing classification, then shows details", () => {
    render(<ExercisesCatalog exercises={exercises} />);
    fireEvent.change(screen.getByLabelText("Buscar por nome ou ID"), {
      target: { value: "elevacao" },
    });
    fireEvent.change(screen.getByLabelText("Conteúdo"), {
      target: { value: "unclassified" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver detalhes de Elevação Frontal com Halteres",
      }),
    );
    expect(
      screen.getByText("00000000-0000-4000-8000-000000000198"),
    ).toBeTruthy();
    expect(screen.getAllByText(/Não definidos/).length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByText("Supino Reto com Barra")).toBeTruthy();
  });
});
