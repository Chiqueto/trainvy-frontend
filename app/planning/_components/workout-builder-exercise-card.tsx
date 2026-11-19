"use client";

import { useId, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import { CatalogExercisePicker } from "@/app/planning/_components/catalog-exercise-picker";
import { AdvancedPrescriptionFields } from "@/app/planning/_components/advanced-prescription-fields";
import type { WorkoutPlanDraftExercise } from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ExerciseThumbnail } from "@/app/_components/exercise-media/exercise-thumbnail";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { ClassicTacticalFields } from "./tactical/classic-tactical-fields";

export function WorkoutBuilderExerciseCard({
  exercise,
  catalogEntry,
  disabled,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  onApplyDose,
}: {
  exercise: WorkoutPlanDraftExercise;
  catalogEntry?: ListExercises200Item;
  disabled?: boolean;
  index: number;
  count: number;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onApplyDose: () => void;
}) {
  const detailsId = useId();
  const [expanded, setExpanded] = useState(false);
  const alternatives =
    Number(Boolean(exercise.alternative1Name)) +
    Number(Boolean(exercise.alternative2Name));
  return (
    <article
      aria-label={`Exercício ${index + 1}: ${exercise.name}`}
      className="min-w-0"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl py-3 text-left focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ExerciseThumbnail
          key={exercise.exerciseId ?? exercise.name}
          exerciseId={exercise.exerciseId}
          name={exercise.name}
          catalogEntry={catalogEntry}
          eager={index < 3}
        />
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold sm:text-base">
            {exercise.name || "Selecionar exercício"}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
            {exercise.sets} {exercise.sets === 1 ? "série" : "séries"} ·{" "}
            {exercise.repsMin != null && exercise.repsMax != null
              ? `${exercise.repsMin}–${exercise.repsMax}`
              : exercise.reps}{" "}
            reps · {exercise.restTimeInSeconds}s de descanso
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`mr-1 size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div
          id={detailsId}
          className="mb-3 space-y-4 rounded-xl border bg-background/60 p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 basis-40">
              <CatalogExercisePicker
                disabled={disabled}
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
              {!exercise.exerciseId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecione no catálogo para vincular este exercício.
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl"
                aria-label={`Subir exercício ${index + 1}`}
                disabled={disabled || index === 0}
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
                disabled={disabled || index === count - 1}
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
          <ClassicTacticalFields
            value={exercise}
            disabled={disabled}
            onChange={onChange}
          />
          <AdvancedPrescriptionFields
            value={exercise}
            disabled={disabled}
            onChange={onChange}
          />
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
                disabled={disabled}
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
                disabled={disabled}
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
        </div>
      )}
    </article>
  );
}
