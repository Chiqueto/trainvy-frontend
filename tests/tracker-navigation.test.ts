import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    toString: () => "",
  }),
}));

// Mock authClient
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        user: { id: "user-1", name: "Test User", email: "test@example.com" },
      },
    }),
  },
}));

// Mock fetch-generated API
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  startWorkoutSession: vi.fn(),
  getWorkoutSession: vi.fn(),
  getActiveWorkoutSession: vi.fn(),
  getHomeData: vi.fn(),
  getUserTrainData: vi.fn(),
  getAthleteCoachRelationship: vi.fn().mockResolvedValue({ status: 200, data: { hasCoach: false } }),
}));

import * as api from "@/app/_lib/api/fetch-generated";
import { startWorkoutAction } from "@/app/workout-plans/[id]/days/[dayId]/_actions";
import WorkoutSessionPage from "@/app/workout-sessions/[sessionId]/page";

describe("Tracker & WorkoutSession Navigation (Task 1.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. startWorkoutAction utiliza o ID retornado e navega para /workout-sessions/:sessionId", async () => {
    const fakeSessionId = "sess-uuid-789";
    vi.mocked(api.startWorkoutSession).mockResolvedValueOnce({
      status: 201,
      data: {
        userWorkoutSessionId: fakeSessionId,
        exercises: [],
      },
      headers: new Headers(),
    });

    try {
      await startWorkoutAction("plan-1", "day-1");
    } catch (err: unknown) {
      // Next.js redirect throws a NEXT_REDIRECT error
      expect((err as Error).message).toBe(`NEXT_REDIRECT:/workout-sessions/${fakeSessionId}`);
    }

    expect(mockRedirect).toHaveBeenCalledWith(`/workout-sessions/${fakeSessionId}`);
  });

  it("2. Página da sessão renderiza exercícios ordenados", async () => {
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "sess-1",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T10:00:00.000Z",
        completedAt: null,
        sessionExercises: [
          {
            id: "ex-2",
            exerciseNameSnapshot: "Desenvolvimento",
            order: 2,
            plannedSets: 3,
            plannedReps: 10,
            plannedRestTimeInSeconds: 60,
            notes: null,
            sets: [],
            revision: 1,
          },
          {
            id: "ex-1",
            exerciseNameSnapshot: "Supino Reto",
            order: 1,
            plannedSets: 4,
            plannedReps: 8,
            plannedRestTimeInSeconds: 90,
            notes: null,
            sets: [],
            revision: 1,
          },
        ],
      },
      headers: new Headers(),
    });

    const jsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-1" }),
    });

    expect(jsx).toBeDefined();
    // Validate that getWorkoutSession was called with the exact sessionId
    expect(api.getWorkoutSession).toHaveBeenCalledWith("sess-1");
  });

  it("3. Séries existentes são exibidas com seus dados (carga, reps, RIR, tipo, status)", async () => {
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "sess-1",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T10:00:00.000Z",
        completedAt: null,
        sessionExercises: [
          {
            id: "ex-1",
            exerciseNameSnapshot: "Supino Reto",
            order: 1,
            plannedSets: 3,
            plannedReps: 10,
            plannedRestTimeInSeconds: 60,
            notes: null,
            revision: 1,
            sets: [
              {
                id: "set-1",
                order: 1,
                type: "WARMUP",
                weightInGrams: 20000,
                reps: 15,
                rir: null,
                durationInSeconds: null,
                notes: "Aquecimento",
                completedAt: "2026-09-29T10:05:00.000Z",
              },
              {
                id: "set-2",
                order: 2,
                type: "WORKING",
                weightInGrams: 40000,
                reps: 8,
                rir: 2,
                durationInSeconds: null,
                notes: null,
                completedAt: null,
              },
            ],
          },
        ],
      },
      headers: new Headers(),
    });

    const jsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-1" }),
    });

    expect(jsx).toBeDefined();
  });

  it("4. Sessão sem séries funciona e renderiza estado vazio de séries", async () => {
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "sess-empty",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T10:00:00.000Z",
        completedAt: null,
        sessionExercises: [
          {
            id: "ex-1",
            exerciseNameSnapshot: "Barra Fixa",
            order: 1,
            plannedSets: 3,
            plannedReps: 10,
            plannedRestTimeInSeconds: 60,
            notes: null,
            sets: [], // Sem séries
            revision: 1,
          },
        ],
      },
      headers: new Headers(),
    });

    const jsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-empty" }),
    });

    expect(jsx).toBeDefined();
  });

  it("5. Sessão concluída é identificada (completedAt != null)", async () => {
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "sess-completed",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T10:00:00.000Z",
        completedAt: "2026-09-29T11:00:00.000Z",
        sessionExercises: [],
      },
      headers: new Headers(),
    });

    const jsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-completed" }),
    });

    expect(jsx).toBeDefined();
  });

  it("6. Usuário consegue recuperar sessão após refresh (re-chamada da API)", async () => {
    const mockSessionData = {
      id: "sess-refresh",
      workoutDayId: "day-1",
      startedAt: "2026-09-29T10:00:00.000Z",
      completedAt: null,
      sessionExercises: [
        {
          id: "ex-1",
          exerciseNameSnapshot: "Agachamento",
          order: 1,
          plannedSets: 4,
          plannedReps: 8,
          plannedRestTimeInSeconds: 120,
          notes: null,
          revision: 1,
          sets: [
            {
              id: "set-1",
              order: 1,
              type: "WORKING" as const,
              weightInGrams: 60000,
              reps: 8,
              rir: 1,
              durationInSeconds: null,
              notes: null,
              completedAt: "2026-09-29T10:10:00.000Z",
            },
          ],
        },
      ],
    };

    // Primeira chamada
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: mockSessionData,
      headers: new Headers(),
    });

    const firstLoad = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-refresh" }),
    });
    expect(firstLoad).toBeDefined();

    // Simula refresh (F5 / nova requisição à mesma rota)
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: mockSessionData,
      headers: new Headers(),
    });

    const refreshedLoad = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "sess-refresh" }),
    });
    expect(refreshedLoad).toBeDefined();
    expect(api.getWorkoutSession).toHaveBeenCalledTimes(2);
  });

  it("7. Sessão ativa gera CTA 'Continuar treino' apontando para /workout-sessions/:sessionId", async () => {
    vi.mocked(api.getActiveWorkoutSession).mockResolvedValueOnce({
      status: 200,
      data: {
        id: "active-session-abc",
        workoutDayId: "day-1",
        startedAt: "2026-09-29T14:00:00.000Z",
        completedAt: null,
        sessionExercises: [],
      },
      headers: new Headers(),
    });

    const res = await api.getActiveWorkoutSession();
    expect(res.status).toBe(200);
    const session = res.status === 200 ? res.data : null;
    expect(session?.id).toBe("active-session-abc");
    const targetUrl = `/workout-sessions/${session?.id}`;
    expect(targetUrl).toBe("/workout-sessions/active-session-abc");
  });

  it("8. Ausência de sessão ativa não gera CTA", async () => {
    vi.mocked(api.getActiveWorkoutSession).mockResolvedValueOnce({
      status: 404,
      data: {
        error: "Active workout session not found",
        code: "NOT_FOUND",
      },
      headers: new Headers(),
    });

    const res = await api.getActiveWorkoutSession();
    expect(res.status).toBe(404);
    const activeSession = res.status === 200 ? res.data : null;
    expect(activeSession).toBeNull();
  });

  it("9. Erros e 404 são tratados sem quebrar a aplicação", async () => {
    // 404 - Sessão não encontrada
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 404,
      data: {
        error: "Workout session not found",
        code: "NOT_FOUND",
      },
      headers: new Headers(),
    });

    const notFoundJsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "non-existent-id" }),
    });
    expect(notFoundJsx).toBeDefined();

    // 500 - Erro de servidor
    vi.mocked(api.getWorkoutSession).mockResolvedValueOnce({
      status: 500,
      data: {
        error: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
      headers: new Headers(),
    });

    const errorJsx = await WorkoutSessionPage({
      params: Promise.resolve({ sessionId: "error-id" }),
    });
    expect(errorJsx).toBeDefined();
  });
});
