"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Layers,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import {
  createTemplateAction,
  updateTemplateAction,
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
import { Label } from "@/components/ui/label";

export interface InitialTemplateData {
  id?: string;
  name: string;
  description?: string | null;
  tags?: string[];
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

interface CoachTemplateBuilderProps {
  initialData?: InitialTemplateData;
}

export function CoachTemplateBuilder({ initialData }: CoachTemplateBuilderProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(", "));

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
        : Math.round(day.estimatedDurationInMinutes * 60),
      exercises: day.isRest
        ? []
        : day.exercises.map((exercise, exerciseIndex) => {
            const exName = exercise.name.trim();
            let alt1 = exercise.alternative1Name?.trim() || null;
            let alt2 = exercise.alternative2Name?.trim() || null;

            if (alt1 && alt1.toLowerCase() === exName.toLowerCase()) alt1 = null;
            if (alt2 && alt2.toLowerCase() === exName.toLowerCase()) alt2 = null;
            if (alt1 && alt2 && alt1.toLowerCase() === alt2.toLowerCase()) alt2 = null;
            if (!alt1 && alt2) {
              alt1 = alt2;
              alt2 = null;
            }

            return {
              name: exName,
              order: exerciseIndex,
              sets: exercise.sets,
              warmupSets: exercise.warmupSets ?? 0,
              reps: exercise.reps,
              restTimeInSeconds: exercise.restTimeInSeconds,
              alternative1ExerciseName: alt1,
              alternative2ExerciseName: alt2,
            };
          }),
    }));
  }

  async function handleSave() {
    if (isPending) return;
    const validationError = validateWorkoutPlanDraft(name, days);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        workoutDays: serializeDaysForApi(),
      };

      if (isEditing && initialData?.id) {
        const res = await updateTemplateAction(initialData.id, payload);
        if (res.success) {
          toast.success("Modelo de treino atualizado com sucesso!");
          router.push("/personal/modelos");
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createTemplateAction(payload);
        if (res.success) {
          toast.success("Modelo de treino criado com sucesso!");
          router.push("/personal/modelos");
        } else {
          toast.error(res.error);
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/personal/modelos"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Voltar para Modelos</span>
        </Link>

        <Button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="rounded-xl h-10 px-5 font-heading font-semibold shadow-xs"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="size-4" />
              <span>{isEditing ? "Salvar Alterações" : "Salvar Modelo"}</span>
            </div>
          )}
        </Button>
      </div>

      {/* Dados Gerais do Modelo */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {isEditing ? "Editar Modelo de Treino" : "Novo Modelo de Treino"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure a estrutura dos dias e exercícios deste modelo reutilizável.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="template-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome do Modelo *
            </Label>
            <Input
              id="template-name"
              placeholder="Ex: ABC Hipertrofia Clássico"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição (Opcional)
            </Label>
            <Input
              id="template-description"
              placeholder="Ex: Foco em sobrecarga progressiva e descanso de 90s"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tags (Separadas por vírgula)
            </Label>
            <Input
              id="template-tags"
              placeholder="Ex: Hipertrofia, Intermediário, ABC"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Dias de Treino */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Divisão de Treinos ({days.length} dias)
            </h3>
            <p className="text-xs text-muted-foreground">
              Adicione e personalize cada dia da rotina.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addWorkout}
            disabled={isPending}
            className="rounded-xl h-10 px-4 text-xs font-heading font-semibold"
          >
            <Plus className="size-3.5 mr-1.5" />
            Adicionar Dia
          </Button>
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                <Input
                  value={day.name}
                  onChange={(e) => updateDay(dayIndex, { name: e.target.value })}
                  placeholder="Nome do dia (ex: Treino A - Peito)"
                  className="font-heading font-bold text-base h-10 rounded-xl bg-background max-w-sm"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={day.weekDay ?? "MONDAY"}
                  onChange={(e) =>
                    updateDay(dayIndex, {
                      weekDay: e.target.value as (typeof WEEK_DAYS)[number]["value"],
                    })
                  }
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-heading font-medium text-foreground focus-visible:outline-none"
                  disabled={isPending}
                >
                  {WEEK_DAYS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => moveWorkout(dayIndex, -1)}
                  disabled={isPending || dayIndex === 0}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  title="Mover para cima"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveWorkout(dayIndex, 1)}
                  disabled={isPending || dayIndex === days.length - 1}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                  title="Mover para baixo"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeWorkout(dayIndex)}
                  disabled={isPending || days.length <= 1}
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
                  title="Excluir dia"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Configurações do Dia: Descanso e Duração */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={day.isRest}
                  onChange={(e) => updateDay(dayIndex, { isRest: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                  disabled={isPending}
                />
                <span>Dia de descanso (off)</span>
              </label>

              {!day.isRest && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span>Duração estimada:</span>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    value={day.estimatedDurationInMinutes}
                    onChange={(e) =>
                      updateDay(dayIndex, {
                        estimatedDurationInMinutes: Number(e.target.value) || 60,
                      })
                    }
                    className="w-16 h-8 text-center text-xs rounded-lg bg-background"
                    disabled={isPending}
                  />
                  <span>min</span>
                </div>
              )}
            </div>

            {/* Lista de Exercícios do Dia */}
            {!day.isRest && (
              <div className="flex flex-col gap-3 pt-2">
                {day.exercises.map((exercise, exerciseIndex) => (
                  <div
                    key={exerciseIndex}
                    className="rounded-2xl border border-border/80 bg-background/50 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {exerciseIndex + 1}
                      </span>
                      <Input
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(dayIndex, exerciseIndex, {
                            name: e.target.value,
                          })
                        }
                        placeholder="Nome do exercício (ex: Supino Reto com Barra)"
                        className="h-10 rounded-xl bg-card font-medium text-sm flex-1"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => moveExercise(dayIndex, exerciseIndex, -1)}
                        disabled={isPending || exerciseIndex === 0}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                        title="Subir exercício"
                      >
                        <ArrowUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(dayIndex, exerciseIndex, 1)}
                        disabled={
                          isPending ||
                          exerciseIndex === day.exercises.length - 1
                        }
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                        title="Descer exercício"
                      >
                        <ArrowDown className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExercise(dayIndex, exerciseIndex)}
                        disabled={isPending || day.exercises.length <= 1}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
                        title="Remover exercício"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>

                    {/* Séries, Reps, Aquecimento, Descanso */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Séries Válidas
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              sets: Number(e.target.value) || 1,
                            })
                          }
                          className="h-8 rounded-lg bg-card text-center text-xs"
                          disabled={isPending}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Repetições
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              reps: Number(e.target.value) || 1,
                            })
                          }
                          className="h-8 rounded-lg bg-card text-center text-xs"
                          disabled={isPending}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Aquecimento
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={exercise.warmupSets ?? 0}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              warmupSets: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 rounded-lg bg-card text-center text-xs"
                          disabled={isPending}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Descanso (seg)
                        </Label>
                        <Input
                          type="number"
                          min={10}
                          max={600}
                          step={5}
                          value={exercise.restTimeInSeconds}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              restTimeInSeconds: Number(e.target.value) || 60,
                            })
                          }
                          className="h-8 rounded-lg bg-card text-center text-xs"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    {/* Alternativas de Exercício */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Alternativa 1 (Opcional)
                        </Label>
                        <Input
                          value={exercise.alternative1Name ?? ""}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              alternative1Name: e.target.value,
                            })
                          }
                          placeholder="Ex: Supino Inclinado com Halteres"
                          className="h-8 rounded-lg bg-card text-xs"
                          disabled={isPending}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Alternativa 2 (Opcional)
                        </Label>
                        <Input
                          value={exercise.alternative2Name ?? ""}
                          onChange={(e) =>
                            updateExercise(dayIndex, exerciseIndex, {
                              alternative2Name: e.target.value,
                            })
                          }
                          placeholder="Ex: Supino Máquina Vertical"
                          className="h-8 rounded-lg bg-card text-xs"
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addExercise(dayIndex)}
                  disabled={isPending}
                  className="rounded-xl h-9 text-xs font-heading font-medium border-dashed border-border/80"
                >
                  <Plus className="size-3 mr-1" />
                  Adicionar Exercício ao {day.name}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé com Botão Salvar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <Link href="/personal/modelos">
          <Button variant="outline" className="rounded-xl h-11 px-5">
            Cancelar
          </Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="rounded-xl h-11 px-7 font-heading font-semibold shadow-xs"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="size-4" />
              <span>{isEditing ? "Salvar Alterações" : "Salvar Modelo"}</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
