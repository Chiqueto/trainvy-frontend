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
import type { ListAdminExercises200Item } from "../app/_lib/api/fetch-generated";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/_components/exercise-media/exercise-execution-dialog", () => ({
  ExerciseExecutionDialog: () => null,
}));
vi.mock("../app/admin/_actions", () => ({ saveAdminExerciseMuscles: vi.fn() }));
import { saveAdminExerciseMuscles } from "../app/admin/_actions";
import { ExercisesCatalog } from "../app/admin/_components/exercises-catalog";

const base = {
  family: "Landmine",
  isUnilateral: false,
  updatedAt: "2026-10-27T12:00:00.000Z",
  review: null,
  priority3d: null,
  media: [],
};
const exercises: ListAdminExercises200Item[] = [
  {
    ...base,
    id: "squat",
    name: "Agachamento no Landmine",
    groups: ["RESISTANCE"],
    muscles: [
      { muscleGroup: "QUADRICEPS", role: "PRIMARY" },
      { muscleGroup: "GLUTES", role: "PRIMARY" },
      { muscleGroup: "CORE", role: "SECONDARY" },
    ],
  },
  {
    ...base,
    id: "press",
    name: "Push Press Unilateral no Landmine",
    groups: ["RESISTANCE", "POWER"],
    muscles: [
      { muscleGroup: "SHOULDERS", role: "PRIMARY" },
      { muscleGroup: "QUADRICEPS", role: "PRIMARY" },
      { muscleGroup: "TRICEPS", role: "SECONDARY" },
      { muscleGroup: "CORE", role: "SECONDARY" },
    ],
  },
  {
    ...base,
    id: "anti",
    name: "Anti-Rotação no Landmine",
    groups: ["CORE_STABILITY"],
    muscles: [
      { muscleGroup: "CORE", role: "PRIMARY" },
      { muscleGroup: "SHOULDERS", role: "SECONDARY" },
    ],
  },
];
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);
describe("Catalog organization", () => {
  it("combines exercise group and primary/secondary muscle filters", () => {
    render(<ExercisesCatalog exercises={exercises} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "Grupo de exercícios" }),
      { target: { value: "POWER" } },
    );
    fireEvent.change(screen.getByLabelText("Grupo muscular"), {
      target: { value: "CORE" },
    });
    fireEvent.change(screen.getByLabelText("Papel do músculo"), {
      target: { value: "SECONDARY" },
    });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getByText(exercises[1].name)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Papel do músculo"), {
      target: { value: "PRIMARY" },
    });
    expect(screen.getByText("Nenhum exercício encontrado")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(within(table).getAllByRole("row")).toHaveLength(4);
  });
  it("sorts in both directions by column and persists column visibility/order", () => {
    const view = render(<ExercisesCatalog exercises={exercises} />);
    const header = screen.getByRole("columnheader", { name: /^Exercício/ });
    fireEvent.click(within(header).getByRole("button"));
    expect(header.getAttribute("aria-sort")).toBe("ascending");
    expect(
      within(screen.getByRole("table")).getAllByRole("row")[1].textContent,
    ).toContain(exercises[0].name);
    fireEvent.click(within(header).getByRole("button"));
    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(
      within(screen.getByRole("table")).getAllByRole("row")[1].textContent,
    ).toContain(exercises[1].name);
    fireEvent.click(screen.getByText("Organizar colunas"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Imagens" }));
    expect(screen.queryByRole("columnheader", { name: /^Imagens/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Mover Exercício para a esquerda" }),
    );
    expect(screen.getAllByRole("columnheader")[0].textContent).toContain(
      "Exercício",
    );
    view.unmount();
    render(<ExercisesCatalog exercises={exercises} />);
    expect(screen.queryByRole("columnheader", { name: /^Imagens/ })).toBeNull();
    expect(screen.getAllByRole("columnheader")[0].textContent).toContain(
      "Exercício",
    );
  });
  it("preserves the muscle edit after an API failure and updates the row after success", async () => {
    vi.mocked(saveAdminExerciseMuscles)
      .mockResolvedValueOnce({ success: false, code: "UNAVAILABLE" })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: "anti",
          updatedAt: "2026-10-28T12:00:00.000Z",
          muscles: [{ muscleGroup: "HIP_FLEXORS", role: "PRIMARY" }],
        },
      });
    render(<ExercisesCatalog exercises={exercises} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `Ver detalhes de ${exercises[2].name}`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar músculos" }));
    const form = screen.getByRole("form");
    const primary = within(form).getByRole("group", { name: "Principais" });
    const secondary = within(form).getByRole("group", { name: "Secundários" });
    fireEvent.click(within(primary).getByRole("checkbox", { name: "Core" }));
    fireEvent.click(
      within(primary).getByRole("checkbox", { name: "Flexores do quadril" }),
    );
    fireEvent.click(
      within(secondary).getByRole("checkbox", { name: "Ombros" }),
    );
    expect(
      (
        within(secondary).getByRole("checkbox", {
          name: "Flexores do quadril",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      within(form).getByRole("button", { name: "Salvar músculos" }),
    );
    await screen.findByRole("alert");
    expect(
      (
        within(primary).getByRole("checkbox", {
          name: "Flexores do quadril",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    fireEvent.click(
      within(form).getByRole("button", { name: "Salvar músculos" }),
    );
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
    expect(saveAdminExerciseMuscles).toHaveBeenLastCalledWith("anti", {
      expectedUpdatedAt: base.updatedAt,
      primaryMuscleGroups: ["HIP_FLEXORS"],
      secondaryMuscleGroups: [],
    });
    expect(
      within(screen.getByRole("table")).getAllByText("Flexores do quadril")
        .length,
    ).toBeGreaterThan(0);
  });
  it("requires a primary muscle and handles corrupted local column settings", () => {
    localStorage.setItem("trainvy:admin:exercise-columns:v1", "null");
    render(<ExercisesCatalog exercises={exercises} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: `Ver detalhes de ${exercises[2].name}`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar músculos" }));
    const form = screen.getByRole("form");
    fireEvent.click(
      within(within(form).getByRole("group", { name: "Principais" })).getByRole(
        "checkbox",
        { name: "Core" },
      ),
    );
    fireEvent.click(
      within(form).getByRole("button", { name: "Salvar músculos" }),
    );
    expect(screen.getByRole("alert").textContent).toContain("pelo menos um");
    expect(saveAdminExerciseMuscles).not.toHaveBeenCalled();
  });
});
