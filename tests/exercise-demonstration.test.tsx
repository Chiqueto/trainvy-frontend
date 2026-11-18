import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { YoutubePlayer } from "@/app/_components/exercise-media/youtube-player";
import { youtubeVideoId } from "@/app/_lib/youtube";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media/exercise-execution-dialog";
import { EXERCISE_ANIMATIONS } from "@/app/_components/exercise-3d/exercises";
import type { GetExerciseMedia200 } from "@/app/_lib/api/fetch-generated";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DemonstrationFields } from "@/app/personal/exercicios/_components/demonstration-fields";

vi.mock("@/app/_actions/exercise-media", () => ({
  getExerciseMediaAction: vi.fn(),
}));
vi.mock("next/dynamic", () => ({
  default: () =>
    function Viewer({ exercise }: { exercise: string }) {
      return <div data-testid="viewer">{exercise}</div>;
    },
}));

afterEach(cleanup);
const url = "https://www.youtube.com/watch?v=M7lc1UVf-VE";
const data: GetExerciseMedia200 = {
  exerciseId: "00000000-0000-4000-8000-000000000101",
  hasMedia: true,
  mediaType: null,
  startImagePath: null,
  endImagePath: null,
  motionPath: null,
  instructions: null,
  attributionName: null,
  attributionUrl: null,
  demonstration: { youtubeUrl: url, animationKey: "squat" },
};

describe("Exercise video and 3D demonstrations", () => {
  it("offers the canonical curl for new demonstrations while retaining a saved legacy choice", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DemonstrationFields name="Rosca" value={{ youtubeUrl: "", animationKey: "" }} onChange={onChange} />);
    expect(screen.queryByRole("option", { name: /^Rosca Direta$/ })).toBeNull();
    expect(screen.getByRole("option", { name: "Rosca Direta com Barra" })).toBeDefined();
    rerender(<DemonstrationFields name="Rosca" value={{ youtubeUrl: "", animationKey: "legacy-barbell-curl" }} onChange={onChange} />);
    expect(screen.getByRole("option", { name: /^Rosca Direta$/ })).toBeDefined();
    expect(screen.getByTestId("viewer").textContent).toBe("legacy-barbell-curl");
  });
  it("only embeds a validated video after the user requests playback", () => {
    const { container } = render(
      <YoutubePlayer url={url} title="Meu exercício" />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Reproduzir demonstração de Meu exercício",
      }),
    );
    const frame = container.querySelector("iframe")!;
    expect(frame.src).toContain(
      "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
    );
    expect(frame.getAttribute("referrerpolicy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(frame.allowFullscreen).toBe(true);
  });

  it("rejects foreign origins and script URLs while accepting Shorts and share links", () => {
    for (const bad of [
      "javascript:alert(1)",
      "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
      "https://youtu.be/short",
      "https://youtube.com/playlist?list=test",
    ])
      expect(youtubeVideoId(bad)).toBeNull();
    expect(youtubeVideoId("https://youtu.be/M7lc1UVf-VE?t=30")).toBe(
      "M7lc1UVf-VE",
    );
    expect(youtubeVideoId("https://www.youtube.com/shorts/M7lc1UVf-VE")).toBe(
      "M7lc1UVf-VE",
    );
  });

  it("opens with the coach video and switches to the explicitly selected 3D reference", () => {
    render(
      <ExerciseExecutionDialog
        isOpen
        onClose={() => {}}
        exerciseId={data.exerciseId}
        exerciseName="Exercício exclusivo"
        initialData={data}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Reproduzir demonstração de Exercício exclusivo",
      }),
    ).toBeDefined();
    expect(screen.queryByTestId("viewer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Simulação 3D/ }));
    expect(screen.getByTestId("viewer").textContent).toBe("squat");
    expect(screen.getByText(/Referência 3D:/).textContent).toContain(
      EXERCISE_ANIMATIONS.squat.name,
    );
    fireEvent.click(screen.getByRole("button", { name: "Vídeo do personal" }));
    expect(screen.queryByTestId("viewer")).toBeNull();
  });

  it("keeps the backend animation contract aligned with the available 3D library", () => {
    const contract = JSON.parse(
      readFileSync(path.resolve("swagger.json"), "utf8"),
    );
    const keys =
      contract.paths["/exercises/{exerciseId}/demonstration"].put.requestBody
        .content["application/json"].schema.properties.animationKey;
    const values =
      keys.enum ??
      keys.anyOf.find((item: { enum?: string[] }) => item.enum)?.enum;
    expect(values.filter((key: string | null) => key !== null).sort()).toEqual(
      Object.keys(EXERCISE_ANIMATIONS).sort(),
    );
  });
});
