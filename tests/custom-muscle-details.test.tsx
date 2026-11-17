import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { CustomExerciseModal } from "@/app/personal/exercicios/_components/custom-exercise-modal";
import {
  createCustomExerciseAction,
  updateCustomExerciseAction,
} from "@/app/personal/_actions";

vi.mock("@/app/personal/_actions", () => ({
  createCustomExerciseAction: vi.fn(),
  updateCustomExerciseAction: vi.fn(),
}));
vi.mock("@/app/personal/exercicios/_components/demonstration-fields", () => ({
  DemonstrationFields: () => null,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createCustomExerciseAction).mockResolvedValue({
    success: false,
    error: "Tente novamente",
  });
  vi.mocked(updateCustomExerciseAction).mockResolvedValue({
    success: false,
    error: "Tente novamente",
  });
});

it("salva detalhes opcionais e move o detalhamento com o papel do grupo", async () => {
  render(<CustomExerciseModal isOpen onClose={() => {}} />);
  fireEvent.change(screen.getByLabelText(/Nome do Exercício/), {
    target: { value: "Remada própria" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Costas" })[0]);
  fireEvent.click(screen.getByLabelText("Latíssimo do dorso"));
  fireEvent.click(screen.getAllByRole("button", { name: "Peito" })[0]);
  fireEvent.click(screen.getAllByRole("button", { name: "Costas" })[1]);
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar Exercício" }));
  await waitFor(() =>
    expect(createCustomExerciseAction).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryMuscleGroups: ["CHEST"],
        secondaryMuscleGroups: ["BACK"],
        muscleDetails: [
          {
            muscleGroup: "BACK",
            role: "SECONDARY",
            detailIds: ["LATISSIMUS_DORSI"],
          },
        ],
      }),
    ),
  );
  expect(
    (screen.getByLabelText("Latíssimo do dorso") as HTMLInputElement).checked,
  ).toBe(true);
});

it("restaura detalhes ao editar e remove os detalhes ao desmarcar o grupo", async () => {
  render(
    <CustomExerciseModal
      isOpen
      onClose={() => {}}
      exerciseToEdit={{
        id: "custom",
        name: "Remada",
        muscles: [{ muscleGroup: "BACK", role: "PRIMARY" }],
        muscleDetails: [
          { muscleGroup: "BACK", role: "PRIMARY", detailIds: ["RHOMBOIDS"] },
        ],
      }}
    />,
  );
  expect((screen.getByLabelText("Romboides") as HTMLInputElement).checked).toBe(
    true,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Costas" })[0]);
  fireEvent.click(screen.getAllByRole("button", { name: "Costas" })[0]);
  expect((screen.getByLabelText("Romboides") as HTMLInputElement).checked).toBe(
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Atualizar Exercício" }));
  await waitFor(() =>
    expect(updateCustomExerciseAction).toHaveBeenCalledWith(
      "custom",
      expect.objectContaining({ muscleDetails: [] }),
    ),
  );
});
