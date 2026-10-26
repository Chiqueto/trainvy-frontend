"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  createPrescriptionDraftAction,
  sendPrescriptionAction,
  updatePrescriptionDraftAction,
} from "@/app/personal/_actions";
import {
  createDraftExercise,
  createDraftWorkoutDay,
  createInitialWorkoutDays,
  validateWorkoutPlanDraft,
  WEEK_DAYS,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAiPrescriptionModal } from "./coach-ai-prescription-modal";

export interface InitialPrescriptionData {
  id?: string;
  name: string;
  notes?: string | null;
  version?: number;
  workoutDays?: Array<{
    name: string;
    order?: number;
    weekDay?: (typeof WEEK_DAYS)[number]["value"];
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      name: string;
      order?: number;
      sets: number;
      warmupSets?: number;
      reps: number;
      restTimeInSeconds: number;
      alternative1ExerciseName?: string | null;
      alternative2ExerciseName?: string | null;
    }>;
  }>;
}

interface CoachPrescriptionBuilderProps {
  athleteId: string;
  athleteName: string;
  initialData?: InitialPrescriptionData;
}

export function CoachPrescriptionBuilder({
  athleteId,
  athleteName,
  initialData,
}: CoachPrescriptionBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [days, setDays] = useState<WorkoutPlanDraftDay[]>(() => {
    if (initialData?.workoutDays && initialData.workoutDays.length > 0) {
      return initialData.workoutDays.map((d) => ({
        name: d.name,
        weekDay: d.weekDay,
        isRest: d.isRest,
        estimatedDurationInMinutes: Math.max(
          1,
          Math.round(d.estimatedDurationInSeconds / 60),
        ),
        exercises: (d.exercises ?? []).map((e) => ({
          name: e.name,
          sets: e.sets,
          warmupSets: e.warmupSets ?? 0,
          reps: e.reps,
          restTimeInSeconds: e.restTimeInSeconds,
          alternative1Name: e.alternative1ExerciseName ?? "",
          alternative2Name: e.alternative2ExerciseName ?? "",
        })),
      }));
    }
    return createInitialWorkoutDays();
  });

  const [error, setError] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateDay(index: number, patch: Partial<WorkoutPlanDraftDay>) {
    setDays((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index ? { ...day, ...patch } : day,
      ),
    );
  }

  function addWorkout() {
    const nextLetter = String.fromCharCode(65 + (days.length % 26));
    setDays((current) => [...current, createDraftWorkoutDay(nextLetter)]);
  }

  function removeWorkout(index: number) {
    if (days.length <= 1) return;
    setDays((current) => current.filter((_, i) => i !== index));
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

  function addExercise(dayIndex: number) {
    updateDay(dayIndex, {
      exercises: [...days[dayIndex].exercises, createDraftExercise()],
    });
  }

  function removeExercise(dayIndex: number, exerciseIndex: number) {
    if (days[dayIndex].exercises.length <= 1) return;
    updateDay(dayIndex, {
      exercises: days[dayIndex].exercises.filter((_, i) => i !== exerciseIndex),
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

  function serializeDaysForApi() {
    return days.map((day, dayIndex) => ({
      name: day.name.trim(),
      order: dayIndex,
      weekDay: day.weekDay ?? "MONDAY",
      isRest: day.isRest,
      estimatedDurationInSeconds: day.isRest
        ? 0
        : Math.max(1, day.estimatedDurationInMinutes) * 60,
      exercises: day.isRest
        ? []
        : day.exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name.trim(),
            order: exerciseIndex,
            sets: Number(exercise.sets) || 1,
            warmupSets: Number(exercise.warmupSets) || 0,
            reps: Number(exercise.reps) || 1,
            restTimeInSeconds: Number(exercise.restTimeInSeconds) || 60,
            alternative1ExerciseName: exercise.alternative1Name?.trim() || null,
            alternative2ExerciseName: exercise.alternative2Name?.trim() || null,
          })),
    }));
  }

  async function handleSave(sendImmediately: boolean = false) {
    const validationError = validateWorkoutPlanDraft(name, days);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    startTransition(async () => {
      const serializedWorkoutDays = serializeDaysForApi();

      let savedPrescriptionId = initialData?.id;

      if (initialData?.id) {
        // Atualiza rascunho existente
        const updateRes = await updatePrescriptionDraftAction({
          id: initialData.id,
          athleteId,
          body: {
            name: name.trim(),
            notes: notes.trim() || null,
            workoutDays: serializedWorkoutDays,
            version: initialData.version,
          },
        });

        if (!updateRes.success) {
          setError(updateRes.error);
          return;
        }
      } else {
        // Cria novo rascunho
        const createRes = await createPrescriptionDraftAction({
          athleteId,
          name: name.trim(),
          notes: notes.trim() || null,
          workoutDays: serializedWorkoutDays,
        });

        if (!createRes.success) {
          setError(createRes.error);
          return;
        }
        savedPrescriptionId = createRes.data?.id;
      }

      // Se solicitado envio imediato
      if (sendImmediately && savedPrescriptionId) {
        const sendRes = await sendPrescriptionAction({
          id: savedPrescriptionId,
          athleteId,
        });
        if (!sendRes.success) {
          setError(sendRes.error);
          return;
        }
      }

      router.push(`/personal/alunos/${athleteId}?tab=prescriptions`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Banner de Prescrição Assistida por IA */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h2 className="font-heading text-sm font-bold text-foreground">
                Prescrição Assistida por IA
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Monte divisões e selecione exercícios canônicos ditando por voz, enviando uma ficha em PDF/foto ou descrevendo a estratégia para {athleteName}.
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="h-10 rounded-xl font-heading text-xs font-bold gap-2 shadow-xs shrink-0"
          >
            <Sparkles className="size-3.5" />
            <span>Prescrever com IA</span>
          </Button>
        </div>
      </section>

      {/* Card de Configurações Básicas da Prescrição */}
      <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-sm font-bold text-foreground">
            Informações do Planejamento
          </h2>
          <p className="text-xs text-muted-foreground">
            Defina o nome principal e as orientações para {athleteName}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="prescription-name"
              className="text-xs font-heading font-semibold text-foreground"
            >
              Nome do Planejamento *
            </label>
            <Input
              id="prescription-name"
              placeholder="Ex: Hipertrofia ABCD - Foco em Superiores"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="prescription-notes"
              className="text-xs font-heading font-semibold text-foreground"
            >
              Orientações ao Aluno (opcional)
            </label>
            <textarea
              id="prescription-notes"
              placeholder="Instruções sobre descanso, cadência, progressão de carga ou metas..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none min-h-[75px]"
            />
          </div>
        </div>
      </section>

      {/* Seção de Dias de Treino */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Estrutura Semanal
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure os treinos e os dias de descanso
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="h-9 rounded-xl font-heading text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="size-3.5" />
              <span>Gerar com IA</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWorkout}
              className="h-9 rounded-xl font-heading text-xs font-semibold gap-1.5 border-border/80"
            >
              <Plus className="size-3.5 text-primary" />
              <span>Adicionar Dia</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {days.map((day, dayIndex) => {
            return (
              <div
                key={dayIndex}
                className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4 transition-colors"
              >
                {/* Header do Dia */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Input
                      value={day.name}
                      onChange={(e) =>
                        updateDay(dayIndex, { name: e.target.value })
                      }
                      placeholder={`Treino ${String.fromCharCode(65 + (dayIndex % 26))}`}
                      className="h-9 rounded-xl text-xs font-heading font-bold max-w-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={dayIndex === 0}
                      onClick={() => moveWorkout(dayIndex, -1)}
                      className="size-8 rounded-lg"
                      title="Mover para cima"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={dayIndex === days.length - 1}
                      onClick={() => moveWorkout(dayIndex, 1)}
                      className="size-8 rounded-lg"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={days.length <= 1}
                      onClick={() => removeWorkout(dayIndex)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Excluir dia"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Controles do Dia (Dia da Semana, Descanso, Duração) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-heading font-medium text-muted-foreground">
                      Dia da Semana
                    </label>
                    <select
                      value={day.weekDay ?? "MONDAY"}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateDay(dayIndex, {
                          weekDay: e.target
                            .value as (typeof WEEK_DAYS)[number]["value"],
                        })
                      }
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-heading focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      {WEEK_DAYS.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-heading font-medium text-muted-foreground">
                      Tipo de Dia
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(dayIndex, { isRest: !day.isRest })
                      }
                      className={`w-full h-9 rounded-xl border px-3 text-xs font-heading font-semibold flex items-center justify-center transition-colors ${
                        day.isRest
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-muted/40 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {day.isRest ? "Dia de Descanso" : "Dia de Treino"}
                    </button>
                  </div>

                  {!day.isRest && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-heading font-medium text-muted-foreground">
                        Duração Estimada (min)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={day.estimatedDurationInMinutes}
                        onChange={(e) =>
                          updateDay(dayIndex, {
                            estimatedDurationInMinutes: Number(e.target.value),
                          })
                        }
                        className="h-9 rounded-xl text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Lista de Exercícios (apenas se não for dia de descanso) */}
                {!day.isRest && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">
                        Exercícios ({day.exercises.length})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addExercise(dayIndex)}
                        className="h-7 px-2 text-xs font-heading font-semibold text-primary hover:bg-primary/10 gap-1"
                      >
                        <Plus className="size-3" />
                        <span>Adicionar Exercício</span>
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={exerciseIndex}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2.5 transition-colors hover:border-border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-mono font-bold text-muted-foreground">
                              {exerciseIndex + 1}
                            </span>
                            <Input
                              value={exercise.name}
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nome do exercício (ex: Supino Inclinado)"
                              className="h-9 flex-1 rounded-xl text-xs font-medium"
                            />
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={exerciseIndex === 0}
                                onClick={() =>
                                  moveExercise(dayIndex, exerciseIndex, -1)
                                }
                                className="size-7 rounded-lg"
                              >
                                <ArrowUp className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                  exerciseIndex === day.exercises.length - 1
                                }
                                onClick={() =>
                                  moveExercise(dayIndex, exerciseIndex, 1)
                                }
                                className="size-7 rounded-lg"
                              >
                                <ArrowDown className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={day.exercises.length <= 1}
                                onClick={() =>
                                  removeExercise(dayIndex, exerciseIndex)
                                }
                                className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Séries de Aquecimento, Séries, Repetições e Descanso */}
                          <div className="grid grid-cols-4 gap-2 pt-1">
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-heading font-medium text-amber-500 uppercase">
                                Aquecimento
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={exercise.warmupSets ?? 0}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    warmupSets: Number(e.target.value),
                                  })
                                }
                                className="h-8 rounded-lg text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10px] font-heading font-medium text-muted-foreground uppercase">
                                Séries
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={exercise.sets}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    sets: Number(e.target.value),
                                  })
                                }
                                className="h-8 rounded-lg text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10px] font-heading font-medium text-muted-foreground uppercase">
                                Reps
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={exercise.reps}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    reps: Number(e.target.value),
                                  })
                                }
                                className="h-8 rounded-lg text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10px] font-heading font-medium text-muted-foreground uppercase">
                                Descanso (s)
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={exercise.restTimeInSeconds}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    restTimeInSeconds: Number(e.target.value),
                                  })
                                }
                                className="h-8 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>

                          {/* Alternativas Fixas Prescritas */}
                          <div className="pt-2 border-t border-border/40">
                            <span className="text-[10px] font-heading font-medium text-muted-foreground uppercase">
                              Alternativas Fixas (opcional)
                            </span>
                            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input
                                value={exercise.alternative1Name ?? ""}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    alternative1Name: e.target.value,
                                  })
                                }
                                placeholder="Alternativa 1 (ex: Hack Squat)"
                                className="h-8 rounded-lg text-xs"
                              />
                              <Input
                                value={exercise.alternative2Name ?? ""}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    alternative2Name: e.target.value,
                                  })
                                }
                                placeholder="Alternativa 2 (ex: Leg Press 45°)"
                                className="h-8 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Rodapé Fixo / Ações de Envio e Rascunho */}
      <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-lg backdrop-blur-md">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => handleSave(false)}
          className="w-full sm:flex-1 h-11 rounded-xl font-heading text-xs font-semibold border-border/80"
        >
          {isPending && <LoaderCircle className="size-3.5 animate-spin mr-1.5" />}
          <span>Salvar Rascunho</span>
        </Button>

        <Button
          type="button"
          variant="default"
          disabled={isPending}
          onClick={() => handleSave(true)}
          className="w-full sm:flex-1 h-11 rounded-xl font-heading text-xs font-bold gap-2 shadow-sm"
        >
          {isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          <span>Salvar e Enviar ao Aluno</span>
        </Button>
      </div>

      <CoachAiPrescriptionModal
        athleteId={athleteId}
        athleteName={athleteName}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyPrescription={(generated) => {
          setName(generated.name);
          if (generated.notes) {
            setNotes(generated.notes);
          }
          setDays(generated.workoutDays);
          setIsAiModalOpen(false);
        }}
      />
    </div>
  );
}
