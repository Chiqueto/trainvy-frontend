"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRightLeft, ChevronDown, Dumbbell, Info, Loader2, Plus, Trash2, Zap } from "lucide-react";

import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";
import type {
  GetWorkoutSession200SessionExercisesItem,
  GetWorkoutSession200SessionExercisesItemSetsItem,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

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
  onSubstituteExercise?: (sessionExerciseId: string, newExerciseId: string) => Promise<void>;
  onError: (errorMsg: string) => void;
  onMutationStart?: () => void;
  onMutationEnd?: () => void;
}

export function SessionExerciseCard({
  sessionId = "",
  exercise,
  isReadOnly,
  isFreeWorkout = false,
  onRemoveExercise,
  onSubstituteExercise,
  onError,
  onMutationStart,
  onMutationEnd,
}: SessionExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  // Inicializa a lista local de séries
  const [sets, setSets] = useState<
    GetWorkoutSession200SessionExercisesItemSetsItem[]
  >(() => [...exercise.sets].sort((a, b) => a.order - b.order));

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

          setSets((prev) => [...prev, newSet].sort((a, b) => a.order - b.order));
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
    const reps = exercise.plannedReps;

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
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header do Exercício */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-[11px] font-bold text-primary">
              {exercise.order}
            </span>
            <h3 className="font-heading text-base font-bold text-foreground">
              {exercise.exerciseNameSnapshot}
            </h3>

            {/* Badge de Substituído */}
            {exercise.wasSubstituted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-heading font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                Substituído
              </span>
            )}

            {/* Badge de Unilateral */}
            {exercise.isUnilateral && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-heading font-semibold text-primary bg-primary/10 border border-primary/20">
                Unilateral (×2)
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsMediaOpen(true)}
              title="Ver execução do exercício"
              aria-label={`Ver execução de ${exercise.exerciseNameSnapshot}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-heading font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
            >
              <Info className="size-3 text-primary" />
              <span>Ver execução</span>
            </button>

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
          </div>

          {/* Subtítulo de exercício original se foi substituído */}
          {exercise.wasSubstituted && exercise.plannedExerciseNameSnapshot && (
            <p className="font-heading text-xs text-amber-500/90 pl-7 flex items-center gap-1">
              <span className="font-medium">Original planejado:</span>{" "}
              {exercise.plannedExerciseNameSnapshot}
            </p>
          )}

          {prescriptionText && (
            <p className="font-heading text-xs text-muted-foreground pl-7">
              <span className="font-medium text-foreground/80">Planejado:</span> {prescriptionText}
            </p>
          )}

          {exercise.isUnilateral && (
            <p className="font-heading text-[11px] text-primary/80 pl-7">
              Unilateral: cada série é feita em ambos os lados (volume ×2)
            </p>
          )}

          {exercise.plannedRestTimeInSeconds !== null &&
            exercise.plannedRestTimeInSeconds > 0 && (
              <p className="flex items-center gap-1 font-heading text-[11px] text-muted-foreground/80 pl-7">
                <Zap className="size-3 text-amber-500" />
                Descanso: {exercise.plannedRestTimeInSeconds}s
              </p>
            )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Seletor de Modo: Reps vs Tempo (habilitado apenas se editável e expandido) */}
          {!isReadOnly && isExpanded && (
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-[11px] font-heading font-semibold">
              <button
                type="button"
                onClick={() => setMode("reps")}
                className={`rounded-md px-2 py-1 transition-colors ${
                  mode === "reps"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reps
              </button>
              <button
                type="button"
                onClick={() => setMode("duration")}
                className={`rounded-md px-2 py-1 transition-colors ${
                  mode === "duration"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tempo
              </button>
            </div>
          )}

          {/* Botão de Excluir Exercício (Apenas em treino avulso aberto) */}
          {isFreeWorkout && !isReadOnly && onRemoveExercise && (
            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={isRemoving}
              title="Remover exercício"
              aria-label="Remover exercício"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              {isRemoving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          )}

          {/* Botão de Expandir / Recolher Séries */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Recolher séries" : "Expandir séries"}
            aria-expanded={isExpanded}
            className="flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all active:scale-95"
          >
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {exercise.notes && (
        <p className="text-xs text-muted-foreground italic pl-7 border-l-2 border-border/60">
          {exercise.notes}
        </p>
      )}

      {/* Resumo compacto quando recolhido */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsExpanded(true);
          }}
          className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/20 px-3.5 py-2.5 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-semibold text-foreground">
              {sets.length === 0
                ? "Nenhuma série"
                : `${sets.length} ${sets.length === 1 ? "série" : "séries"}`}
            </span>
            {sets.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 font-heading text-[10px] font-bold ${
                  completedSetsCount === sets.length
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {completedSetsCount}/{sets.length} concluídas
              </span>
            )}
          </div>
          <span className="font-heading text-xs font-semibold text-primary">
            Toque para expandir
          </span>
        </div>
      )}

      {/* Conteúdo Expansível: Séries e Ações */}
      {isExpanded && (
        <>
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
              <Plus className="mr-1.5 size-4 text-primary" />
              <span>Adicionar série</span>
            </Button>
          )}
        </>
      )}

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
                {sets.length === 1 ? "série registrada" : "séries registradas"}. Ao
                remover, {sets.length === 1 ? "ela será excluída" : "todas serão excluídas"} permanentemente.
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
