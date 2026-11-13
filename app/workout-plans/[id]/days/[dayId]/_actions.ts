"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeWorkoutSession,
  startWorkoutSession,
} from "@/app/_lib/api/fetch-generated";
import {
  workoutActionError,
  type WorkoutActionError,
} from "@/app/_lib/workout-action-error";

export async function startWorkoutAction(
  workoutPlanId: string,
  workoutDayId: string,
): Promise<WorkoutActionError> {
  let response;
  try {
    response = await startWorkoutSession(workoutPlanId, workoutDayId);
  } catch (error) {
    console.error("[startWorkoutAction] Falha na chamada à API", {
      workoutPlanId,
      workoutDayId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return workoutActionError(0);
  }
  if (response.status !== 201) {
    if (response.status >= 500)
      console.error("[startWorkoutAction] API não iniciou a sessão", {
        workoutPlanId,
        workoutDayId,
        status: response.status,
        code: response.data?.code,
      });
    return workoutActionError(response.status, response.data?.code);
  }

  const sessionId = response.data.userWorkoutSessionId;
  revalidatePath(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`);
  redirect(`/workout-sessions/${sessionId}`);
}

export async function completeWorkoutAction(
  workoutPlanId: string,
  workoutDayId: string,
  sessionId: string,
): Promise<WorkoutActionError> {
  let response;
  try {
    response = await completeWorkoutSession(sessionId, {});
  } catch {
    return workoutActionError(0);
  }
  if (response.status !== 200) {
    return workoutActionError(response.status, response.data?.code, "complete");
  }

  revalidatePath(`/workout-plans/${workoutPlanId}/days/${workoutDayId}`);
  revalidatePath("/");
  redirect(`/workout-sessions/${sessionId}/summary`);
}
