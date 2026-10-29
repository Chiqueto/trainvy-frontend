"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Dumbbell,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  createStandaloneWorkoutPlanAction,
  createWorkoutPlanInPeriodizationAction,
  editWorkoutPlanAction,
} from "@/app/planning/_actions";
import {
  createDraftExercise,
  createDraftWorkoutDay,
  createInitialWorkoutDays,
  deserializeWorkoutDays,
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AthleteAiWorkoutPlanModal } from "./athlete-ai-workout-plan-modal";
import { AdvancedPrescriptionFields } from "./advanced-prescription-fields";
import { CatalogExercisePicker } from "./catalog-exercise-picker";
import type { GetEditableWorkoutPlan200 } from "@/app/_lib/api/fetch-generated";

interface WorkoutPlanBuilderProps {
  mode: "standalone" | "periodization" | "edit";
  initialPlan?: GetEditableWorkoutPlan200;
  periodizationId?: string;
  initialOpenAi?: boolean;
  defaultExpandedAll?: boolean;
}

export function WorkoutPlanBuilder({
  mode,
  periodizationId,
  initialOpenAi = false,
  initialPlan,
  defaultExpandedAll = false,
}: WorkoutPlanBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPlan?.name ?? "");
  const [activate, setActivate] = useState(false);
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(() =>
    initialPlan
      ? deserializeWorkoutDays(initialPlan)
      : createInitialWorkoutDays(),
  );
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(() => {
    if (defaultExpandedAll) {
      return new Set(days.map((d, i) => d.clientId ?? d.id ?? String(i)));
    }
    return new Set<string>();
  });
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [isAiModalOpen, setIsAiModalOpen] = useState(initialOpenAi);

  function toggleDayExpand(dayKey: string) {
    setExpandedDayIds((current) => {
      const next = new Set(current);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  }

  const allExpanded =
    days.length > 0 &&
    days.every((d, i) => expandedDayIds.has(d.clientId ?? d.id ?? String(i)));

  function toggleExpandAll() {
    if (allExpanded) {
      setExpandedDayIds(new Set());
    } else {
      setExpandedDayIds(
        new Set(days.map((d, i) => d.clientId ?? d.id ?? String(i))),
      );
    }
  }

  function updateDay(index: number, patch: Partial<WorkoutPlanDraftDay>) {
    setDays((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index ? { ...day, ...patch } : day,
      ),
    );
  }

  function addWorkout() {
    const nextLetter = String.fromCharCode(65 + (days.length % 26));
    const newDay = createDraftWorkoutDay(nextLetter);
    setDays((current) => [...current, newDay]);
    const key = newDay.clientId ?? newDay.id ?? String(days.length);
    setExpandedDayIds((current) => new Set(current).add(key));
  }

  function removeWorkout(index: number) {
    if (days.length <= 1) return;
    const removedDay = days[index];
    const key = removedDay.clientId ?? removedDay.id ?? String(index);
    setDays((current) => current.filter((_, i) => i !== index));
    setExpandedDayIds((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function moveWorkout(index: number, offset: -1 | 1) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= days.length) return;
    setDays((current) => {
      const copy = [...current];
      [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];
      return copy;
    });
  }

  function updateExercise(
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<WorkoutPlanDraftExercise>,
  ) {
    updateDay(dayIndex, {
      exercises: days[dayIndex].exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, ...patch } : exercise,
      ),
    });
  }

  function moveExercise(
    dayIndex: number,
    exerciseIndex: number,
    offset: -1 | 1,
  ) {
    const targetIndex = exerciseIndex + offset;
    if (targetIndex < 0 || targetIndex >= days[dayIndex].exercises.length)
      return;
    const exercises = [...days[dayIndex].exercises];
    [exercises[exerciseIndex], exercises[targetIndex]] = [
      exercises[targetIndex],
      exercises[exerciseIndex],
    ];
    updateDay(dayIndex, { exercises });
  }

  function submit() {
    const validationError = validateWorkoutPlanDraft(
      name,
      days,
      mode === "periodization" ? plannedStartDate : undefined,
      mode === "periodization" ? plannedEndDate : undefined,
    );
    if (validationError) {
      setError(validationError);
      const dayIndexWithErr = days.findIndex(
        (d, idx) =>
          validationError.includes(d.name.trim()) ||
          validationError.includes(`Treino ${idx + 1}`),
      );
      if (dayIndexWithErr >= 0) {
        const key =
          days[dayIndexWithErr].clientId ??
          days[dayIndexWithErr].id ??
          String(dayIndexWithErr);
        setExpandedDayIds((current) => new Set(current).add(key));
      }
      return;
    }
    if (mode === "periodization" && !periodizationId) {
      setError("Periodização inválida.");
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const workoutDays = serializeWorkoutDays(days);
      const result =
        mode === "edit" && initialPlan
          ? await editWorkoutPlanAction(initialPlan.id, {
              name: name.trim(),
              workoutDays,
            })
          : mode === "standalone"
            ? await createStandaloneWorkoutPlanAction({
                name: name.trim(),
                workoutDays,
                activate,
              })
            : await createWorkoutPlanInPeriodizationAction(periodizationId!, {
                name: name.trim(),
                workoutDays,
                plannedStartDate: plannedStartDate || null,
                plannedEndDate: plannedEndDate || null,
                notes: notes.trim() || null,
              });

      if (!result.success) {
        setError(result.error);
        return;
      }

      const destination =
        mode === "edit" && initialPlan
          ? `/workout-plans/${initialPlan.id}`
          : mode === "standalone"
            ? "/planning"
            : `/planning/periodizations/${periodizationId}`;
      router.push(destination);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de Geração com IA / Importação de Ficha */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h4 className="font-heading text-xs font-bold text-foreground">
              Organize seus exercícios ou importe sua ficha com IA
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Fale por voz ou anexe o PDF/foto da sua ficha antiga da academia
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsAiModalOpen(true)}
          className="h-8 px-3 rounded-xl font-heading text-xs font-bold gap-1.5 shadow-sm"
        >
          <Sparkles className="size-3.5" />
          <span>Gerar com IA</span>
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome do plano *
          <Input
            value={name}
            maxLength={120}
            placeholder="Ex.: Upper / Lower"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        {mode === "standalone" ? (
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={activate}
              onChange={(event) => setActivate(event.target.checked)}
              className="size-5 accent-primary"
            />
            Tornar este meu plano atual
          </label>
        ) : mode === "periodization" ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Início previsto
                <Input
                  type="date"
                  value={plannedStartDate}
                  onChange={(event) => setPlannedStartDate(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Fim previsto
                <Input
                  type="date"
                  value={plannedEndDate}
                  onChange={(event) => setPlannedEndDate(event.target.value)}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Notas da etapa
              <textarea
                value={notes}
                rows={3}
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </label>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            As alterações valem para os próximos treinos. As sessões já
            registradas serão preservadas.
          </p>
        )}
      </section>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="workout-days-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id="workout-days-title"
              className="font-heading text-base font-semibold"
            >
              Divisão de Treinos (Rotina Sequencial)
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure os treinos da sua divisão. O próximo treino será
              sugerido automaticamente com base no último realizado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {days.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleExpandAll}
                className="gap-1.5 rounded-full font-heading text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronsUpDown className="size-3.5" />
                <span>{allExpanded ? "Recolher todos" : "Expandir todos"}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="gap-1.5 rounded-full font-heading text-xs text-primary border-primary/30 hover:bg-primary/10"
            >
              <Sparkles className="size-3.5" />
              <span>Gerar com IA</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWorkout}
              disabled={isPending}
              className="gap-1.5 rounded-full font-heading text-xs"
            >
              <Plus className="size-3.5" />
              Adicionar Treino
            </Button>
          </div>
        </div>

        {days.map((day, dayIndex) => {
          const dayKey = day.clientId ?? day.id ?? String(dayIndex);
          const isExpanded = expandedDayIds.has(dayKey);

          return (
            <article
              key={dayKey}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all shadow-xs"
            >
              <div
                className="flex items-center justify-between gap-2 cursor-pointer select-none"
                onClick={() => toggleDayExpand(dayKey)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDayExpand(dayKey);
                  }
                }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary">
                    {String.fromCharCode(65 + (dayIndex % 26))}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <h3 className="min-w-0 truncate font-heading text-sm font-semibold">
                      {day.name ||
                        `Treino ${String.fromCharCode(65 + (dayIndex % 26))}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {day.isRest ? (
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Dia de descanso
                        </span>
                      ) : (
                        <span>
                          {day.exercises.length}{" "}
                          {day.exercises.length === 1
                            ? "exercício"
                            : "exercícios"}{" "}
                          • {day.estimatedDurationInMinutes || 0} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex shrink-0 items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label={`Mover treino para cima`}
                    disabled={dayIndex === 0 || isPending}
                    onClick={() => moveWorkout(dayIndex, -1)}
                    className="flex size-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover treino para baixo`}
                    disabled={dayIndex === days.length - 1 || isPending}
                    onClick={() => moveWorkout(dayIndex, 1)}
                    className="flex size-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  {days.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remover treino`}
                      disabled={isPending}
                      onClick={() => removeWorkout(dayIndex)}
                      className="flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={
                      isExpanded ? "Recolher treino" : "Expandir treino"
                    }
                    aria-expanded={isExpanded}
                    onClick={() => toggleDayExpand(dayKey)}
                    className="flex size-8 items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col gap-4 pt-3 border-t border-border/40">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem]">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Nome do treino
                      <Input
                        value={day.name}
                        placeholder={`Ex: Treino ${String.fromCharCode(65 + (dayIndex % 26))} - Peito`}
                        onChange={(event) =>
                          updateDay(dayIndex, { name: event.target.value })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Duração (min)
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        disabled={day.isRest}
                        value={day.estimatedDurationInMinutes}
                        onChange={(event) =>
                          updateDay(dayIndex, {
                            estimatedDurationInMinutes: Number(
                              event.target.value,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={day.isRest}
                      disabled={isPending}
                      onChange={(event) =>
                        updateDay(dayIndex, {
                          isRest: event.target.checked,
                          estimatedDurationInMinutes: event.target.checked
                            ? 0
                            : day.estimatedDurationInMinutes || 60,
                        })
                      }
                    />
                    Dia de descanso
                  </label>

                  {!day.isRest && (
                    <div className="flex flex-col gap-3">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={`${day.weekDay}-${exerciseIndex}`}
                          className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-xs font-semibold">
                              <Dumbbell className="size-3.5 text-primary" />
                              Exercício {exerciseIndex + 1}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                aria-label={`Mover exercício ${exerciseIndex + 1} para cima`}
                                disabled={exerciseIndex === 0 || isPending}
                                onClick={() =>
                                  moveExercise(dayIndex, exerciseIndex, -1)
                                }
                                className="flex size-11 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30"
                              >
                                <ArrowUp className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Mover exercício ${exerciseIndex + 1} para baixo`}
                                disabled={
                                  exerciseIndex === day.exercises.length - 1 ||
                                  isPending
                                }
                                onClick={() =>
                                  moveExercise(dayIndex, exerciseIndex, 1)
                                }
                                className="flex size-11 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30"
                              >
                                <ArrowDown className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Remover exercício ${exerciseIndex + 1}`}
                                disabled={isPending}
                                onClick={() =>
                                  updateDay(dayIndex, {
                                    exercises: day.exercises.filter(
                                      (_, index) => index !== exerciseIndex,
                                    ),
                                  })
                                }
                                className="flex size-11 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>

                          <CatalogExercisePicker
                            label="Exercício"
                            name={exercise.name}
                            disabled={isPending}
                            onSelect={(selected) => {
                              if (selected)
                                updateExercise(dayIndex, exerciseIndex, {
                                  name: selected.name,
                                  exerciseId: selected.id,
                                });
                            }}
                          />
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            <label className="flex flex-col gap-1.5 text-xs font-medium">
                              Aquecimento
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={exercise.warmupSets ?? 0}
                                onChange={(event) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    warmupSets: Math.max(
                                      0,
                                      Number(event.target.value),
                                    ),
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1.5 text-xs font-medium">
                              Séries válidas
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={exercise.sets}
                                onChange={(event) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    sets: Number(event.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1.5 text-xs font-medium">
                              Repetições
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={exercise.reps}
                                onChange={(event) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    reps: Number(event.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1.5 text-xs font-medium">
                              Descanso (s)
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={exercise.restTimeInSeconds}
                                onChange={(event) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    restTimeInSeconds: Number(
                                      event.target.value,
                                    ),
                                  })
                                }
                              />
                            </label>
                          </div>

                          <AdvancedPrescriptionFields
                            value={exercise}
                            disabled={isPending}
                            onChange={(patch) =>
                              updateExercise(dayIndex, exerciseIndex, patch)
                            }
                          />
                          <div className="pt-2 border-t border-border/40">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Alternativas fixas (opcional)
                            </span>
                            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <CatalogExercisePicker
                                label="Alternativa 1"
                                name={exercise.alternative1Name}
                                optional
                                disabled={isPending}
                                onSelect={(selected) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    alternative1Name: selected?.name ?? "",
                                    alternative1ExerciseId:
                                      selected?.id ?? null,
                                  })
                                }
                              />
                              <CatalogExercisePicker
                                label="Alternativa 2"
                                name={exercise.alternative2Name}
                                optional
                                disabled={isPending}
                                onSelect={(selected) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    alternative2Name: selected?.name ?? "",
                                    alternative2ExerciseId:
                                      selected?.id ?? null,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <CatalogExercisePicker
                        label="Adicionar exercício"
                        disabled={isPending}
                        onSelect={(selected) => {
                          if (!selected) return;
                          updateDay(dayIndex, {
                            exercises: [
                              ...day.exercises,
                              {
                                ...createDraftExercise(),
                                name: selected.name,
                                exerciseId: selected.id,
                              },
                            ],
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addWorkout}
          disabled={isPending}
          className="mt-2 w-full gap-2 rounded-xl py-6 font-heading text-sm"
        >
          <Plus className="size-4" />
          Adicionar Mais um Treino na Rotina
        </Button>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        className="h-12 w-full rounded-full text-sm font-semibold"
        disabled={isPending}
        onClick={submit}
      >
        {isPending && <LoaderCircle className="animate-spin" />}
        {isPending
          ? mode === "edit"
            ? "Salvando..."
            : "Criando..."
          : mode === "edit"
            ? "Salvar alterações"
            : mode === "standalone"
              ? "Criar plano"
              : "Criar plano e adicionar etapa"}
      </Button>

      <AthleteAiWorkoutPlanModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyPlan={(data) => {
          if (data.name) setName(data.name);
          if (data.notes) setNotes(data.notes);
          if (data.workoutDays?.length) {
            setDays(data.workoutDays);
            setExpandedDayIds(new Set());
          }
        }}
      />
    </div>
  );
}
