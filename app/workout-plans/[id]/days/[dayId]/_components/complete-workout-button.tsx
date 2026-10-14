"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeWorkoutAction } from "../_actions";

interface CompleteWorkoutButtonProps {
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
}

export function CompleteWorkoutButton({
  workoutPlanId,
  workoutDayId,
  sessionId,
}: CompleteWorkoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await completeWorkoutAction(workoutPlanId, workoutDayId, sessionId);
      } catch (err: unknown) {
        setError((err as Error)?.message || "Não foi possível finalizar o treino");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        variant="outline"
        onClick={handleComplete}
        disabled={isPending}
        className="w-full rounded-full py-3 font-heading text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Finalizando...
          </span>
        ) : (
          "Finalizar treino diretamente"
        )}
      </Button>
    </div>
  );
}
