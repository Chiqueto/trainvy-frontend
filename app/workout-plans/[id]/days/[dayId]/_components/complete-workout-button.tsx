"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeWorkoutAction } from "../_actions";
import { runWorkoutAction } from "@/app/_lib/show-workout-action-error";

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
  const router = useRouter();

  const handleComplete = () => {
    if (isPending) return;
    startTransition(async () => {
      await runWorkoutAction(
        () => completeWorkoutAction(workoutPlanId, workoutDayId, sessionId),
        router.push,
      );
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
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
