"use client";
import { AiFeature } from "@/app/_components/ai-availability-provider";
import { trackProductEvent } from "@/app/_lib/product-events";
import { AdvancedPrescriptionFields } from "@/app/planning/_components/advanced-prescription-fields";
import { serializeAdvancedPrescription } from "@/app/planning/_lib/workout-plan-builder";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { toast } from "sonner";
import {
  ArrowDown,
  Copy,
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
  duplicateDraftWorkoutDay,
  createDraftWorkoutDay,
  createClientDayId,
  createInitialWorkoutDays,
  validateWorkoutPlanDraft,
  WEEK_DAYS,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "@/app/planning/_lib/workout-plan-builder";
import { CatalogExercisePicker } from "@/app/planning/_components/catalog-exercise-picker";
import {
  WorkoutPlanReviewDialog,
  WorkoutPlanSummary,
} from "@/app/planning/_components/workout-plan-review-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAiPrescriptionModal } from "./coach-ai-prescription-modal";

export interface InitialPrescriptionData {
  originType?: string;
  allowStudentSubstitution?: boolean;
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
      repsMin?: number | null;
      repsMax?: number | null;
      targetRir?: number | null;
      targetLoadInGrams?: number | null;
      tempo?: string | null;
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
  const hydrated = useHydrated();
  const [name, setName] = useState(initialData?.name ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [allowStudentSubstitution, setAllowStudentSubstitution] = useState(
    initialData?.allowStudentSubstitution ?? true,
  );
  const [aiAssisted, setAiAssisted] = useState(
    initialData?.originType === "PROFESSIONAL_AI_ASSISTED",
  );

  const [days, setDays] = useState<WorkoutPlanDraftDay[]>(() => {
    if (initialData?.workoutDays && initialData.workoutDays.length > 0) {
      return initialData.workoutDays.map((d) => ({
        clientId: createClientDayId(),
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
          ...serializeAdvancedPrescription(e),
          restTimeInSeconds: e.restTimeInSeconds,
          alternative1Name: e.alternative1ExerciseName ?? "",
          alternative2Name: e.alternative2ExerciseName ?? "",
        })),
      }));
    }
    return createInitialWorkoutDays();
  });

  const [savedDraft, setSavedDraft] = useState({
    id: initialData?.id,
    version: initialData?.version,
  });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function reportError(message: string) {
    setError(message);
    toast.error(message);
  }
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

  function duplicateWorkout(index: number) {
    const copy = duplicateDraftWorkoutDay(days[index]);
    setDays((current) => [
      ...current.slice(0, index + 1),
      copy,
      ...current.slice(index + 1),
    ]);
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
            const name = exercise.name.trim();
            let alt1 = exercise.alternative1Name?.trim() || null;
            let alt2 = exercise.alternative2Name?.trim() || null;

            if (alt1 && alt1.toLowerCase() === name.toLowerCase()) alt1 = null;
            if (alt2 && alt2.toLowerCase() === name.toLowerCase()) alt2 = null;
            if (alt1 && alt2 && alt1.toLowerCase() === alt2.toLowerCase())
              alt2 = null;
            if (!alt1 && alt2) {
              alt1 = alt2;
              alt2 = null;
            }

            return {
              name,
              order: exerciseIndex,
              sets: exercise.sets,
              warmupSets: exercise.warmupSets ?? 0,
              reps: exercise.reps,
              ...serializeAdvancedPrescription(exercise),
              restTimeInSeconds: exercise.restTimeInSeconds,
              alternative1ExerciseName: alt1,
              alternative2ExerciseName: alt2,
            };
          }),
    }));
  }

  async function handleSave(
    sendImmediately: boolean = false,
    reviewed = false,
  ) {
    if (isPending) return;
    const validationError =
      validateWorkoutPlanDraft(name, days, undefined, undefined, {
        requireCatalogSelection: false,
      }) ||
      (name.trim().length > 100
        ? "O nome deve ter no máximo 100 caracteres."
        : null) ||
      (notes.trim().length > 1000
        ? "As orientações devem ter no máximo 1000 caracteres."
        : null) ||
      (sendImmediately &&
      !days.some((day) => !day.isRest && day.exercises.length > 0)
        ? "Adicione um dia de treino com exercícios antes de enviar."
        : null);
    if (validationError) {
      reportError(validationError);
      return;
    }

    setError(null);
    if (sendImmediately && !reviewed) {
      setReviewOpen(true);
      return;
    }
    setReviewOpen(false);
    startTransition(async () => {
      try {
        const serializedWorkoutDays = serializeDaysForApi();

        let savedPrescriptionId = savedDraft.id;
        let reviewedVersion = savedDraft.version;

        if (savedDraft.id) {
          // Atualiza rascunho existente
          const updateRes = await updatePrescriptionDraftAction({
            id: savedDraft.id,
            athleteId,
            body: {
              name: name.trim(),
              notes: notes.trim() || null,
              allowStudentSubstitution,
              workoutDays: serializedWorkoutDays,
              version: savedDraft.version!,
            },
          });

          if (!updateRes.success) {
            reportError(updateRes.error);
            return;
          }
          reviewedVersion = updateRes.data.version;
          setSavedDraft({
            id: updateRes.data.id,
            version: updateRes.data.version,
          });
        } else {
          // Cria novo rascunho
          const createRes = await createPrescriptionDraftAction({
            athleteId,
            name: name.trim(),
            notes: notes.trim() || null,
            allowStudentSubstitution,
            workoutDays: serializedWorkoutDays,
          });

          if (!createRes.success) {
            reportError(createRes.error);
            return;
          }
          savedPrescriptionId = createRes.data.id;
          reviewedVersion = createRes.data.version;
          setSavedDraft({
            id: createRes.data.id,
            version: createRes.data.version,
          });
        }

        // Se solicitado envio imediato
        if (sendImmediately && savedPrescriptionId) {
          const sendRes = await sendPrescriptionAction({
            id: savedPrescriptionId,
            athleteId,
            version: reviewedVersion!,
          });
          if (!sendRes.success) {
            reportError(`Rascunho salvo. ${sendRes.error}`);
            return;
          }
          trackProductEvent("Prescription sent");
        }

        toast.success(
          sendImmediately
            ? "Prescrição enviada ao aluno!"
            : "Rascunho salvo com sucesso!",
        );
        router.push(`/personal/alunos/${athleteId}?tab=prescriptions`);
        router.refresh();
      } catch {
        reportError("Não foi possível concluir a operação. Tente novamente.");
      }
    });
  }

  return (
    <fieldset
      disabled={!hydrated || isPending}
      aria-busy={!hydrated || isPending}
      className="flex min-w-0 flex-col gap-6 disabled:opacity-80"
    >
      {/* Banner de Prescrição Assistida por IA */}
      {aiAssisted && (
        <p className="rounded-lg border p-3 text-sm">
          Sugestão gerada por IA — Revisão e aprovação profissional obrigatória
          antes de liberar ao aluno.
        </p>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={allowStudentSubstitution}
          onChange={(e) => setAllowStudentSubstitution(e.target.checked)}
        />
        Permitir substituições de exercícios pelo aluno durante a sessão,
        mantendo a ficha original.
      </label>
      <AiFeature capability="planning">
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
                Monte divisões e selecione exercícios canônicos ditando por voz,
                enviando uma ficha em PDF/foto ou descrevendo a estratégia para{" "}
                {athleteName}.
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
      </AiFeature>

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

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="prescription-name"
              className="text-xs font-heading font-semibold text-foreground"
            >
              Nome do Planejamento *
            </label>
            <Input
              id="prescription-name"
              maxLength={100}
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
              maxLength={1000}
              placeholder="Instruções sobre descanso, cadência, progressão de carga ou metas..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              className="w-full rounded-xl border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none min-h-[75px]"
            />
          </div>
        </div>
      </section>

      {/* Seção de Dias de Treino */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="font-heading text-sm font-bold text-foreground">
              Estrutura Semanal
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure os treinos e os dias de descanso
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AiFeature capability="planning">
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
            </AiFeature>
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

        <div className="grid items-start gap-5 xl:grid-cols-2">
          {days.map((day, dayIndex) => {
            return (
              <div
                key={day.clientId ?? day.id ?? dayIndex}
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
                      aria-label={`Duplicar ${day.name}`}
                      title="Duplicar treino"
                      onClick={() => duplicateWorkout(dayIndex)}
                      className="size-8 rounded-lg"
                    >
                      <Copy className="size-3.5" />
                    </Button>
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
                            <div className="min-w-0 flex-1 space-y-2">
                              <Input
                                aria-label={`Nome do exercício ${exerciseIndex + 1} de ${day.name}`}
                                value={exercise.name}
                                onChange={(e) =>
                                  updateExercise(dayIndex, exerciseIndex, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Nome do exercício (ex: Supino Inclinado)"
                                className="h-9 flex-1 rounded-xl text-xs font-medium"
                              />
                              <CatalogExercisePicker
                                label="Buscar no catálogo"
                                name={undefined}
                                disabled={isPending}
                                onSelect={(selected) => {
                                  if (selected)
                                    updateExercise(dayIndex, exerciseIndex, {
                                      name: selected.name,
                                    });
                                }}
                              />
                            </div>
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
                          <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
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

                          <AdvancedPrescriptionFields
                            value={exercise}
                            disabled={isPending}
                            onChange={(patch) =>
                              updateExercise(dayIndex, exerciseIndex, patch)
                            }
                          />
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
      <div
        className="sticky z-20 space-y-2 rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-lg backdrop-blur-md"
        style={{ bottom: "var(--workout-builder-bottom, 1rem)" }}
      >
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <WorkoutPlanSummary days={days} />
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleSave(false)}
            className="w-full sm:flex-1 h-11 rounded-xl font-heading text-xs font-semibold border-border/80"
          >
            {isPending && (
              <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
            )}
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
            <span>Revisar e Aprovar Prescrição</span>
          </Button>
        </div>
      </div>
      {reviewOpen && (
        <WorkoutPlanReviewDialog
          name={name}
          days={days.map((day) => ({
            ...day,
            weekDay: day.weekDay ?? "MONDAY",
          }))}
          notes={notes}
          recipient={athleteName}
          allowStudentSubstitution={allowStudentSubstitution}
          confirmLabel="Confirmar e enviar ao aluno"
          onClose={() => setReviewOpen(false)}
          onConfirm={() => void handleSave(true, true)}
          pending={isPending}
        />
      )}

      <AiFeature capability="planning">
        <CoachAiPrescriptionModal
          athleteId={athleteId}
          athleteName={athleteName}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyPrescription={(generated) => {
            setAiAssisted(true);
            setSavedDraft({
              id: generated.prescriptionId,
              version: generated.version,
            });
            setName(generated.name);
            if (generated.notes) {
              setNotes(generated.notes);
            }
            setDays(generated.workoutDays);
            setIsAiModalOpen(false);
          }}
        />
      </AiFeature>
    </fieldset>
  );
}
