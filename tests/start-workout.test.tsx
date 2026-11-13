import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import * as api from "@/app/_lib/api/fetch-generated";
import { startWorkoutAction } from "@/app/workout-plans/[id]/days/[dayId]/_actions";
import { StartWorkoutButton } from "@/app/workout-plans/[id]/days/[dayId]/_components/start-workout-button";
import { StartFreeWorkoutButton } from "@/app/_components/start-free-workout-button";
import { CompleteWorkoutButton } from "@/app/workout-plans/[id]/days/[dayId]/_components/complete-workout-button";
import { runWorkoutAction } from "@/app/_lib/show-workout-action-error";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  startWorkoutSession: vi.fn(),
  startFreeWorkoutSession: vi.fn(),
  completeWorkoutSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"))
      throw error;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("Toasts nas ações de treino", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    [
      "HEALTH_CONSENT_REQUIRED",
      "Autorize o uso dos dados de saúde",
      "consentimento de saúde",
    ],
    [
      "LEGAL_ACCEPTANCE_REQUIRED",
      "Os termos precisam da sua atenção",
      "política de privacidade",
    ],
  ])(
    "personaliza o toast para %s e oferece acesso ao perfil",
    async (code, title, description) => {
      vi.mocked(api.startWorkoutSession).mockResolvedValue({
        status: 403,
        data: { error: "Raw backend message", code },
        headers: new Headers(),
      });
      render(
        <StartWorkoutButton workoutPlanId="plan-1" workoutDayId="day-1" />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Iniciar Treino" }));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          title,
          expect.objectContaining({
            id: "workout-action-error",
            description: expect.stringContaining(description),
            action: expect.objectContaining({ label: "Revisar perfil" }),
          }),
        ),
      );
      const action = vi.mocked(toast.error).mock.calls[0][1]!.action;
      if (
        !action ||
        typeof action !== "object" ||
        !("onClick" in action) ||
        typeof action.onClick !== "function"
      )
        throw new Error("Ação do toast ausente");
      action.onClick({} as Parameters<typeof action.onClick>[0]);
      expect(router.push).toHaveBeenCalledWith("/profile");
      expect(api.startWorkoutSession).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(console.error).not.toHaveBeenCalled();
    },
  );

  it("permite repetir a tentativa sem acumular toasts", async () => {
    vi.mocked(api.startWorkoutSession).mockResolvedValue({
      status: 500,
      data: { error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
      headers: new Headers(),
    });
    render(<StartWorkoutButton workoutPlanId="plan-1" workoutDayId="day-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível iniciar o treino",
        expect.objectContaining({
          description: expect.stringContaining("serviço está indisponível"),
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false),
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
    expect(
      vi
        .mocked(toast.error)
        .mock.calls.every(
          ([, options]) => options?.id === "workout-action-error",
        ),
    ).toBe(true);
  });

  it("orienta continuar o treino atual ao iniciar avulso em conflito", async () => {
    vi.mocked(api.startFreeWorkoutSession).mockResolvedValue({
      status: 409,
      data: { error: "Conflict", code: "CONFLICT" },
      headers: new Headers(),
    });
    render(<StartFreeWorkoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Treino avulso" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Você já tem um treino em andamento",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Ver treino atual" }),
        }),
      ),
    );
  });

  it("mostra falhas de finalização no toaster", async () => {
    vi.mocked(api.completeWorkoutSession).mockResolvedValue({
      status: 500,
      data: { error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
      headers: new Headers(),
    });
    render(
      <CompleteWorkoutButton
        workoutPlanId="plan-1"
        workoutDayId="day-1"
        sessionId="session-1"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Finalizar treino diretamente" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível finalizar o treino",
        expect.any(Object),
      ),
    );
  });

  it("avisa sessão expirada com ação de login", async () => {
    vi.mocked(api.startWorkoutSession).mockResolvedValue({
      status: 401,
      data: { error: "Unauthorized", code: "UNAUTHORIZED" },
      headers: new Headers(),
    });
    render(<StartWorkoutButton workoutPlanId="plan-1" workoutDayId="day-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Sua sessão expirou",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Entrar novamente" }),
        }),
      ),
    );
  });

  it("trata falha da Server Action sem expor mensagens internas", async () => {
    await runWorkoutAction(
      () => Promise.reject(new Error("Minified React error")),
      router.push,
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Não conseguimos conectar",
      expect.objectContaining({
        description: expect.not.stringContaining("Minified"),
      }),
    );
  });

  it("retorna mensagem segura quando a chamada à API falha", async () => {
    vi.mocked(api.startWorkoutSession).mockRejectedValue(
      new Error("fetch failed"),
    );
    await expect(startWorkoutAction("plan-1", "day-1")).resolves.toMatchObject({
      code: "NETWORK_ERROR",
      title: "Não conseguimos conectar",
    });
  });

  it("preserva redirecionamento de sucesso sem disparar toast", async () => {
    vi.mocked(api.startWorkoutSession).mockResolvedValue({
      status: 201,
      data: { userWorkoutSessionId: "session-1", exercises: [] },
      headers: new Headers(),
    });
    await expect(
      runWorkoutAction(
        () => startWorkoutAction("plan-1", "day-1"),
        router.push,
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/workout-sessions/session-1");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
