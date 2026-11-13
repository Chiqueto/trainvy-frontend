"use client";

import { useState, useTransition } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = () => {
    if (isPending) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await startWorkoutAction(workoutPlanId, workoutDayId);
      if (result?.error) setErrorMessage(result.error);
    });
  };

  return (
    <div className="flex max-w-64 flex-col items-end gap-2">
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
      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg bg-background/95 p-2 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
