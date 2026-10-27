import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function Viewer({ exercise }: { exercise: string }) {
      return <div data-testid="viewer" data-exercise={exercise} />;
    },
}));
vi.mock("@/app/_actions/exercise-media", () => ({
  getExerciseMediaAction: vi.fn(),
}));
import { ExerciseExecutionDialog } from "../app/_components/exercise-media/exercise-execution-dialog";
import type { GetExerciseMedia200 } from "../app/_lib/api/fetch-generated";

afterEach(cleanup);
describe("Incline dumbbell guide", () => {
  it("opens its own animation and instructions when no image or instructions exist in the database", () => {
    const data: GetExerciseMedia200 = {
      exerciseId: "00000000-0000-4000-8000-000000000103",
      hasMedia: false,
      mediaType: null,
      startImagePath: null,
      endImagePath: null,
      motionPath: null,
      attributionName: null,
      attributionUrl: null,
      instructions: null,
    };
    render(
      <ExerciseExecutionDialog
        isOpen
        onClose={() => {}}
        exerciseId={data.exerciseId}
        exerciseName="Supino Inclinado com Halteres"
        initialData={data}
      />,
    );
    expect(screen.getByTestId("viewer").getAttribute("data-exercise")).toBe(
      "incline-dumbbell-press",
    );
    expect(screen.getByText(/encosto inclinado a 45°/)).toBeTruthy();
    expect(screen.getByText(/sem bater os halteres/)).toBeTruthy();
    expect(screen.queryByText(/Tire a barra do suporte/)).toBeNull();
  });
});
