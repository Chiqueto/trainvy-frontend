import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startWorkoutSession } from "@/app/_lib/api/fetch-generated";
import { startWorkoutAction } from "@/app/workout-plans/[id]/days/[dayId]/_actions";
import { StartWorkoutButton } from "@/app/workout-plans/[id]/days/[dayId]/_components/start-workout-button";

vi.mock("@/app/_lib/api/fetch-generated", () => ({
  startWorkoutSession: vi.fn(),
  completeWorkoutSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("Iniciar treino", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("uma falha interna da API mantém a página e permite repetir o início", async () => {
    vi.mocked(startWorkoutSession).mockResolvedValue({
      status: 500,
      data: { error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
      headers: new Headers(),
    });
    render(<StartWorkoutButton workoutPlanId="plan-1" workoutDayId="day-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Treino" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Não foi possível iniciar o treino",
    );
    await waitFor(() =>
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false),
    );
    expect(console.error).toHaveBeenCalledWith(
      "[startWorkoutAction] API não iniciou a sessão",
      {
        workoutPlanId: "plan-1",
        workoutDayId: "day-1",
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
      },
    );
  });

  it("exibe o conflito de sessão na tela e permite tentar novamente", async () => {
    vi.mocked(startWorkoutSession).mockResolvedValue({
      status: 409,
      data: {
        error: "There is already a workout session in progress",
        code: "CONFLICT",
      },
      headers: new Headers(),
    });
    render(<StartWorkoutButton workoutPlanId="plan-1" workoutDayId="day-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar Treino" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Já existe um treino em andamento",
    );
    await waitFor(() =>
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false),
    );
    expect(startWorkoutSession).toHaveBeenCalledWith("plan-1", "day-1");
  });

  it("retorna uma mensagem recuperável quando a conexão falha", async () => {
    vi.mocked(startWorkoutSession).mockRejectedValue(new Error("fetch failed"));
    await expect(startWorkoutAction("plan-1", "day-1")).resolves.toEqual({
      error: "Não foi possível conectar ao servidor. Tente novamente.",
    });
  });

  it("redireciona para login quando a sessão de autenticação expirou", async () => {
    vi.mocked(startWorkoutSession).mockResolvedValue({
      status: 401,
      data: { error: "Unauthorized", code: "UNAUTHORIZED" },
      headers: new Headers(),
    });
    await expect(startWorkoutAction("plan-1", "day-1")).rejects.toThrow(
      "NEXT_REDIRECT:/auth",
    );
  });

  it("mantém o redirecionamento para a sessão criada", async () => {
    vi.mocked(startWorkoutSession).mockResolvedValue({
      status: 201,
      data: { userWorkoutSessionId: "session-1", exercises: [] },
      headers: new Headers(),
    });
    await expect(startWorkoutAction("plan-1", "day-1")).rejects.toThrow(
      "NEXT_REDIRECT:/workout-sessions/session-1",
    );
  });
});
