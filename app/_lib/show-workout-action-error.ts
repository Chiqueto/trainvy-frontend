"use client";

import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import {
  workoutActionError,
  type WorkoutActionError,
} from "./workout-action-error";

export async function runWorkoutAction(
  action: () => Promise<WorkoutActionError>,
  navigate: (href: string) => void,
) {
  let failure: WorkoutActionError;
  try {
    failure = await action();
  } catch (error) {
    unstable_rethrow(error);
    failure = workoutActionError(0);
  }
  toast.error(failure.title, {
    id: "workout-action-error",
    description: failure.error,
    duration: 8000,
    closeButton: true,
    action: failure.action
      ? {
          label: failure.action.label,
          onClick: () => navigate(failure.action!.href),
        }
      : undefined,
  });
}
