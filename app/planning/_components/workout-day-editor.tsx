"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import { editWorkoutDayAction } from "../_actions";
import {
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
  type WorkoutPlanDraftDay,
} from "../_lib/workout-plan-builder";
import { WorkoutCardsWorkspace } from "./workout-cards-workspace";
import { TacticalPlanWorkspace } from "./tactical/tactical-plan-workspace";
import { useBuilderMode, ViewModeToggle } from "./tactical/view-mode-toggle";

export function WorkoutDayEditor({
  planId,
  dayId,
  initialDay,
}: {
  planId: string;
  dayId: string;
  initialDay: WorkoutPlanDraftDay;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { builderMode, changeMode, syncError } = useBuilderMode();
  const backHref = `/workout-plans/${planId}/days/${dayId}`;
  const [day, setDay] = useState(initialDay);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function save() {
    if (pending) return;
    const validationError = validateWorkoutPlanDraft("Treino", [day]);
    setError(validationError ?? undefined);
    if (validationError) return;

    const [workoutDay] = serializeWorkoutDays([day]);
    startTransition(async () => {
      try {
        const result = await editWorkoutDayAction(planId, dayId, {
          ...workoutDay,
          coverImageUrl: undefined,
          isRest: false,
        });
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.replace(backHref);
        router.refresh();
      } catch {
        setError("Não foi possível salvar o treino. Tente novamente.");
      }
    });
  }

  if (builderMode === "tactical") {
    return (
      <TacticalPlanWorkspace
        singleDay
        days={[day]}
        onChange={([next]) => setDay(next)}
        planName={day.name}
        backHref={backHref}
        onClassic={() => changeMode("classic")}
        onSave={save}
        saveLabel="Salvar treino"
        disabled={!hydrated || pending}
        error={error}
        syncError={syncError}
      />
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-background py-2">
        <ViewModeToggle
          value={builderMode}
          onChange={changeMode}
          syncError={syncError}
          backHref={backHref}
        />
      </div>
      <WorkoutCardsWorkspace
        days={[day]}
        onChange={([next]) => setDay(next)}
        disabled={!hydrated || pending}
      />
      <div className="sticky bottom-4 z-20 space-y-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur-md">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          onClick={save}
          disabled={!hydrated || pending}
          className="h-12 w-full rounded-full"
        >
          {pending && <LoaderCircle className="animate-spin" />}
          {pending ? "Salvando..." : "Salvar treino"}
        </Button>
      </div>
    </>
  );
}
