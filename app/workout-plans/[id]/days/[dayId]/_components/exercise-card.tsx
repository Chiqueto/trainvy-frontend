"use client";

import { useState } from "react";
import { CircleHelp, Info, Zap } from "lucide-react";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";

import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";
import type { GetWorkoutDay200ExercisesItem } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

interface ExerciseCardProps {
  exercise: GetWorkoutDay200ExercisesItem;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const handleHelp = () => {
    setChatParams({
      chat_open: true,
      chat_initial_message: `Como executar o exercício ${exercise.name} corretamente?`,
    });
  };

  const warmup = exercise.warmupSets ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-base font-semibold text-foreground">
            {exercise.name}
          </span>
          <button
            type="button"
            onClick={() => setIsMediaOpen(true)}
            title="Ver execução do exercício"
            aria-label={`Ver execução de ${exercise.name}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-heading font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
          >
            <Info className="size-3 text-primary" />
            <span>Ver execução</span>
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleHelp} title="Perguntar para IA">
          <CircleHelp className="size-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {warmup > 0 ? (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-heading text-xs font-semibold text-amber-700 dark:text-amber-400">
            {warmup} aquecimento • {exercise.sets} séries × {exercise.reps} reps
          </span>
        ) : (
          <>
            <span className="rounded-full bg-muted px-2.5 py-1 font-heading text-xs font-semibold uppercase text-muted-foreground">
              {exercise.sets} séries
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 font-heading text-xs font-semibold uppercase text-muted-foreground">
              {exercise.reps} reps
            </span>
          </>
        )}
        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-heading text-xs font-semibold uppercase text-muted-foreground">
          <Zap className="size-3.5" />
          {exercise.restTimeInSeconds}s
        </span>
      </div>

      <ExerciseExecutionDialog
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        exerciseId={exercise.exerciseId}
        exerciseName={exercise.name}
      />
    </div>
  );
}
