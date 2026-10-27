import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { CoachPrescriptionBuilder } from "@/app/personal/alunos/[athleteId]/_components/coach-prescription-builder";
import {
  createPrescriptionDraftAction,
  updatePrescriptionDraftAction,
  sendPrescriptionAction,
} from "@/app/personal/_actions";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock(
  "@/app/personal/alunos/[athleteId]/_components/coach-ai-prescription-modal",
  () => ({ CoachAiPrescriptionModal: () => null }),
);
vi.mock("@/app/personal/_actions", () => ({
  createPrescriptionDraftAction: vi.fn(),
  updatePrescriptionDraftAction: vi.fn(),
  sendPrescriptionAction: vi.fn(),
}));

const initialData = {
  name: "Plano do aluno",
  workoutDays: [
    {
      name: "Treino A",
      isRest: false,
      estimatedDurationInSeconds: 3600,
      exercises: [
        {
          name: "Supino",
          sets: 3,
          reps: 10,
          restTimeInSeconds: 60,
          alternative1ExerciseName: "Flexão",
        },
      ],
    },
  ],
};
function renderBuilder(data = initialData) {
  return render(
    <CoachPrescriptionBuilder
      athleteId="aluno"
      athleteName="Aluno"
      initialData={data}
    />,
  );
}

describe("Salvar prescrição do personal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("salva e envia o contrato completo e confirma por toast", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    vi.mocked(sendPrescriptionAction).mockResolvedValue({
      success: true,
    } as Awaited<ReturnType<typeof sendPrescriptionAction>>);
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: /salvar e enviar/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(createPrescriptionDraftAction).toHaveBeenCalledWith(
      expect.objectContaining({
        athleteId: "aluno",
        workoutDays: [
          expect.objectContaining({
            estimatedDurationInSeconds: 3600,
            exercises: [
              expect.objectContaining({
                order: 0,
                sets: 3,
                alternative1ExerciseName: "Flexão",
              }),
            ],
          }),
        ],
      }),
    );
    expect(sendPrescriptionAction).toHaveBeenCalledWith({
      id: "draft",
      athleteId: "aluno",
    });
    expect(toast.success).toHaveBeenCalledWith("Prescrição enviada ao aluno!");
  });

  it("informa o erro em toast e mantém os campos preenchidos", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: false,
      error: "Revise as séries.",
    });
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Revise as séries."),
    );
    expect(screen.getByDisplayValue("Supino")).toBeDefined();
    expect(push).not.toHaveBeenCalled();
  });

  it("reutiliza o rascunho e sua versão quando o envio falha", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    vi.mocked(updatePrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 2 },
    } as Awaited<ReturnType<typeof updatePrescriptionDraftAction>>);
    vi.mocked(sendPrescriptionAction)
      .mockResolvedValueOnce({ success: false, error: "Falha no envio" })
      .mockResolvedValueOnce({ success: true } as Awaited<
        ReturnType<typeof sendPrescriptionAction>
      >);
    renderBuilder();
    const button = screen.getByRole("button", { name: /salvar e enviar/i });
    fireEvent.click(button);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Rascunho salvo. Falha no envio",
      ),
    );
    await waitFor(() =>
      expect(button.closest("fieldset")?.disabled).toBe(false),
    );
    fireEvent.click(button);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(createPrescriptionDraftAction).toHaveBeenCalledTimes(1);
    expect(updatePrescriptionDraftAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "draft",
        body: expect.objectContaining({ version: 1 }),
      }),
    );
  });

  it.each([1.5, NaN, Infinity])(
    "bloqueia séries inválidas (%s) antes de chegar à API",
    async (sets) => {
      renderBuilder({
        ...initialData,
        workoutDays: [
          {
            ...initialData.workoutDays[0],
            exercises: [{ ...initialData.workoutDays[0].exercises[0], sets }],
          },
        ],
      });
      fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
      expect(toast.error).toHaveBeenCalled();
      expect(createPrescriptionDraftAction).not.toHaveBeenCalled();
    },
  );

  it("valida o nome dos dias de descanso antes de salvar", () => {
    renderBuilder({
      ...initialData,
      workoutDays: [{ ...initialData.workoutDays[0], name: "", isRest: true }],
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    expect(toast.error).toHaveBeenCalledWith("Informe o nome do treino 1.");
    expect(createPrescriptionDraftAction).not.toHaveBeenCalled();
  });
});
