"use client";
import { AiFeature } from "@/app/_components/ai-availability-provider";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRightLeft,
  Box,
  ChevronDown,
  Check,
  Dumbbell,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { getExerciseAnimation } from "@/app/_components/exercise-3d/exercises";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";
import type {
  GetWorkoutSession200SessionExercisesItem,
  GetWorkoutSession200SessionExercisesItemSetsItem,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import {
  PrescriptionTargets,
  repetitionTarget,
} from "@/app/_components/prescription-targets";

import { createWorkoutSetAction } from "../_actions";
import { SubstituteExerciseModal } from "./substitute-exercise-modal";
import { WorkoutSetRow } from "./workout-set-row";

interface SessionExerciseCardProps {
  sessionId?: string;
  exercise: GetWorkoutSession200SessionExercisesItem;
  exerciseIndex?: number;
  isReadOnly: boolean;
  isFreeWorkout?: boolean;
  onRemoveExercise?: (sessionExerciseId: string) => Promise<void>;
  onSubstituteExercise?: (
    sessionExerciseId: string,
    newExerciseId: string,
  ) => Promise<void>;
  onOpenAi?: () => void;
  onError: (errorMsg: string) => void;
  onMutationStart?: () => void;
  onMutationEnd?: () => void;
}

export function SessionExerciseCard({
  sessionId = "",
  exercise,
  exerciseIndex = exercise.order + 1,
  isReadOnly,
  isFreeWorkout = false,
  onRemoveExercise,
  onSubstituteExercise,
  onOpenAi,
  onError,
  onMutationStart,
  onMutationEnd,
}: SessionExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  // Inicializa a lista local de séries
  const [sets, setSets] = useState<
    GetWorkoutSession200SessionExercisesItemSetsItem[]
  >(() => [...exercise.sets].sort((a, b) => a.order - b.order));

  useEffect(() => {
    setSets([...exercise.sets].sort((a, b) => a.order - b.order));
  }, [exercise.sets]);

  const completedSetsCount = useMemo(
    () => sets.filter((s) => !!s.completedAt).length,
    [sets],
  );

  // Detecta se o exercício é naturalmente baseado em tempo (ex: pranchas, isometrias)
  const isDefaultDuration = useMemo(() => {
    const nameLower = exercise.exerciseNameSnapshot.toLowerCase();
    const hasDurationName =
      nameLower.includes("prancha") ||
      nameLower.includes("isometria") ||
      nameLower.includes("tempo") ||
      nameLower.includes("hold");

    const hasDurationSets = exercise.sets.some(
      (s) => s.durationInSeconds !== null && s.durationInSeconds !== undefined,
    );

    return hasDurationName || hasDurationSets;
  }, [exercise]);

  const [mode, setMode] = useState<"reps" | "duration">(
    isDefaultDuration ? "duration" : "reps",
  );

  const [isPending, startTransition] = useTransition();

  // Callback para atualizar uma série no estado local
  const handleUpdateSet = (
    updated: GetWorkoutSession200SessionExercisesItemSetsItem,
  ) => {
    setSets((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    );
  };

  // Callback para remover uma série do estado local
  const handleDeleteSet = (setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId));
  };

  // Remoção de exercício avulso
  const handleRemoveClick = () => {
    if (isReadOnly || isRemoving) return;
    if (sets.length > 0) {
      setShowDeleteConfirm(true);
    } else {
      handleConfirmRemove();
    }
  };

  const handleConfirmRemove = () => {
    if (isReadOnly || isRemoving || !onRemoveExercise) return;
    onMutationStart?.();
    startRemoveTransition(async () => {
      try {
        await onRemoveExercise(exercise.id);
        setShowDeleteConfirm(false);
      } catch (err: unknown) {
        onError((err as Error)?.message || "Erro ao remover exercício");
        setShowDeleteConfirm(false);
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Adicionar nova série
  const handleAddSet = () => {
    if (isReadOnly || isPending) return;

    onMutationStart?.();
    startTransition(async () => {
      try {
        const res = await createWorkoutSetAction(sessionId, exercise.id, {
          type: "WORKING",
        });

        if (!res.success) {
          onError(res.error);
        } else {
          const newSet: GetWorkoutSession200SessionExercisesItemSetsItem = {
            id: res.data.id,
            order: res.data.order,
            type: res.data.type,
            weightInGrams: res.data.weightInGrams,
            reps: res.data.reps,
            rir: res.data.rir,
            durationInSeconds: res.data.durationInSeconds,
            notes: res.data.notes,
            completedAt: res.data.completedAt,
          };

          setSets((prev) =>
            [...prev, newSet].sort((a, b) => a.order - b.order),
          );
        }
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Formatação da prescrição
  const prescriptionText = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const warmup = (exercise as any).plannedWarmupSets ?? 0;
    const workingSets = exercise.plannedSets;
    const reps = repetitionTarget({
      reps: exercise.plannedReps,
      repsMin: exercise.plannedRepsMin,
      repsMax: exercise.plannedRepsMax,
    });

    if (warmup > 0) {
      if (workingSets && reps) {
        return `${warmup} aquecimento • ${workingSets} válidas × ${reps} reps`;
      } else if (workingSets) {
        return `${warmup} aquecimento • ${workingSets} válidas`;
      }
      return `${warmup} aquecimento`;
    }

    if (workingSets && reps) {
      return `${workingSets} séries × ${reps} reps`;
    } else if (workingSets) {
      return `${workingSets} séries planejadas`;
    } else if (reps) {
      return `${reps} reps planejadas`;
    }
    return null;
  }, [exercise]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card transition-colors ${isExpanded ? "border-primary/35" : "border-border"}`}
    >
      <h3>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={`exercise-sets-${exercise.id}`}
          aria-label={`${isExpanded ? "Recolher" : "Expandir"} séries de ${exercise.exerciseNameSnapshot}`}
          className="flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span
            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold ${sets.length > 0 && completedSetsCount === sets.length ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
          >
            {sets.length > 0 && completedSetsCount === sets.length ? (
              <Check className="size-4" />
            ) : (
              exerciseIndex
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-heading text-sm font-semibold leading-snug text-foreground">
              {exercise.exerciseNameSnapshot}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal leading-relaxed text-muted-foreground">
              {prescriptionText && <span>{prescriptionText}</span>}
              {!!exercise.plannedRestTimeInSeconds &&
                exercise.plannedRestTimeInSeconds > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Zap className="size-3 text-amber-500" />
                    {exercise.plannedRestTimeInSeconds}s
                  </span>
                )}
              {exercise.isUnilateral && (
                <span className="text-primary">Unilateral ×2</span>
              )}
              {exercise.wasSubstituted && (
                <span className="text-amber-500">Substituído</span>
              )}
            </span>
            <span className="flex items-center gap-2 pt-0.5">
              <span
                className="h-1 max-w-20 flex-1 overflow-hidden rounded-full bg-muted"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${sets.length ? (completedSetsCount / sets.length) * 100 : 0}%`,
                  }}
                />
              </span>
              <span
                className={`text-[11px] font-normal ${sets.length > 0 && completedSetsCount === sets.length ? "text-primary" : "text-muted-foreground"}`}
              >
                {sets.length
                  ? `${completedSetsCount}/${sets.length} séries concluídas`
                  : "Nenhuma série"}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      {/* Preserva os rascunhos mesmo quando o exercício está recolhido. */}
      <div id={`exercise-sets-${exercise.id}`} hidden={!isExpanded}>
        <div className="flex flex-col gap-3 border-t border-border/60 px-3.5 pb-3.5 pt-3">
          <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-11 [&_button]:px-3">
            {(() => {
              const has3D =
                getExerciseAnimation(
                  exercise.exerciseId,
                  exercise.exerciseNameSnapshot,
                ) !== null;
              return (
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  title={
                    has3D ? "Ver execução 3D" : "Ver execução do exercício"
                  }
                  aria-label={`Ver execução de ${exercise.exerciseNameSnapshot}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-heading font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                >
                  {has3D ? (
                    <Box className="size-3 text-orange-500" />
                  ) : (
                    <Info className="size-3 text-primary" />
                  )}
                  <span>{has3D ? "Ver 3D" : "Ver execução"}</span>
                </button>
              );
            })()}

            {/* Botão de Substituir (Apenas em treino planejado) */}
            {!isReadOnly && !isFreeWorkout && onSubstituteExercise && (
              <button
                type="button"
                onClick={() => setIsSubstituteModalOpen(true)}
                title="Substituir exercício neste treino"
                aria-label={`Substituir exercício ${exercise.exerciseNameSnapshot}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-heading font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border/80 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="size-3" />
                <span>Substituir</span>
              </button>
            )}

            {/* Botão de Coach IA do Exercício */}
            {!isReadOnly && onOpenAi && (
              <AiFeature capability="chat">
                <button
                  type="button"
                  onClick={onOpenAi}
                  title="Pedir ajuda ao Coach IA para este exercício"
                  aria-label={`Ajuda do Coach IA para ${exercise.exerciseNameSnapshot}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-heading font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3 text-primary" />
                  <span>Coach IA</span>
                </button>
              </AiFeature>
            )}

            {isFreeWorkout && !isReadOnly && onRemoveExercise && (
              <button
                type="button"
                onClick={handleRemoveClick}
                disabled={isRemoving}
                aria-label="Remover exercício"
                className="ml-auto rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {isRemoving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            )}
          </div>
          <PrescriptionTargets
            value={{
              repsMin: exercise.plannedRepsMin,
              repsMax: exercise.plannedRepsMax,
              targetRir: exercise.plannedTargetRir,
              targetLoadInGrams: exercise.plannedTargetLoadInGrams,
              tempo: exercise.plannedTempo,
            }}
            showRange={false}
          />
          {exercise.wasSubstituted && exercise.plannedExerciseNameSnapshot && (
            <p className="text-xs text-amber-500">
              Original planejado: {exercise.plannedExerciseNameSnapshot}
            </p>
          )}
          {exercise.isUnilateral && (
            <p className="text-xs text-muted-foreground">
              Cada série é feita em ambos os lados (volume ×2).
            </p>
          )}
          {exercise.notes && (
            <p className="border-l-2 border-primary/30 pl-3 text-xs text-muted-foreground">
              {exercise.notes}
            </p>
          )}
          {!isReadOnly && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Registrar séries
              </span>
              <div className="flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-semibold">
                {(["reps", "duration"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`min-h-11 rounded-lg px-3 transition-colors ${mode === value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {value === "reps" ? "Reps" : "Tempo"}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Lista de Séries */}
          <div className="flex flex-col gap-2 pt-1 animate-in fade-in duration-200">
            {sets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-6 text-center">
                <Dumbbell className="size-6 text-muted-foreground/40 mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  Nenhuma série registrada ainda.
                </p>
              </div>
            ) : (
              sets.map((set) => (
                <WorkoutSetRow
                  key={set.id}
                  sessionId={sessionId}
                  set={set}
                  mode={mode}
                  isReadOnly={isReadOnly}
                  onUpdateSet={handleUpdateSet}
                  onDeleteSet={handleDeleteSet}
                  onError={onError}
                  onMutationStart={onMutationStart}
                  onMutationEnd={onMutationEnd}
                />
              ))
            )}
          </div>

          {/* Botão + Adicionar Série */}
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSet}
              disabled={isPending}
              className="mt-1 h-11 w-full rounded-xl border-dashed font-heading text-xs font-semibold text-foreground hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin text-primary" />
                  <span>Adicionando série...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-4 text-primary" />
                  <span>Adicionar série</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Excluir Exercício com Séries */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-exercise-title-${exercise.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3
                id={`delete-exercise-title-${exercise.id}`}
                className="font-heading text-lg font-bold text-foreground"
              >
                Remover exercício?
              </h3>
              <p className="text-sm text-muted-foreground">
                Este exercício possui {sets.length}{" "}
                {sets.length === 1 ? "série registrada" : "séries registradas"}.
                Ao remover,{" "}
                {sets.length === 1
                  ? "ela será excluída"
                  : "todas serão excluídas"}{" "}
                permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isRemoving}
                className="rounded-xl font-heading text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="rounded-xl font-heading text-sm font-semibold"
              >
                {isRemoving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Removendo...
                  </span>
                ) : (
                  "Remover"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Execução do Exercício */}
      <ExerciseExecutionDialog
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        exerciseId={exercise.exerciseId}
        exerciseName={exercise.exerciseNameSnapshot}
      />

      {/* Modal de Substituição de Exercício */}
      {isSubstituteModalOpen && onSubstituteExercise && (
        <SubstituteExerciseModal
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          exercise={exercise}
          onSubstitute={(newExerciseId) =>
            onSubstituteExercise(exercise.id, newExerciseId)
          }
        />
      )}
    </div>
  );
}
