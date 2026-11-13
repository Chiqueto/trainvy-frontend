"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeWorkoutSession,
  startWorkoutSession,
} from "@/app/_lib/api/fetch-generated";

export async function startWorkoutAction(
  workoutPlanId: string,
  workoutDayId: string,
) {
  let response;
  try {
    response = await startWorkoutSession(workoutPlanId, workoutDayId);
  } catch (error) {
    console.error("[startWorkoutAction] Falha na chamada à API", {
      workoutPlanId,
      workoutDayId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "Não foi possível conectar ao servidor. Tente novamente." };
  }
  if (response.status === 401) redirect("/auth");
  if (response.status !== 201) {
    if (response.status === 409) {
      return {
        error:
          "Já existe um treino em andamento. Continue ou encerre esse treino na tela inicial antes de iniciar outro.",
      };
    }
    if (response.status === 404) {
      return {
        error: "Treino não encontrado. Atualize a página e tente novamente.",
      };
    }
    if (response.status === 422) {
      return {
        error:
          "Este plano não está disponível para iniciar. Verifique se ele está ativo e aprovado no planejamento.",
      };
    }
    console.error("[startWorkoutAction] API não iniciou a sessão", {
      workoutPlanId,
      workoutDayId,
      status: response.status,
      code: response.data?.code,
    });
    return {
      error: "Não foi possível iniciar o treino. Tente novamente em instantes.",
    };
  }

  const sessionId = response.data.userWorkoutSessionId;
  revalidatePath(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`);
  redirect(`/workout-sessions/${sessionId}`);
}

export async function completeWorkoutAction(
  workoutPlanId: string,
  workoutDayId: string,
  sessionId: string,
) {
  const response = await completeWorkoutSession(sessionId, {});
  if (response.status !== 200) {
    const errorData = response.data as { error?: string };
    throw new Error(errorData?.error || "Erro ao finalizar treino");
  }

  revalidatePath(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`);
  revalidatePath("/");
  redirect(`/workout-sessions/${sessionId}/summary`);
}
