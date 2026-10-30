import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ListAdminExercises200Item } from "../app/_lib/api/fetch-generated";
import { implementationQueue } from "../app/admin/_lib/exercise-coverage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/_components/exercise-media/exercise-execution-dialog", () => ({
  ExerciseExecutionDialog: () => null,
}));
import { ExercisesCatalog } from "../app/admin/_components/exercises-catalog";

function exercise(
  id: string,
  name: string,
  tier: number,
  order: number,
): ListAdminExercises200Item {
  return {
    id,
    name,
    family: "Testes",
    groups: [],
    review: null,
    updatedAt: "2026-10-27T12:00:00Z",
    isUnilateral: false,
    muscles: [],
    media: [],
    priority3d: {
      exerciseId: id,
      exerciseName: name,
      tier,
      order,
      batch: "Base",
      reason: "Criar a base com trajetória e apoios específicos.",
    },
  };
}
const rows = [
  exercise(
    "00000000-0000-4000-8000-000000000101",
    "Supino Reto com Barra",
    1,
    1,
  ),
  exercise("second", "Elevação Pélvica", 1, 3),
  exercise("first", "Supino Declinado com Halteres", 1, 2),
  exercise("third", "Power Clean", 4, 4),
];
afterEach(cleanup);
describe("3D implementation queue", () => {
  it("removes the implemented leg extension while preserving the next pending hip thrust", () => {
    const queue = implementationQueue([
      exercise(
        "00000000-0000-4000-8000-000000000110",
        "Cadeira Extensora",
        1,
        13,
      ),
      exercise(
        "00000000-0000-4000-8000-000000000111",
        "Cadeira Flexora",
        1,
        14,
      ),
      exercise("00000000-0000-4000-8000-000000000112", "Mesa Flexora", 1, 15),
      exercise(
        "d3b3f492-65fa-4038-851f-6f46b69e9fb4",
        "Agachamento no Smith",
        1,
        16,
      ),
      exercise("7bd5b49f-252c-43a2-83a8-816d6401f6cb", "Agachamento Hack na Máquina", 1, 17),
      exercise("00000000-0000-4000-8000-000000000108", "Leg Press 45", 1, 17),
      exercise("00000000-0000-4000-8000-000000000109", "Leg Press Horizontal", 1, 18),
      exercise("00000000-0000-4000-8000-000000000113", "Stiff", 1, 19),
      exercise(
        "00000000-0000-4000-8000-000000000114",
        "Elevação Pélvica",
        1,
        20,
      ),
    ]);
    expect([...queue.entries()]).toEqual([
      ["00000000-0000-4000-8000-000000000114", 1],
    ]);
  });
  it("excludes available animations and gives pending exercises stable positions", () => {
    const queue = implementationQueue(rows);
    expect(queue.has(rows[0].id)).toBe(false);
    expect([...queue.entries()]).toEqual([
      ["first", 1],
      ["second", 2],
      ["third", 3],
    ]);
    expect(implementationQueue([...rows].reverse())).toEqual(queue);
    expect(
      implementationQueue([
        ...rows,
        exercise(
          "00000000-0000-4000-8000-000000000103",
          "Supino Inclinado com Halteres",
          1,
          2,
        ),
      ]).has("00000000-0000-4000-8000-000000000103"),
    ).toBe(false);
  });
  it("preserves global queue positions when filtering and allows switching to alphabetical order", () => {
    render(<ExercisesCatalog exercises={rows} />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Supino Declinado com Halteres",
    );
    fireEvent.change(screen.getByLabelText("Prioridade 3D"), {
      target: { value: "4" },
    });
    expect(within(table).getByText("#3 na fila")).toBeTruthy();
    expect(within(table).queryByText("#1 na fila")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    fireEvent.change(screen.getByLabelText("Ordenação"), {
      target: { value: "name:asc" },
    });
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Elevação Pélvica",
    );
    expect(within(table).getByText("#2 na fila")).toBeTruthy();
  });
});
