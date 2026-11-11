"use client";

import { useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startWorkoutAction } from "../_actions";

interface StartWorkoutButtonProps {
  workoutPlanId: string;
  workoutDayId: string;
}

export function StartWorkoutButton({
  workoutPlanId,
  workoutDayId,
}: StartWorkoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      await startWorkoutAction(workoutPlanId, workoutDayId);
    });
  };

  return (
    <Button
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
