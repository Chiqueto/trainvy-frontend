"use client";
import {
  ViewModeToggle,
  useBuilderMode,
} from "@/app/planning/_components/tactical/view-mode-toggle";
import { TacticalPlanWorkspace } from "@/app/planning/_components/tactical/tactical-plan-workspace";
import { ClassicTacticalFields } from "@/app/planning/_components/tactical/classic-tactical-fields";
import { SealButton } from "@/app/planning/_components/tactical/seal-button";
import { patchExercise } from "@/app/planning/_lib/tactical";

import { trainingDaysOnly } from "@/app/_lib/training-days";
import { AiFeature } from "@/app/_components/ai-availability-provider";
import { trackProductEvent } from "@/app/_lib/product-events";
import { CoachPrescriptionExerciseCard } from "./coach-prescription-exercise-card";
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
import { CatalogExerciseBatchPicker } from "@/app/planning/_components/catalog-exercise-picker";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
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
      exerciseId?: string | null;
      alternative1ExerciseId?: string | null;
      alternative2ExerciseId?: string | null;
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
      supersetGroupId?: string | null;
      runes?: WorkoutPlanDraftExercise["runes"];
      setPrescription?: WorkoutPlanDraftExercise["setPrescription"];
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
  const [tacticalDayIndex, setTacticalDayIndex] = useState(0);
  const { builderMode, changeMode, syncError } = useBuilderMode();
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
      return trainingDaysOnly(initialData.workoutDays).map((d, index) => ({
        clientId: createClientDayId(),
        name: d.name,
        weekDay: d.weekDay ?? WEEK_DAYS[index % 7].value,
        isRest: d.isRest,
        estimatedDurationInMinutes: Math.max(
          1,
          Math.round(d.estimatedDurationInSeconds / 60),
        ),
        exercises: (d.exercises ?? []).map((e) => ({
          exerciseId: e.exerciseId,
          alternative1ExerciseId: e.alternative1ExerciseId,
          alternative2ExerciseId: e.alternative2ExerciseId,
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
    return createInitialWorkoutDays().map((day, index) => ({
      ...day,
      weekDay: WEEK_DAYS[(index * 2) % 7].value,
      exercises: [],
    }));
  });

  const [activeDayId, setActiveDayId] = useState<string | undefined>(
    days[0]?.clientId,
  );
  const activeDayIndex = Math.max(
    0,
    days.findIndex((day) => day.clientId === activeDayId),
  );

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
    const day = createDraftWorkoutDay(nextLetter);
    day.exercises = [];
    day.weekDay = WEEK_DAYS[days.length % 7].value;
    setDays((current) => [...current, day]);
    setActiveDayId(day.clientId);
  }

  function duplicateWorkout(index: number) {
    const copy = duplicateDraftWorkoutDay(days[index]);
    setDays((current) => [
      ...current.slice(0, index + 1),
      copy,
      ...current.slice(index + 1),
    ]);
    setActiveDayId(copy.clientId);
  }

  function removeWorkout(index: number) {
    if (days.length <= 1) return;
    setDays((current) => current.filter((_, i) => i !== index));
    setActiveDayId(days[Math.max(0, index - 1)].clientId);
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
        index === exerciseIndex ? patchExercise(exercise, patch) : exercise,
      ),
    });
  }

  function addExercises(dayIndex: number, selected: ListExercises200Item[]) {
    updateDay(dayIndex, {
      exercises: [
        ...days[dayIndex].exercises.filter(
          (exercise) => exercise.name || exercise.exerciseId,
        ),
        ...selected.map((exercise) => ({
          ...createDraftExercise(),
          exerciseId: exercise.id,
          name: exercise.name,
        })),
      ],
    });
  }

  function removeExercise(dayIndex: number, exerciseIndex: number) {
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
    return trainingDaysOnly(days).map((day, dayIndex) => ({
      name: day.name.trim(),
      order: dayIndex,
      weekDay: day.weekDay ?? "MONDAY",
      isRest: false,
      estimatedDurationInSeconds: Math.round(
        day.estimatedDurationInMinutes * 60,
      ),
      exercises: day.exercises.map((exercise, exerciseIndex) => {
        const name = exercise.name.trim();
        const alternatives = [
          {
            id: exercise.alternative1ExerciseId,
            name: exercise.alternative1Name,
          },
          {
            id: exercise.alternative2ExerciseId,
            name: exercise.alternative2Name,
          },
        ].filter(
          (alternative, index, entries) =>
            alternative.id &&
            alternative.id !== exercise.exerciseId &&
            entries.findIndex((entry) => entry.id === alternative.id) === index,
        );

        return {
          name,
          exerciseId: exercise.exerciseId,
          order: exerciseIndex,
          sets: exercise.sets,
          warmupSets: exercise.warmupSets ?? 0,
          reps: exercise.reps,
          ...serializeAdvancedPrescription(exercise),
          restTimeInSeconds: exercise.restTimeInSeconds,
          alternative1ExerciseId: alternatives[0]?.id ?? null,
          alternative1ExerciseName: alternatives[0]?.name ?? null,
          alternative2ExerciseId: alternatives[1]?.id ?? null,
          alternative2ExerciseName: alternatives[1]?.name ?? null,
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
      validateWorkoutPlanDraft(name, days) ||
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
      const invalidDay = days.find((day) =>
        validateWorkoutPlanDraft(name || "Plano", [day]),
      );
      if (invalidDay) setActiveDayId(invalidDay.clientId);
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
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
            01
          </span>{" "}
          O plano do aluno
        </div>
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

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={allowStudentSubstitution}
          onChange={(e) => setAllowStudentSubstitution(e.target.checked)}
        />
        <span>
          <span className="block font-semibold">
            Permitir substituições durante a sessão
          </span>
          <span className="text-muted-foreground">
            O aluno pode trocar exercícios sem alterar a ficha original. As
            alternativas que você prescrever ficam disponíveis na execução.
          </span>
        </span>
      </label>
      {/* Seção de Dias de Treino */}
      <ViewModeToggle
        value={builderMode}
        onChange={changeMode}
        syncError={syncError}
      />
      {builderMode === "tactical" ? (
        <TacticalPlanWorkspace
          activeIndex={tacticalDayIndex}
          onActiveChange={setTacticalDayIndex}
          days={days}
          onChange={setDays}
          disabled={isPending}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="font-heading text-sm font-bold text-foreground">
                <span className="mr-2 text-primary">02</span> Monte sua divisão
              </h2>
              <p className="text-xs text-muted-foreground">
                Um treino por vez. Escolha a sequência e ajuste a dose de cada
                exercício.
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

          <div
            aria-label="Selecionar treino para editar"
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {days.map((day, index) => (
              <button
                key={day.clientId}
                type="button"
                aria-pressed={index === activeDayIndex}
                onClick={() => setActiveDayId(day.clientId)}
                className={`flex min-h-16 min-w-40 max-w-60 shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${index === activeDayIndex ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${index === activeDayIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {String.fromCharCode(65 + (index % 26))}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {day.name || "Sem nome"}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {`${day.exercises.filter((exercise) => exercise.exerciseId).length} exercícios · ${day.estimatedDurationInMinutes} min`}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div>
            {days.slice(activeDayIndex, activeDayIndex + 1).map((day) => {
              const dayIndex = activeDayIndex;
              return (
                <div
                  key={day.clientId ?? day.id ?? dayIndex}
                  className="min-w-0 rounded-3xl border border-border/80 bg-card p-4 shadow-xs space-y-5 sm:p-6"
                >
                  {/* Header do Dia */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Input
                        aria-label="Nome do treino"
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
                        aria-label="Mover treino para cima"
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
                        aria-label="Mover treino para baixo"
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
                        aria-label="Excluir dia"
                        title="Excluir dia"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Identificação e duração do treino */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-heading font-medium text-muted-foreground">
                        Dia da Semana
                      </label>
                      <select
                        aria-label="Dia da semana"
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
                        Duração Estimada (min)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        aria-label="Duração estimada (min)"
                        value={day.estimatedDurationInMinutes}
                        onChange={(e) =>
                          updateDay(dayIndex, {
                            estimatedDurationInMinutes: Number(e.target.value),
                          })
                        }
                        className="h-9 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Lista de exercícios do treino */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Sequência do treino
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Selecione em lote. A ordem da seleção vira a ordem de
                          execução.
                        </p>
                      </div>
                      <CatalogExerciseBatchPicker
                        disabled={isPending}
                        excludeIds={day.exercises
                          .map((exercise) => exercise.exerciseId)
                          .filter((id): id is string => Boolean(id))}
                        onSelect={(selected) =>
                          addExercises(dayIndex, selected)
                        }
                      />
                    </div>
                    <div className="space-y-4">
                      {!day.exercises.length && (
                        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                          Seu treino começa aqui. Adicione os exercícios da
                          biblioteca.
                        </p>
                      )}
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={`${exerciseIndex}-classic`}
                          className="space-y-2"
                        >
                          <ClassicTacticalFields
                            value={exercise}
                            disabled={isPending}
                            onChange={(patch) =>
                              updateExercise(dayIndex, exerciseIndex, patch)
                            }
                          />
                          <CoachPrescriptionExerciseCard
                            key={
                              exerciseIndex +
                              "-" +
                              (exercise.exerciseId ?? "empty")
                            }
                            exercise={exercise}
                            index={exerciseIndex}
                            count={day.exercises.length}
                            onChange={(patch) =>
                              updateExercise(dayIndex, exerciseIndex, patch)
                            }
                            onMove={(offset) =>
                              moveExercise(dayIndex, exerciseIndex, offset)
                            }
                            onRemove={() =>
                              removeExercise(dayIndex, exerciseIndex)
                            }
                            onApplyDose={() => {
                              updateDay(dayIndex, {
                                exercises: day.exercises.map((entry) =>
                                  patchExercise(entry, {
                                    sets: exercise.sets,
                                    reps: exercise.reps,
                                    repsMin: exercise.repsMin ?? null,
                                    repsMax: exercise.repsMax ?? null,
                                    restTimeInSeconds:
                                      exercise.restTimeInSeconds,
                                  }),
                                ),
                              });
                              toast.success(
                                "Séries, repetições e descanso aplicados neste treino.",
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
          {builderMode === "tactical" ? (
            <SealButton
              disabled={isPending}
              onSave={() => void handleSave(false)}
            />
          ) : (
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
          )}

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
            const generatedDays = trainingDaysOnly(generated.workoutDays).map(
              (day) => ({
                ...day,
                clientId: createClientDayId(),
              }),
            );
            setDays(generatedDays);
            setActiveDayId(generatedDays[0]?.clientId);
            setIsAiModalOpen(false);
          }}
        />
      </AiFeature>
    </fieldset>
  );
}
