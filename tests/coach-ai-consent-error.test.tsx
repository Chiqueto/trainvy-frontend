import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoachAiPrescriptionModal } from "@/app/personal/alunos/[athleteId]/_components/coach-ai-prescription-modal";
import { generateCoachPrescriptionWithAiAction } from "@/app/personal/_actions";

vi.mock("@/app/personal/_actions", () => ({
  generateCoachPrescriptionWithAiAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/app/_hooks/use-voice-recorder", () => ({
  useVoiceRecorder: () => ({ isRecording: false }),
  formatRecordingTime: () => "0:00",
}));
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
describe("Professional AI authoring", () => {
  it("keeps authorization errors visible and preserves the coach's input", async () => {
    const message =
      "O vínculo com este aluno foi revogado. Não é possível gerar a prescrição.";
    vi.mocked(generateCoachPrescriptionWithAiAction).mockResolvedValue({
      success: false,
      error: message,
    });
    render(
      <CoachAiPrescriptionModal
        athleteId="athlete"
        athleteName="Aluno"
        isOpen
        onClose={vi.fn()}
        onApplyPrescription={vi.fn()}
      />,
    );
    const prompt = screen.getByRole("textbox");
    fireEvent.change(prompt, { target: { value: "Treino do aluno" } });
    fireEvent.click(screen.getByRole("button", { name: "Gerar com Coach AI" }));
    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect((prompt as HTMLTextAreaElement).value).toBe("Treino do aluno");
    expect(screen.queryByRole("link", { name: /seu perfil/i })).toBeNull();
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Gerar com Coach AI",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });
  it("generates a professional draft without a student consent step and returns it for review", async () => {
    const onApplyPrescription = vi.fn();
    vi.mocked(generateCoachPrescriptionWithAiAction).mockResolvedValue({
      success: true,
      data: {
        prescriptionId: "professional-draft",
        version: 1,
        status: "DRAFT",
        name: "Treino do personal",
        workoutDays: [
          {
            name: "Treino A",
            weekDay: "MONDAY",
            isRest: false,
            estimatedDurationInMinutes: 45,
            exercises: [
              {
                name: "Supino",
                sets: 3,
                warmupSets: 1,
                reps: 10,
                restTimeInSeconds: 60,
              },
            ],
          },
        ],
      },
    });
    render(
      <CoachAiPrescriptionModal
        athleteId="athlete"
        athleteName="Aluno"
        isOpen
        onClose={vi.fn()}
        onApplyPrescription={onApplyPrescription}
      />,
    );
    expect(
      screen.getByText(/A proposta usa suas instruções e anexos/),
    ).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Rotina do personal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gerar com Coach AI" }));
    const apply = await screen.findByRole("button", {
      name: "Aplicar ao Construtor",
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(onApplyPrescription).not.toHaveBeenCalled();
    fireEvent.click(apply);
    expect(onApplyPrescription).toHaveBeenCalledWith(
      expect.objectContaining({
        prescriptionId: "professional-draft",
        version: 1,
        name: "Treino do personal",
      }),
    );
    expect(generateCoachPrescriptionWithAiAction).toHaveBeenCalledTimes(1);
  });
});
