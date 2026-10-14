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
  const response = await startWorkoutSession(workoutPlanId, workoutDayId);
  if (response.status !== 201) {
    const errorData = response.data as { error?: string };
    throw new Error(errorData?.error || "Erro ao iniciar treino");
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
  const response = await completeWorkoutSession(sessionId);
  if (response.status !== 200) {
    const errorData = response.data as { error?: string };
    throw new Error(errorData?.error || "Erro ao finalizar treino");
  }

  revalidatePath(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`);
  revalidatePath("/");
  redirect(`/workout-sessions/${sessionId}/summary`);
}

