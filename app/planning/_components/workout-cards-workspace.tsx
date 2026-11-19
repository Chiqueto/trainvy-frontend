"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { normalizeSearchTerm } from "@/app/_lib/exercise-catalog-cache";
import { useHydrated } from "@/lib/use-hydrated";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { patchExercise, telemetry } from "../_lib/tactical";
import {
  createDraftExercise,
  createDraftWorkoutDay,
  duplicateDraftWorkoutDay,
  WEEK_DAYS,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "../_lib/workout-plan-builder";
import { CatalogExerciseBatchPicker } from "./catalog-exercise-picker";
import { WorkoutBuilderExerciseCard } from "./workout-builder-exercise-card";
import { TrainingBioDetails } from "./tactical/training-bio-panel";

const EMPTY_CATALOG: ListExercises200Item[] = [];
const EMPTY_EXERCISES: WorkoutPlanDraftExercise[] = [];

export function WorkoutCardsWorkspace({
  days,
  onChange,
  activeIndex = 0,
  onActiveChange,
  disabled,
}: {
  days: WorkoutPlanDraftDay[];
  onChange: (days: WorkoutPlanDraftDay[]) => void;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  disabled?: boolean;
}) {
  const hydrated = useHydrated();
  const { exercises: cachedCatalog } = useExerciseCatalog();
  const catalog = hydrated ? cachedCatalog : EMPTY_CATALOG;
  const catalogIndex = useMemo(() => {
    const byId = new Map<string, ListExercises200Item>();
    const byName = new Map<string, ListExercises200Item | null>();
    for (const entry of catalog) {
      byId.set(entry.id, entry);
      const name = normalizeSearchTerm(entry.name);
      byName.set(name, byName.has(name) ? null : entry);
    }
    return { byId, byName };
  }, [catalog]);
  const index = Math.min(activeIndex, Math.max(0, days.length - 1));
  const day = days[index];
  const exercises = day?.exercises ?? EMPTY_EXERCISES;
  const analysis = useMemo(
    () => telemetry(exercises, catalog),
    [exercises, catalog],
  );

  function updateDay(patch: Partial<WorkoutPlanDraftDay>) {
    onChange(
      days.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-4">
      {onActiveChange && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold">
              Divisão de treinos
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = createDraftWorkoutDay(
                    String.fromCharCode(65 + (days.length % 26)),
                  );
                  onChange([
                    ...days,
                    {
                      ...next,
                      exercises: [],
                      weekDay: WEEK_DAYS[days.length % 7].value,
                    },
                  ]);
                  onActiveChange(days.length);
                }}
              >
                <Plus className="size-4 text-primary" />
                Adicionar treino
              </Button>
            </div>
          </div>

          <nav
            aria-label="Selecionar treino para editar"
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {days.map((entry, position) => (
              <button
                key={entry.clientId ?? entry.id ?? position}
                type="button"
                aria-pressed={position === index}
                onClick={() => onActiveChange(position)}
                className="flex min-h-14 max-w-60 shrink-0 items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary/50 aria-pressed:bg-primary/10"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
                >
                  {String.fromCharCode(65 + (position % 26))}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">
                  {entry.name || "Treino sem nome"}
                </span>
              </button>
            ))}
          </nav>
        </>
      )}

      {day && (
        <div
          key={day.clientId ?? day.id ?? index}
          className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,21rem)]"
        >
          <section className="min-w-0 rounded-2xl border bg-card shadow-xs">
            <header className="space-y-4 border-b px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label className="min-w-40 flex-1 basis-full space-y-1 text-xs sm:basis-40 font-medium text-muted-foreground">
                  Nome do treino
                  <Input
                    value={day.name}
                    onChange={(event) =>
                      updateDay({ name: event.target.value })
                    }
                    className="h-10 text-sm font-semibold text-foreground"
                  />
                </label>
                {onActiveChange && (
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Duplicar ${day.name}`}
                      title="Duplicar treino"
                      onClick={() => {
                        const copy = duplicateDraftWorkoutDay(day);
                        onChange([
                          ...days.slice(0, index + 1),
                          copy,
                          ...days.slice(index + 1),
                        ]);
                        onActiveChange(index + 1);
                      }}
                    >
                      <Copy />
                    </Button>
                    {([-1, 1] as const).map((offset) => {
                      const to = index + offset;
                      return (
                        <Button
                          key={offset}
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            offset < 0
                              ? "Mover treino para cima"
                              : "Mover treino para baixo"
                          }
                          disabled={!days[to]}
                          onClick={() => {
                            const reordered = [...days];
                            [reordered[index], reordered[to]] = [
                              reordered[to],
                              reordered[index],
                            ];
                            onChange(reordered);
                            onActiveChange(to);
                          }}
                        >
                          {offset < 0 ? <ArrowUp /> : <ArrowDown />}
                        </Button>
                      );
                    })}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir dia"
                      title="Excluir treino"
                      disabled={days.length <= 1}
                      className="text-destructive"
                      onClick={() => {
                        onChange(
                          days.filter((_, position) => position !== index),
                        );
                        onActiveChange(Math.max(0, index - 1));
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Dia de referência
                  <select
                    value={day.weekDay ?? WEEK_DAYS[index % 7].value}
                    onChange={(event) =>
                      updateDay({
                        weekDay: event.target
                          .value as WorkoutPlanDraftDay["weekDay"],
                      })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  >
                    {WEEK_DAYS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-muted-foreground">
                  Duração estimada (min)
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={day.estimatedDurationInMinutes}
                    onChange={(event) =>
                      updateDay({
                        estimatedDurationInMinutes: Number(event.target.value),
                      })
                    }
                    className="text-foreground"
                  />
                </label>
              </div>
            </header>

            <div className="space-y-3 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-sm font-bold">
                  Sequência do treino
                </h3>
                <CatalogExerciseBatchPicker
                  disabled={disabled}
                  excludeIds={exercises.flatMap((item) =>
                    item.exerciseId ? [item.exerciseId] : [],
                  )}
                  onSelect={(selected) =>
                    updateDay({
                      exercises: [
                        ...exercises,
                        ...selected.map((entry) => ({
                          ...createDraftExercise(),
                          exerciseId: entry.id,
                          name: entry.name,
                        })),
                      ],
                    })
                  }
                />
              </div>
              {exercises.length ? (
                <div className="divide-y divide-border">
                  {exercises.map((exercise, position) => (
                    <WorkoutBuilderExerciseCard
                      key={exercise.id ?? position}
                      exercise={exercise}
                      catalogEntry={
                        exercise.exerciseId
                          ? catalogIndex.byId.get(exercise.exerciseId)
                          : (catalogIndex.byName.get(
                              normalizeSearchTerm(exercise.name),
                            ) ?? undefined)
                      }
                      index={position}
                      count={exercises.length}
                      disabled={disabled}
                      onChange={(patch) =>
                        updateDay({
                          exercises: exercises.map((item, i) =>
                            i === position ? patchExercise(item, patch) : item,
                          ),
                        })
                      }
                      onMove={(offset) => {
                        const target = position + offset;
                        const reordered = [...exercises];
                        [reordered[position], reordered[target]] = [
                          reordered[target],
                          reordered[position],
                        ];
                        updateDay({ exercises: reordered });
                      }}
                      onRemove={() =>
                        updateDay({
                          exercises: exercises.filter((_, i) => i !== position),
                        })
                      }
                      onApplyDose={() => {
                        updateDay({
                          exercises: exercises.map((item, i) =>
                            i === position
                              ? item
                              : patchExercise(item, {
                                  sets: exercise.sets,
                                  reps: exercise.reps,
                                  repsMin: exercise.repsMin ?? null,
                                  repsMax: exercise.repsMax ?? null,
                                  restTimeInSeconds: exercise.restTimeInSeconds,
                                }),
                          ),
                        });
                        toast.success(
                          "Séries, repetições e descanso aplicados neste treino.",
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Adicione exercícios da biblioteca para montar a sequência.
                </p>
              )}
            </div>
          </section>

          <aside aria-label="Resumo do treino" className="min-w-0 space-y-3">
            <section className="rounded-2xl border bg-card p-4 shadow-xs">
              <h3 className="font-heading text-sm font-bold">
                Resumo do treino
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Exercícios",
                    value: analysis.neuralBreakdown.sources.length,
                  },
                  { label: "Séries de trabalho", value: analysis.sets },
                  {
                    label: "Duração estimada",
                    value: `${day.estimatedDurationInMinutes || 0} min`,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col justify-between gap-1"
                  >
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-heading text-base font-semibold tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              aria-label="Análise do treino"
              className="dark rounded-2xl border border-white/10 bg-slate-950 p-3 text-slate-100"
            >
              <TrainingBioDetails data={analysis} inline />
            </section>
          </aside>
        </div>
      )}
    </fieldset>
  );
}
