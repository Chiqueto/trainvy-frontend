"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startWorkoutAction } from "../_actions";
import { runWorkoutAction } from "@/app/_lib/show-workout-action-error";

interface StartWorkoutButtonProps {
  workoutPlanId: string;
  workoutDayId: string;
}

export function StartWorkoutButton({
  workoutPlanId,
  workoutDayId,
}: StartWorkoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStart = () => {
    if (isPending) return;
    startTransition(async () => {
      await runWorkoutAction(
        () => startWorkoutAction(workoutPlanId, workoutDayId),
        router.push,
      );
    });
  };

  return (
    <Button
      type="button"
      onClick={handleStart}
      disabled={isPending}
      className="rounded-full px-4 py-2 font-heading text-sm font-semibold gap-1.5"
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Iniciando...</span>
        </>
      ) : (
        <>
          <Play className="size-3.5 fill-current" />
          <span>Iniciar Treino</span>
        </>
      )}
    </Button>
  );
}
