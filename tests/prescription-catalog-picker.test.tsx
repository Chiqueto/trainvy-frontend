import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CatalogExerciseBatchPicker,
  CatalogExercisePicker,
} from "@/app/planning/_components/catalog-exercise-picker";
import { filterExercisesInstant } from "@/app/_lib/exercise-catalog-cache";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import type { MuscleGroup } from "@/app/_lib/muscle-labels";

const { refresh, select, selectMany } = vi.hoisted(() => ({
  refresh: vi.fn(async () => []),
  select: vi.fn(),
  selectMany: vi.fn(),
}));
const exercises: ListExercises200Item[] = [
  {
    id: "supino",
    name: "Supino",
    ownerUserId: null,
    hasMedia: false,
    muscles: [{ id: "muscle-supino", muscleGroup: "CHEST", role: "PRIMARY" }],
  },
  {
    id: "flexao",
    name: "Flexão adaptada",
    ownerUserId: "coach",
    hasMedia: false,
    muscles: [{ id: "muscle-flexao", muscleGroup: "CHEST", role: "PRIMARY" }],
  },
  {
    id: "remada",
    name: "Remada",
    ownerUserId: null,
    hasMedia: false,
    muscles: [{ id: "muscle-remada", muscleGroup: "BACK", role: "PRIMARY" }],
  },
];
vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({
    exercises,
    isSyncing: false,
    refresh,
    search: (query: string, muscle?: MuscleGroup | "") =>
      filterExercisesInstant(exercises, query, muscle),
  }),
}));
vi.mock("@/app/workout-sessions/[sessionId]/_actions", () => ({}));

describe("Biblioteca de exercícios da prescrição", () => {
  beforeEach(() => vi.clearAllMocks());

  it("combina busca sem acentos, origem e filtro muscular", () => {
    render(
      <CatalogExercisePicker label="Exercício principal" onSelect={select} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Exercício principal:/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Meus exercícios (1)" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Peito" }));
    fireEvent.change(screen.getByLabelText("Buscar exercícios"), {
      target: { value: "flexao" },
    });
    expect(
      screen.getByRole("button", { name: "Selecionar Flexão adaptada" }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Selecionar Supino" }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar Flexão adaptada" }),
    );
    expect(select).toHaveBeenCalledWith(exercises[1]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("seleciona em lote entre filtros e preserva a ordem da sequência", () => {
    render(
      <CatalogExerciseBatchPicker
        onSelect={selectMany}
        excludeIds={["supino"]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    expect(
      screen.queryByRole("button", { name: "Selecionar Supino" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Remada" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Meus exercícios (1)" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Selecionar Flexão adaptada" }),
    );
    expect(selectMany).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar 2 ao treino" }),
    );
    expect(selectMany).toHaveBeenCalledWith([exercises[2], exercises[1]]);
  });

  it("cancela a seleção sem adicionar exercícios ao treino", () => {
    render(<CatalogExerciseBatchPicker onSelect={selectMany} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Remada" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar catálogo" }));
    expect(selectMany).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar exercícios" }),
    );
    expect(
      (screen.getByRole("button", { name: /ao treino/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("inicia alternativas pelo músculo do principal e exclui opções repetidas", () => {
    render(
      <CatalogExercisePicker
        label="Alternativa 1"
        relatedExerciseId="supino"
        excludeIds={["supino"]}
        onSelect={select}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Alternativa 1:/ }));
    const dialog = within(screen.getByRole("dialog"));
    expect(
      dialog
        .getByRole("button", { name: "Peito" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      dialog.queryByRole("button", { name: "Selecionar Supino" }),
    ).toBeNull();
    expect(
      dialog.queryByRole("button", { name: "Selecionar Remada" }),
    ).toBeNull();
    fireEvent.click(dialog.getByRole("button", { name: "Todos os grupos" }));
    expect(
      dialog.getByRole("button", { name: "Selecionar Remada" }),
    ).toBeDefined();
  });
});
