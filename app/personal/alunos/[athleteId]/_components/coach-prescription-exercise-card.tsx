"use client";

import { ArrowDown, ArrowUp, Check, Copy, Trash2 } from "lucide-react";
import { CatalogExercisePicker } from "@/app/planning/_components/catalog-exercise-picker";
import { AdvancedPrescriptionFields } from "@/app/planning/_components/advanced-prescription-fields";
import type { WorkoutPlanDraftExercise } from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CoachPrescriptionExerciseCard({
  exercise,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  onApplyDose,
}: {
  exercise: WorkoutPlanDraftExercise;
  index: number;
  count: number;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onApplyDose: () => void;
}) {
  const alternatives =
    Number(Boolean(exercise.alternative1Name)) +
    Number(Boolean(exercise.alternative2Name));
  return (
    <article
      aria-label={`Exercício ${index + 1}: ${exercise.name || "Selecionar"}`}
      className="min-w-0 space-y-4 rounded-2xl border border-border bg-background/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1 basis-44 space-y-1.5">
          <CatalogExercisePicker
            label="Exercício principal"
            name={exercise.name}
            excludeIds={[
              exercise.alternative1ExerciseId,
              exercise.alternative2ExerciseId,
            ].filter((id): id is string => Boolean(id))}
            onSelect={(selected) => {
              if (selected)
                onChange({ exerciseId: selected.id, name: selected.name });
            }}
          />
          <p
            className={`flex items-center gap-1 text-[11px] ${exercise.exerciseId ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`}
          >
            {exercise.exerciseId ? (
              <>
                <Check className="size-3" /> Vinculado à biblioteca
              </>
            ) : (
              "Selecione no catálogo para vincular este exercício."
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:mt-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl"
            aria-label={`Subir exercício ${index + 1}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl"
            aria-label={`Descer exercício ${index + 1}`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl text-muted-foreground hover:text-destructive"
            aria-label={`Remover exercício ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { key: "warmupSets", label: "Séries de aquecimento", min: 0 },
            { key: "sets", label: "Séries de trabalho", min: 1 },
            { key: "reps", label: "Repetições", min: 1 },
            { key: "restTimeInSeconds", label: "Descanso (s)", min: 1 },
          ] as const
        ).map((field) => (
          <label
            key={field.key}
            className="flex min-w-0 flex-col justify-between gap-2 text-xs text-muted-foreground"
          >
            {field.label}
            <Input
              type="number"
              inputMode="numeric"
              min={field.min}
              step={1}
              value={exercise[field.key] ?? 0}
              onChange={(event) =>
                onChange({ [field.key]: Number(event.target.value) })
              }
              className="h-11 rounded-xl font-mono text-sm text-foreground"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {exercise.sets} séries ×{" "}
          {exercise.repsMin && exercise.repsMax
            ? `${exercise.repsMin}–${exercise.repsMax}`
            : exercise.reps}{" "}
          reps · {exercise.restTimeInSeconds}s de descanso
        </p>
        {count > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto min-h-9 whitespace-normal text-xs text-primary"
            onClick={onApplyDose}
          >
            <Copy className="size-3.5" />
            Aplicar séries, reps e descanso aos demais
          </Button>
        )}
      </div>
      <AdvancedPrescriptionFields value={exercise} onChange={onChange} />
      <details className="rounded-xl border border-border/70 px-3 py-2">
        <summary className="cursor-pointer py-1 text-xs font-semibold text-primary">
          Alternativas do exercício{" "}
          {alternatives ? `(${alternatives}/2)` : "(opcional)"}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Defina até duas opções para quando este exercício precisar ser
          substituído.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <CatalogExercisePicker
            label="Alternativa 1"
            optional
            name={exercise.alternative1Name}
            relatedExerciseId={exercise.exerciseId}
            excludeIds={[
              exercise.exerciseId,
              exercise.alternative2ExerciseId,
            ].filter((id): id is string => Boolean(id))}
            onSelect={(selected) =>
              onChange({
                alternative1ExerciseId: selected?.id ?? null,
                alternative1Name: selected?.name ?? "",
              })
            }
          />
          <CatalogExercisePicker
            label="Alternativa 2"
            optional
            name={exercise.alternative2Name}
            relatedExerciseId={exercise.exerciseId}
            excludeIds={[
              exercise.exerciseId,
              exercise.alternative1ExerciseId,
            ].filter((id): id is string => Boolean(id))}
            onSelect={(selected) =>
              onChange({
                alternative2ExerciseId: selected?.id ?? null,
                alternative2Name: selected?.name ?? "",
              })
            }
          />
        </div>
      </details>
    </article>
  );
}
