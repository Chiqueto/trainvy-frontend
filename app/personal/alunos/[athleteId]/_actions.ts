"use server";

import {
  getCoachAthleteProgressOverview,
  listCoachAthleteProgressSessions,
  getCoachAthleteProgressSessionDetail,
  listCoachAthleteProgressExercises,
  getCoachAthleteProgressExerciseEvolution,
  getCoachAthleteProgressInsights,
  type GetCoachAthleteProgressOverview200,
  type ListCoachAthleteProgressSessions200,
  type GetCoachAthleteProgressSessionDetail200,
  type ListCoachAthleteProgressExercises200Item,
  type GetCoachAthleteProgressExerciseEvolution200,
  type GetCoachAthleteProgressInsights200,
} from "@/app/_lib/api/fetch-generated";

export type EvolutionRange = 4 | 8 | 12;

export type ActionResult<T> =
  | { success: true; status: 200; data: T }
  | { success: false; status: number; code?: string; error: string };

export async function fetchCoachAthleteProgressOverviewAction(input: {
  athleteId: string;
  weeksCount: number;
  tz?: string;
}): Promise<ActionResult<GetCoachAthleteProgressOverview200>> {
  try {
    const res = await getCoachAthleteProgressOverview(
      input.athleteId,
      {
        weeksCount: input.weeksCount,
        tz: input.tz,
      },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ??
        "Não foi possível carregar a evolução do aluno.",
    };
  } catch (error) {
    console.error("fetchCoachAthleteProgressOverviewAction error:", error);
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function fetchCoachAthleteProgressSessionsAction(input: {
  athleteId: string;
  cursor?: string;
  limit?: number;
  origin?: "PLANNED" | "FREE";
}): Promise<ActionResult<ListCoachAthleteProgressSessions200>> {
  try {
    const res = await listCoachAthleteProgressSessions(
      input.athleteId,
      {
        cursor: input.cursor,
        limit: input.limit ?? 10,
        origin: input.origin,
      },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ??
        "Não foi possível listar as sessões de treino.",
    };
  } catch (error) {
    console.error("fetchCoachAthleteProgressSessionsAction error:", error);
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function fetchCoachAthleteProgressSessionDetailAction(input: {
  athleteId: string;
  sessionId: string;
}): Promise<ActionResult<GetCoachAthleteProgressSessionDetail200>> {
  try {
    const res = await getCoachAthleteProgressSessionDetail(
      input.athleteId,
      input.sessionId,
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ??
        "Não foi possível carregar o detalhe da sessão.",
    };
  } catch (error) {
    console.error("fetchCoachAthleteProgressSessionDetailAction error:", error);
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function fetchCoachAthleteProgressExercisesAction(input: {
  athleteId: string;
  q?: string;
}): Promise<ActionResult<ListCoachAthleteProgressExercises200Item[]>> {
  try {
    const res = await listCoachAthleteProgressExercises(
      input.athleteId,
      {
        q: input.q,
        onlyWithHistory: "true",
      },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ?? "Não foi possível listar os exercícios.",
    };
  } catch (error) {
    console.error("fetchCoachAthleteProgressExercisesAction error:", error);
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function fetchCoachAthleteProgressExerciseEvolutionAction(input: {
  athleteId: string;
  exerciseId: string;
  cursor?: string;
  limit?: number;
}): Promise<ActionResult<GetCoachAthleteProgressExerciseEvolution200>> {
  try {
    const res = await getCoachAthleteProgressExerciseEvolution(
      input.athleteId,
      input.exerciseId,
      {
        cursor: input.cursor,
        limit: input.limit ?? 10,
      },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ??
        "Não foi possível carregar a evolução do exercício.",
    };
  } catch (error) {
    console.error(
      "fetchCoachAthleteProgressExerciseEvolutionAction error:",
      error,
    );
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function fetchCoachAthleteProgressInsightsAction(input: {
  athleteId: string;
  weeksCount?: number;
  tz?: string;
}): Promise<ActionResult<GetCoachAthleteProgressInsights200>> {
  try {
    const res = await getCoachAthleteProgressInsights(
      input.athleteId,
      {
        weeksCount: input.weeksCount ?? 4,
        tz: input.tz,
      },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      return { success: true, status: 200, data: res.data };
    }

    const errorPayload = res.data as { code?: string; error?: string } | null;
    return {
      success: false,
      status: res.status,
      code: errorPayload?.code,
      error:
        errorPayload?.error ??
        "Não foi possível gerar os insights de evolução do aluno.",
    };
  } catch (error) {
    console.error("fetchCoachAthleteProgressInsightsAction error:", error);
    return {
      success: false,
      status: 500,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

