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
const catalog = vi.hoisted(() => ({
  refresh: vi.fn(async () => []),
  exercises: [
    {
      id: "catalog-remada",
      name: "Remada no cabo",
      muscles: [],
      ownerUserId: null,
      hasMedia: false,
    },
  ],
}));
vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({
    exercises: catalog.exercises,
    search: () => catalog.exercises,
    isSyncing: false,
    refresh: catalog.refresh,
  }),
}));
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
          exerciseId: "ex-supino",
          name: "Supino",
          sets: 3,
          reps: 10,
          restTimeInSeconds: 60,
          alternative1ExerciseName: "Flexão",
          alternative1ExerciseId: "ex-flexao",
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

function approveReview() {
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Revisei os exercícios/ }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirmar e enviar ao aluno" }),
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
    fireEvent.click(
      screen.getByRole("button", { name: /revisar e aprovar prescrição/i }),
    );
    expect(createPrescriptionDraftAction).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "Confirmar e enviar ao aluno",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    approveReview();
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
                exerciseId: "ex-supino",
                alternative1ExerciseId: "ex-flexao",
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
      version: 1,
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
    expect(
      screen.getByRole("button", { name: "Exercício principal: Supino" }),
    ).toBeDefined();
    expect(push).not.toHaveBeenCalled();
  });

  it("seleciona um exercício cadastrado e salva seu ID sem campo de nome livre", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    renderBuilder();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Exercício principal: Supino",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Selecionar Remada no cabo" }),
    );
    expect(
      screen.getByRole("button", {
        name: "Exercício principal: Remada no cabo",
      }),
    ).toBeDefined();
    expect(
      screen.queryByLabelText("Nome do exercício 1 de Treino A"),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() =>
      expect(createPrescriptionDraftAction).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutDays: [
            expect.objectContaining({
              exercises: [
                expect.objectContaining({
                  exerciseId: "catalog-remada",
                  name: "Remada no cabo",
                  alternative1ExerciseId: "ex-flexao",
                }),
              ],
            }),
          ],
        }),
      ),
    );
  });

  it("exige vincular exercícios antigos sem ID antes de salvar", () => {
    renderBuilder({
      ...initialData,
      workoutDays: [
        {
          ...initialData.workoutDays[0],
          exercises: [
            { ...initialData.workoutDays[0].exercises[0], exerciseId: "" },
          ],
        },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    expect(toast.error).toHaveBeenCalledWith(
      "Selecione todos os exercícios de Treino A no catálogo.",
    );
    expect(createPrescriptionDraftAction).not.toHaveBeenCalled();
  });

  it("mantém IDs e parâmetros ao duplicar um treino e editar cada cópia", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    renderBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Duplicar Treino A" }));
    fireEvent.change(screen.getByLabelText("Séries de trabalho"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() =>
      expect(createPrescriptionDraftAction).toHaveBeenCalled(),
    );
    const payload = vi.mocked(createPrescriptionDraftAction).mock.calls[0][0];
    expect(payload.workoutDays.map((day) => day.exercises[0])).toEqual([
      expect.objectContaining({
        exerciseId: "ex-supino",
        sets: 3,
        alternative1ExerciseId: "ex-flexao",
      }),
      expect.objectContaining({
        exerciseId: "ex-supino",
        sets: 5,
        alternative1ExerciseId: "ex-flexao",
      }),
    ]);
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
    const button = screen.getByRole("button", {
      name: /revisar e aprovar prescrição/i,
    });
    fireEvent.click(button);
    approveReview();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Rascunho salvo. Falha no envio",
      ),
    );
    await waitFor(() =>
      expect(button.closest("fieldset")?.disabled).toBe(false),
    );
    fireEvent.click(button);
    approveReview();
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(createPrescriptionDraftAction).toHaveBeenCalledTimes(1);
    expect(updatePrescriptionDraftAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "draft",
        body: expect.objectContaining({ version: 1 }),
      }),
    );
  });

  it("aplica séries, repetições e descanso preservando carga e aquecimento individuais", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    const exercise = initialData.workoutDays[0].exercises[0];
    const data = {
      ...initialData,
      workoutDays: [
        {
          ...initialData.workoutDays[0],
          exercises: [
            { ...exercise, targetLoadInGrams: 30000 },
            {
              ...exercise,
              exerciseId: "ex-remada",
              name: "Remada",
              sets: 4,
              reps: 15,
              restTimeInSeconds: 90,
              warmupSets: 2,
              targetLoadInGrams: 50000,
            },
          ],
        },
      ],
    };
    renderBuilder(data);
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Aplicar séries, reps e descanso aos demais",
      })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() =>
      expect(createPrescriptionDraftAction).toHaveBeenCalled(),
    );
    expect(
      vi.mocked(createPrescriptionDraftAction).mock.calls[0][0].workoutDays[0]
        .exercises[1],
    ).toEqual(
      expect.objectContaining({
        exerciseId: "ex-remada",
        sets: 3,
        reps: 10,
        restTimeInSeconds: 60,
        warmupSets: 2,
        targetLoadInGrams: 50000,
      }),
    );
  });

  it("compacta a segunda alternativa mantendo seu ID ao remover a primeira", async () => {
    vi.mocked(createPrescriptionDraftAction).mockResolvedValue({
      success: true,
      data: { id: "draft", version: 1 },
    } as Awaited<ReturnType<typeof createPrescriptionDraftAction>>);
    const data = {
      ...initialData,
      workoutDays: [
        {
          ...initialData.workoutDays[0],
          exercises: [
            {
              ...initialData.workoutDays[0].exercises[0],
              alternative2ExerciseId: "ex-halteres",
              alternative2ExerciseName: "Supino com halteres",
            },
          ],
        },
      ],
    };
    renderBuilder(data);
    fireEvent.click(screen.getByText("Alternativas do exercício (2/2)"));
    fireEvent.click(
      screen.getByRole("button", { name: "Remover alternativa 1" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() =>
      expect(createPrescriptionDraftAction).toHaveBeenCalled(),
    );
    expect(
      vi.mocked(createPrescriptionDraftAction).mock.calls[0][0].workoutDays[0]
        .exercises[0],
    ).toEqual(
      expect.objectContaining({
        alternative1ExerciseId: "ex-halteres",
        alternative1ExerciseName: "Supino com halteres",
        alternative2ExerciseId: null,
        alternative2ExerciseName: null,
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
