import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachGuidedTour } from "@/app/personal/_components/coach-guided-tour";
import { CreateStudentModal } from "@/app/personal/_components/create-student-modal";
import {
  completeTourAction,
  loadToursAction,
} from "@/app/personal/_tour-actions";
import { createManagedStudentAction } from "@/app/personal/_actions";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/personal/_tour-actions", () => ({
  loadToursAction: vi.fn(),
  completeTourAction: vi.fn(),
}));
vi.mock("@/app/personal/_actions", () => ({
  createManagedStudentAction: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadToursAction).mockResolvedValue({
    coachOnboardingCompleted: false,
    workoutBuilderOnboardingCompleted: false,
  });
  vi.mocked(completeTourAction).mockResolvedValue(true);
});

describe("Guias do personal", () => {
  it("abre na primeira visita e salva o skip no servidor", async () => {
    render(<CoachGuidedTour tour="workspace" />);
    await screen.findByText("Sua assessoria começa aqui");
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));
    await waitFor(() =>
      expect(completeTourAction).toHaveBeenCalledWith("workspace"),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("não reabre guia concluído, mas permite rever", async () => {
    vi.mocked(loadToursAction).mockResolvedValue({
      coachOnboardingCompleted: true,
      workoutBuilderOnboardingCompleted: false,
    });
    render(<CoachGuidedTour tour="workspace" />);
    const replay = await screen.findByRole("button", { name: "Rever guia" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(replay);
    expect(screen.getByText("Sua assessoria começa aqui")).toBeDefined();
  });
  it("apresenta o editor independentemente do painel e permite navegar até concluir", async () => {
    vi.mocked(loadToursAction).mockResolvedValue({
      coachOnboardingCompleted: true,
      workoutBuilderOnboardingCompleted: false,
    });
    render(<CoachGuidedTour tour="builder" />);
    await screen.findByText("Conheça o novo editor de treinos");
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    expect(screen.getByText("Organize a divisão")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    for (let i = 0; i < 4; i++)
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() =>
      expect(completeTourAction).toHaveBeenCalledWith("builder"),
    );
  });
  it("não exibe o guia para uma conta sem acesso", async () => {
    vi.mocked(loadToursAction).mockResolvedValue(null);
    render(<CoachGuidedTour tour="builder" />);
    await waitFor(() => expect(loadToursAction).toHaveBeenCalled());
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Cadastro sem conta", () => {
  it("cadastra e abre o aluno para preparar a ficha", async () => {
    vi.mocked(createManagedStudentAction).mockResolvedValue({
      success: true,
      data: { athleteId: "managed-1" },
    });
    render(<CreateStudentModal isFull={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar aluno" }));
    fireEvent.change(screen.getByLabelText("Nome do aluno"), {
      target: { value: "  Ana Silva  " },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Cadastrar e montar treino" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(createManagedStudentAction).toHaveBeenCalledWith("Ana Silva"),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/personal/alunos/managed-1"),
    );
  });
  it("preserva o nome se o servidor recusar o cadastro", async () => {
    vi.mocked(createManagedStudentAction).mockResolvedValue({
      success: false,
      error: "Limite atingido",
    });
    render(<CreateStudentModal isFull={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar aluno" }));
    fireEvent.change(screen.getByLabelText("Nome do aluno"), {
      target: { value: "Ana Silva" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Cadastrar e montar treino" })
        .closest("form")!,
    );
    await screen.findByRole("alert");
    expect(
      (screen.getByLabelText("Nome do aluno") as HTMLInputElement).value,
    ).toBe("Ana Silva");
    expect(push).not.toHaveBeenCalled();
  });
});
