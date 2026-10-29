import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AthleteAiWorkoutPlanModal } from "@/app/planning/_components/athlete-ai-workout-plan-modal";
import { generateWorkoutPlanWithAiAction } from "@/app/planning/_actions";
import { confirmWorkoutImportAction as confirmWorkoutImport } from "@/app/planning/_actions";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/app/planning/_actions", () => ({
  generateWorkoutPlanWithAiAction: vi.fn(),
  confirmWorkoutImportAction: vi.fn(),
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  confirmWorkoutImport: vi.fn(),
}));
const extraction = {
  name: null,
  workoutDays: [
    {
      name: null,
      weekDay: null,
      isRest: null,
      estimatedDurationInSeconds: null,
      exercises: [
        {
          name: "Supino",
          sets: null,
          reps: null,
          warmupSets: null,
          restTimeInSeconds: null,
          targetLoadInGrams: null,
          targetRir: null,
          tempo: null,
        },
      ],
    },
  ],
  provenance: [{ path: "workoutDays.0.exercises.0.name", quote: "Supino" }],
  questions: ["Informe os parâmetros da sua ficha."],
  requiresConfirmation: true as const,
  previewToken: "signed-preview",
};
async function openPreview() {
  vi.mocked(generateWorkoutPlanWithAiAction).mockResolvedValue({
    success: true,
    data: extraction,
  });
  render(
    <AthleteAiWorkoutPlanModal
      isOpen
      onClose={vi.fn()}
      onApplyPlan={vi.fn()}
    />,
  );
  fireEvent.change(
    screen.getByLabelText("Sua ficha ou lista, na ordem desejada"),
    { target: { value: "Supino" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Extrair e revisar ficha" }),
  );
  await screen.findByText("Revise e complete a ficha");
}
describe("Student workout organizer import", () => {
  beforeEach(() => vi.clearAllMocks());
  it("keeps absent parameters blank and does not save the AI response", async () => {
    await openPreview();
    expect((screen.getByLabelText("Séries") as HTMLInputElement).value).toBe(
      "",
    );
    expect(
      (screen.getByLabelText("Repetições") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Descanso (s)") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("button", {
          name: "Confirmar e salvar rascunho pessoal",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(confirmWorkoutImport).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation of the user-completed values", async () => {
    await openPreview();
    vi.mocked(confirmWorkoutImport).mockResolvedValue({
      status: 201,
      data: { id: "personal-plan" },
      headers: new Headers(),
    } as Awaited<ReturnType<typeof confirmWorkoutImport>>);
    for (const [label, value] of [
      ["Nome do plano", "Minha ficha"],
      ["Nome", "Treino A"],
      ["Dia", "MONDAY"],
      ["Tipo", "false"],
      ["Duração informada (segundos)", "1800"],
      ["Séries", "3"],
      ["Repetições", "10"],
      ["Séries de aquecimento", "0"],
      ["Descanso (s)", "90"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirmar e salvar rascunho pessoal",
      }),
    );
    await waitFor(() =>
      expect(confirmWorkoutImport).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmed: true,
          previewToken: "signed-preview",
          name: "Minha ficha",
          workoutDays: [
            expect.objectContaining({
              isRest: false,
              weekDay: "MONDAY",
              exercises: [
                expect.objectContaining({
                  name: "Supino",
                  sets: 3,
                  reps: 10,
                  warmupSets: 0,
                  restTimeInSeconds: 90,
                }),
              ],
            }),
          ],
        }),
      ),
    );
  });
});
