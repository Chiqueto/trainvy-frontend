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

describe("Flat dumbbell guide", () => {
  it("opens its own 3D animation and fallback instructions for supino reto com halteres", () => {
    const data: GetExerciseMedia200 = {
      exerciseId: "6ef90b25-cd99-4860-8933-ae29e4d1f3d8",
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
        exerciseName="Supino Reto com Halteres"
        initialData={data}
      />,
    );
    expect(screen.getByTestId("viewer").getAttribute("data-exercise")).toBe(
      "flat-dumbbell-press",
    );
    expect(
      screen.getByText(/banco plano com os pés firmemente apoiados no solo/),
    ).toBeTruthy();
    expect(screen.getByText(/arco convergente suave/)).toBeTruthy();
    expect(screen.queryByText(/Tire a barra do suporte/)).toBeNull();
  });
});
