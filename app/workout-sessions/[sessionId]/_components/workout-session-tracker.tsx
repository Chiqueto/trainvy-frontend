"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Dumbbell,
  Loader2,
  Plus,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import dayjs from "dayjs";

import type {
  GetWorkoutSession200,
  GetWorkoutSession200SessionExercisesItem,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  addExerciseToWorkoutSessionAction,
  cancelWorkoutSessionAction,
  completeWorkoutSessionAction,
  removeExerciseFromWorkoutSessionAction,
  substituteSessionExerciseAction,
} from "../_actions";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import { ExerciseSelectorModal } from "./exercise-selector-modal";
import { SessionAiAssistantDrawer } from "./session-ai-assistant-drawer";
import { SessionExerciseCard } from "./session-exercise-card";

interface WorkoutSessionTrackerProps {
  session: GetWorkoutSession200;
}

export function WorkoutSessionTracker({ session }: WorkoutSessionTrackerProps) {
  // Prefetch and sync the exercise catalog in background so search is instant when opening modals
  useExerciseCatalog({ autoSync: true });

  const router = useRouter();
  const [sessionData, setSessionData] = useState(() => session);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPendingSetsModal, setShowPendingSetsModal] = useState(false);
  const [pendingSetsMessage, setPendingSetsMessage] = useState<string | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [pendingMutationsCount, setPendingMutationsCount] = useState(0);

  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);
  const [focusedExerciseName, setFocusedExerciseName] = useState<string | null>(null);

  const handleOpenAiDrawer = useCallback(
    (exerciseId?: string, exerciseName?: string) => {
      setFocusedExerciseId(exerciseId ?? null);
      setFocusedExerciseName(exerciseName ?? null);
      setShowAiDrawer(true);
    },
    [],
  );

  const handleSetsConfirmedFromAi = useCallback(
    (createdSets: any[], sessionExerciseId: string) => {
      setSessionData((prev) => ({
        ...prev,
        sessionExercises: prev.sessionExercises.map((ex) =>
          ex.id === sessionExerciseId
            ? {
                ...ex,
                sets: [
                  ...ex.sets,
                  ...createdSets.map((s: any) => ({
                    id: s.id,
                    order: s.order,
                    type: s.type,
                    weightInGrams: s.weightInGrams,
                    reps: s.reps,
                    rir: s.rir,
                    durationInSeconds: s.durationInSeconds,
                    notes: s.notes,
                    completedAt: s.completedAt,
                    exerciseId: s.exerciseId ?? ex.exerciseId,
                    exerciseNameSnapshot:
                      s.exerciseNameSnapshot ?? ex.exerciseNameSnapshot,
                    proposalId: s.proposalId,
                  })),
                ],
              }
            : ex,
        ),
      }));
      router.refresh();
    },
    [router],
  );

  const [isFinishing, startFinishTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();

  const handleMutationStart = useCallback(() => {
    setPendingMutationsCount((c) => c + 1);
  }, []);

  const handleMutationEnd = useCallback(() => {
    setPendingMutationsCount((c) => Math.max(0, c - 1));
  }, []);

  // Escuta alteração de visibilidade (ex: app em background ou tela desligada)
  // para disparar blur e persistir qualquer valor digitado antes do congelamento
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (
          document.activeElement instanceof HTMLElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA")
        ) {
          document.activeElement.blur();
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingMutationsCount > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingMutationsCount]);

  const isReadOnly = !!sessionData.completedAt;
  const isFreeWorkout = sessionData.workoutDayId === null;
  const startedAtFormatted = dayjs(sessionData.startedAt).format(
    "DD/MM/YYYY [às] HH:mm",
  );
  const completedAtFormatted = sessionData.completedAt
    ? dayjs(sessionData.completedAt).format("DD/MM/YYYY [às] HH:mm")
    : null;

  const exercises = [...sessionData.sessionExercises].sort(
    (a, b) => a.order - b.order,
  );

  const handleAddExercise = async (exerciseId: string) => {
    handleMutationStart();
    try {
      const res = await addExerciseToWorkoutSessionAction(
        sessionData.id,
        exerciseId,
      );
      if (!res.success) {
        toast.error(res.error);
        throw new Error(res.error);
      } else {
        const newExercise: GetWorkoutSession200SessionExercisesItem = {
          id: res.data.id,
          exerciseId: res.data.exerciseId ?? exerciseId,
          hasMedia: res.data.hasMedia ?? false,
          plannedWarmupSets: res.data.plannedWarmupSets ?? null,
          exerciseNameSnapshot: res.data.exerciseNameSnapshot,
          order: res.data.order,
          revision: (res.data as any).revision ?? 0,
          plannedExerciseId:
            (res.data as any).plannedExerciseId ?? res.data.exerciseId ?? exerciseId,
          plannedExerciseNameSnapshot:
            (res.data as any).plannedExerciseNameSnapshot ??
            res.data.exerciseNameSnapshot,
          alternative1ExerciseId:
            (res.data as any).alternative1ExerciseId ?? null,
          alternative1ExerciseNameSnapshot:
            (res.data as any).alternative1ExerciseNameSnapshot ?? null,
          alternative2ExerciseId:
            (res.data as any).alternative2ExerciseId ?? null,
          alternative2ExerciseNameSnapshot:
            (res.data as any).alternative2ExerciseNameSnapshot ?? null,
          wasSubstituted: (res.data as any).wasSubstituted ?? false,
          substitutedAt: (res.data as any).substitutedAt ?? null,
          plannedSets: res.data.plannedSets,
          plannedReps: res.data.plannedReps,
          plannedRestTimeInSeconds: res.data.plannedRestTimeInSeconds,
          notes: res.data.notes,
          sets: res.data.sets ?? [],
        };
        setSessionData((prev) => ({
          ...prev,
          sessionExercises: [...prev.sessionExercises, newExercise],
        }));
      }
    } finally {
      handleMutationEnd();
    }
  };

  const handleRemoveExercise = async (sessionExerciseId: string) => {
    handleMutationStart();
    try {
      const res = await removeExerciseFromWorkoutSessionAction(
        sessionData.id,
        sessionExerciseId,
      );
      if (!res.success) {
        toast.error(res.error);
        throw new Error(res.error);
      } else {
        setSessionData((prev) => ({
          ...prev,
          sessionExercises: prev.sessionExercises.filter(
            (e) => e.id !== sessionExerciseId,
          ),
        }));
      }
    } finally {
      handleMutationEnd();
    }
  };

  const handleSubstituteExercise = async (
    sessionExerciseId: string,
    newExerciseId: string,
  ) => {
    handleMutationStart();
    try {
      const res = await substituteSessionExerciseAction(
        sessionData.id,
        sessionExerciseId,
        newExerciseId,
      );
      if (!res.success) {
        toast.error(res.error);
        throw new Error(res.error);
      } else {
        setSessionData((prev) => ({
          ...prev,
          sessionExercises: prev.sessionExercises.map((ex) =>
            ex.id === sessionExerciseId
              ? {
                  ...ex,
                  exerciseId: res.data.exerciseId ?? newExerciseId,
                  exerciseNameSnapshot: res.data.exerciseNameSnapshot,
                  plannedExerciseId:
                    res.data.plannedExerciseId ?? ex.plannedExerciseId,
                  plannedExerciseNameSnapshot:
                    res.data.plannedExerciseNameSnapshot ??
                    ex.plannedExerciseNameSnapshot,
                  wasSubstituted: res.data.wasSubstituted,
                  substitutedAt: res.data.substitutedAt ?? null,
                  hasMedia: res.data.hasMedia ?? ex.hasMedia,
                  alternative1ExerciseId:
                    res.data.alternative1ExerciseId ?? ex.alternative1ExerciseId,
                  alternative1ExerciseNameSnapshot:
                    res.data.alternative1ExerciseNameSnapshot ??
                    ex.alternative1ExerciseNameSnapshot,
                  alternative2ExerciseId:
                    res.data.alternative2ExerciseId ?? ex.alternative2ExerciseId,
                  alternative2ExerciseNameSnapshot:
                    res.data.alternative2ExerciseNameSnapshot ??
                    ex.alternative2ExerciseNameSnapshot,
                }
              : ex,
          ),
        }));
      }
    } finally {
      handleMutationEnd();
    }
  };

  const handleOpenFinishModal = () => {
    if (isReadOnly || isFinishing || isCancelling || pendingMutationsCount > 0) return;

    // Dispara blur no elemento atualmente em foco para acionar persistência do draft
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }

    setShowConfirmModal(true);
  };

  const handleConfirmFinish = (forceComplete = false) => {
    if (isReadOnly || isFinishing || pendingMutationsCount > 0) return;

    startFinishTransition(async () => {
      const res = await completeWorkoutSessionAction(
        sessionData.id,
        forceComplete ? { forceComplete: true } : undefined,
      );
      if (!res.success) {
        setShowConfirmModal(false);
        if (res.code === "PENDING_WORKOUT_SETS") {
          setPendingSetsMessage(res.error);
          setShowPendingSetsModal(true);
        } else {
          toast.error(res.error);
        }
      } else {
        setSessionData((prev) => ({
          ...prev,
          completedAt: res.data.completedAt,
        }));
        setShowConfirmModal(false);
        setShowPendingSetsModal(false);
        toast.success("Treino concluído com sucesso!");
        router.push(`/workout-sessions/${sessionData.id}/summary`);
      }
    });
  };

  const handleConfirmCancel = () => {
    if (isReadOnly || isCancelling || isFinishing || pendingMutationsCount > 0) return;

    startCancelTransition(async () => {
      const res = await cancelWorkoutSessionAction(sessionData.id);
      if (!res.success) {
        toast.error(res.error);
        setShowCancelModal(false);
      } else {
        setShowCancelModal(false);
        toast.success("Treino cancelado.");
        router.push("/");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 p-5">


      {/* Banner de Conclusão / Acesso à Tela Bonitinha */}
      {isReadOnly && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-card p-4 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-sm font-semibold text-foreground">
              Treino concluído! 🎉
            </span>
            <span className="text-xs text-muted-foreground">
              Veja suas estatísticas e o próximo treino na tela de conclusão.
            </span>
          </div>
          <Link
            href={`/workout-sessions/${sessionData.id}/summary`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-heading text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <span>Ver Resumo</span>
            <Trophy className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Card de Informações e Status da Sessão */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFreeWorkout ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-heading text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                Treino avulso
              </span>
            ) : (
              <span className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ID #{sessionData.id.slice(0, 8)}
              </span>
            )}
          </div>

          {isReadOnly ? (
            <Link
              href={`/workout-sessions/${sessionData.id}/summary`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 font-heading text-xs font-semibold text-primary transition hover:bg-primary/25"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Concluído • Ver Resumo</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              {pendingMutationsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground animate-in fade-in">
                  <Loader2 className="size-3 animate-spin text-primary" />
                  Salvando...
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenAiDrawer()}
                className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 font-heading text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/50 cursor-pointer"
              >
                <Sparkles className="mr-1.5 size-3.5 text-primary" />
                <span>Coach IA</span>
              </Button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-heading text-xs font-semibold text-primary">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Em Andamento
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>Iniciado em: {startedAtFormatted}</span>
          </div>

          {completedAtFormatted && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" />
              <span>Finalizado em: {completedAtFormatted}</span>
            </div>
          )}
        </div>

        {isReadOnly && (
          <div className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
            Esta sessão foi finalizada e os registros estão em modo somente leitura.
          </div>
        )}
      </div>

      {/* Seção de Exercícios */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Dumbbell className="size-5 text-primary" />
            Exercícios ({exercises.length})
          </h2>

          {isFreeWorkout && !isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExerciseSelector(true)}
              className="rounded-xl border-dashed font-heading text-xs font-semibold hover:border-primary/50 hover:bg-primary/5"
            >
              <Plus className="mr-1.5 size-3.5 text-primary" />
              Adicionar exercício
            </Button>
          )}
        </div>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
            <Dumbbell className="size-8 text-muted-foreground/60 mb-2" />
            <p className="font-heading text-sm font-semibold text-foreground">
              {isFreeWorkout ? "Nenhum exercício adicionado" : "Dia de descanso"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isFreeWorkout
                ? "Adicione exercícios para começar seu treino avulso."
                : "Não há exercícios prescritos para esta sessão."}
            </p>
            {isFreeWorkout && !isReadOnly && (
              <Button
                type="button"
                onClick={() => setShowExerciseSelector(true)}
                className="mt-4 rounded-full px-5 py-2 font-heading text-xs font-semibold"
              >
                <Plus className="mr-1.5 size-3.5" />
                Adicionar exercício
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {exercises.map((exercise) => (
              <SessionExerciseCard
                key={exercise.id}
                sessionId={sessionData.id}
                exercise={exercise}
                isReadOnly={isReadOnly}
                isFreeWorkout={isFreeWorkout}
                onRemoveExercise={handleRemoveExercise}
                onSubstituteExercise={handleSubstituteExercise}
                onOpenAi={() =>
                  handleOpenAiDrawer(
                    exercise.id,
                    exercise.exerciseNameSnapshot,
                  )
                }
                onError={(msg) => toast.error(msg)}
                onMutationStart={handleMutationStart}
                onMutationEnd={handleMutationEnd}
              />
            ))}

            {isFreeWorkout && !isReadOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExerciseSelector(true)}
                className="h-11 w-full rounded-2xl border-dashed font-heading text-xs font-semibold hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
              >
                <Plus className="mr-1.5 size-4 text-primary" />
                Adicionar exercício
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ação Principal: Botão Finalizar Treino & Cancelar Treino (apenas enquanto ativa) */}
      {!isReadOnly && (
        <div className="mt-2 flex flex-col gap-2.5">
          <Button
            type="button"
            size="lg"
            disabled={isFinishing || isCancelling || pendingMutationsCount > 0}
            onClick={handleOpenFinishModal}
            className="w-full rounded-2xl py-6 font-heading text-base font-bold shadow-md active:scale-[0.99]"
          >
            {isFinishing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Finalizando treino...
              </span>
            ) : pendingMutationsCount > 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Salvando alterações...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                Finalizar treino
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={isFinishing || isCancelling || pendingMutationsCount > 0}
            onClick={() => setShowCancelModal(true)}
            className="w-full text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.99]"
          >
            <X className="mr-1.5 size-3.5" />
            Cancelar treino
          </Button>
        </div>
      )}

      {/* Modal de Confirmação de Conclusão */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-modal-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-4 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pb-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3
                id="finish-modal-title"
                className="font-heading text-lg font-bold text-foreground"
              >
                Finalizar treino?
              </h3>
              <p className="text-sm text-muted-foreground">
                Depois disso, esta sessão ficará somente para leitura.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isFinishing}
                className="rounded-xl font-heading text-sm"
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={() => handleConfirmFinish(false)}
                disabled={isFinishing || pendingMutationsCount > 0}
                className="rounded-xl font-heading text-sm font-semibold"
              >
                {isFinishing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Finalizando...
                  </span>
                ) : (
                  "Finalizar treino"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Séries Pendentes */}
      {showPendingSetsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-sets-modal-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowPendingSetsModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-amber-500/30 bg-card p-6 shadow-2xl flex flex-col gap-4 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pb-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <AlertCircle className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3
                  id="pending-sets-modal-title"
                  className="font-heading text-lg font-bold text-foreground"
                >
                  Séries pendentes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pendingSetsMessage ||
                    "Existem séries não concluídas nesta sessão. Deseja finalizá-las e concluir o treino?"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPendingSetsModal(false)}
                disabled={isFinishing}
                className="rounded-xl font-heading text-sm"
              >
                OK
              </Button>
              <Button
                type="button"
                onClick={() => handleConfirmFinish(true)}
                disabled={isFinishing || pendingMutationsCount > 0}
                className="rounded-xl font-heading text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isFinishing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Finalizando...
                  </span>
                ) : (
                  "Finalizar todas e concluir o treino"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Treino */}
      {showCancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-destructive/20 bg-card p-6 shadow-2xl flex flex-col gap-4 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pb-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1">
                <AlertCircle className="size-5" />
              </div>
              <h3
                id="cancel-modal-title"
                className="font-heading text-lg font-bold text-foreground"
              >
                Cancelar este treino?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Esta sessão será descartada e excluída permanentemente. Nenhuma série registrada será salva no histórico.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="rounded-xl font-heading text-sm"
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="rounded-xl font-heading text-sm font-semibold"
              >
                {isCancelling ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Cancelando...
                  </span>
                ) : (
                  "Sim, cancelar treino"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Exercícios */}
      <ExerciseSelectorModal
        isOpen={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleAddExercise}
      />

      {/* Drawer do Assistente de Treino IA */}
      <SessionAiAssistantDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        sessionId={sessionData.id}
        selectedExerciseId={focusedExerciseId}
        selectedExerciseName={focusedExerciseName}
        onSetsConfirmed={handleSetsConfirmedFromAi}
      />
    </div>
  );
}

