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
describe("Professional AI consent errors", () => {
  it("keeps the student's actionable consent message visible and preserves the coach's input", async () => {
    const message =
      "O aluno precisa aceitar a versão atual do termo de saúde e IA. Peça a ele que acesse o próprio perfil e registre o aceite para continuar.";
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
});
