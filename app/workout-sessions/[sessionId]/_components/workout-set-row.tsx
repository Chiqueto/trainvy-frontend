"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import dayjs from "dayjs";

import type { GetWorkoutSession200SessionExercisesItemSetsItem } from "@/app/_lib/api/fetch-generated";
import { gramsToKgString, kgToGrams } from "@/app/_lib/weight";
import { Button } from "@/components/ui/button";

import {
  deleteWorkoutSetAction,
  updateWorkoutSetAction,
} from "../_actions";

interface WorkoutSetRowProps {
  sessionId: string;
  set: GetWorkoutSession200SessionExercisesItemSetsItem;
  mode: "reps" | "duration";
  isReadOnly: boolean;
  onUpdateSet: (
    updated: GetWorkoutSession200SessionExercisesItemSetsItem,
  ) => void;
  onDeleteSet: (setId: string) => void;
  onError: (errorMsg: string) => void;
  onMutationStart?: () => void;
  onMutationEnd?: () => void;
}

export function WorkoutSetRow({
  sessionId,
  set,
  mode,
  isReadOnly,
  onUpdateSet,
  onDeleteSet,
  onError,
  onMutationStart,
  onMutationEnd,
}: WorkoutSetRowProps) {
  const [weightText, setWeightText] = useState(() =>
    gramsToKgString(set.weightInGrams),
  );
  const [repsText, setRepsText] = useState(() =>
    set.reps !== null && set.reps !== undefined ? set.reps.toString() : "",
  );
  const [rirText, setRirText] = useState(() =>
    set.rir !== null && set.rir !== undefined ? set.rir.toString() : "",
  );
  const [durationText, setDurationText] = useState(() =>
    set.durationInSeconds !== null && set.durationInSeconds !== undefined
      ? set.durationInSeconds.toString()
      : "",
  );
  const [setType, setSetType] = useState<"WARMUP" | "WORKING">(
    set.type === "WARMUP" ? "WARMUP" : "WORKING",
  );
  const [isCompleted, setIsCompleted] = useState(() => !!set.completedAt);
  const [completedAt, setCompletedAt] = useState<string | null>(
    () => set.completedAt,
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Parse current inputs
  const parseCurrentData = () => {
    const weightInGrams = kgToGrams(weightText);
    const parsedReps =
      repsText.trim() === "" ? null : parseInt(repsText.trim(), 10);
    const parsedRir =
      rirText.trim() === "" ? null : parseInt(rirText.trim(), 10);
    const parsedDuration =
      durationText.trim() === "" ? null : parseInt(durationText.trim(), 10);

    return {
      weightInGrams,
      reps: parsedReps !== null && !isNaN(parsedReps) ? parsedReps : null,
      rir: parsedRir !== null && !isNaN(parsedRir) ? parsedRir : null,
      durationInSeconds:
        parsedDuration !== null && !isNaN(parsedDuration)
          ? parsedDuration
          : null,
      type: setType,
    };
  };

  // Salvar no blur se houver alteração
  const handleBlur = () => {
    if (isReadOnly) return;

    const data = parseCurrentData();

    // Evita mutação redundante e delay visual se nenhum dado foi alterado
    const hasChanged =
      data.weightInGrams !== (set.weightInGrams ?? null) ||
      data.reps !== (set.reps ?? null) ||
      data.rir !== (set.rir ?? null) ||
      data.durationInSeconds !== (set.durationInSeconds ?? null) ||
      data.type !== set.type;

    if (!hasChanged) return;

    onMutationStart?.();
    startTransition(async () => {
      try {
        const res = await updateWorkoutSetAction(sessionId, set.id, {
          type: data.type,
          weightInGrams: data.weightInGrams,
          reps: data.reps,
          rir: data.rir,
          durationInSeconds: data.durationInSeconds,
        });

        if (!res.success) {
          onError(res.error);
        } else {
          onUpdateSet({
            ...set,
            ...data,
            completedAt: res.data.completedAt,
          });
        }
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Alternar entre WARMUP e WORKING
  const handleToggleType = () => {
    if (isReadOnly) return;

    const nextType = setType === "WORKING" ? "WARMUP" : "WORKING";
    setSetType(nextType);

    onMutationStart?.();
    startTransition(async () => {
      try {
        const res = await updateWorkoutSetAction(sessionId, set.id, {
          type: nextType,
        });

        if (!res.success) {
          // Reverte estado local se falhar
          setSetType(setType);
          onError(res.error);
        } else {
          onUpdateSet({
            ...set,
            type: nextType,
          });
        }
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Concluir ou Desfazer conclusão
  const handleToggleComplete = () => {
    if (isReadOnly) return;

    // Se já estiver concluída -> desfazer
    if (isCompleted) {
      onMutationStart?.();
      startTransition(async () => {
        try {
          const res = await updateWorkoutSetAction(sessionId, set.id, {
            completed: false,
          });

          if (!res.success) {
            onError(res.error);
          } else {
            setIsCompleted(false);
            setCompletedAt(null);
            onUpdateSet({
              ...set,
              completedAt: null,
            });
          }
        } finally {
          onMutationEnd?.();
        }
      });
      return;
    }

    // Se não estiver concluída -> validar requisitos (reps ou duration)
    const data = parseCurrentData();
    const hasReps = data.reps !== null && data.reps !== undefined;
    const hasDuration =
      data.durationInSeconds !== null && data.durationInSeconds !== undefined;

    if (!hasReps && !hasDuration) {
      onError("Informe as repetições ou a duração para concluir a série.");
      return;
    }

    onMutationStart?.();
    startTransition(async () => {
      try {
        const res = await updateWorkoutSetAction(sessionId, set.id, {
          type: data.type,
          weightInGrams: data.weightInGrams,
          reps: data.reps,
          rir: data.rir,
          durationInSeconds: data.durationInSeconds,
          completed: true,
        });

        if (!res.success) {
          onError(res.error);
        } else {
          setIsCompleted(true);
          setCompletedAt(res.data.completedAt);
          onUpdateSet({
            ...set,
            ...data,
            completedAt: res.data.completedAt,
          });
        }
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Excluir série com confirmação
  const handleInitiateDelete = () => {
    if (isReadOnly || isPending) return;
    setIsConfirmingDelete(true);
  };

  const handleExecuteDelete = () => {
    if (isReadOnly || isPending) return;

    onMutationStart?.();
    startTransition(async () => {
      try {
        const res = await deleteWorkoutSetAction(sessionId, set.id);
        if (!res.success) {
          onError(res.error);
          setIsConfirmingDelete(false);
        } else {
          onDeleteSet(set.id);
        }
      } finally {
        onMutationEnd?.();
      }
    });
  };

  // Renderização em modo Somente Leitura (read-only / sessão concluída)
  if (isReadOnly) {
    const isWarmup = set.type === "WARMUP";
    const loadFormatted =
      set.weightInGrams !== null && set.weightInGrams !== undefined
        ? `${set.weightInGrams / 1000} kg`
        : "Peso corporal";

    return (
      <div
        className={`flex items-center justify-between rounded-xl border p-3 ${
          set.completedAt
            ? "border-primary/20 bg-primary/5"
            : "border-border bg-background"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-bold text-foreground">
            #{set.order}
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 font-heading text-[10px] font-semibold uppercase ${
                  isWarmup
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {isWarmup ? "Aquecimento" : "Trabalho"}
              </span>

              <span className="font-heading text-xs font-semibold text-foreground">
                {loadFormatted}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {set.reps !== null && <span>{set.reps} reps</span>}
              {set.rir !== null && <span>• RIR {set.rir}</span>}
              {set.durationInSeconds !== null && (
                <span>• {set.durationInSeconds}s</span>
              )}
              {set.notes && (
                <span className="italic">({set.notes})</span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {set.completedAt ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Check className="size-4" />
              <span>{dayjs(set.completedAt).format("HH:mm")}</span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground">
              Pendente
            </span>
          )}
        </div>
      </div>
    );
  }

  // Renderização Interativa Mobile-First
  const isWarmup = setType === "WARMUP";

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-2.5 transition-all ${
        isCompleted
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Set Order & Type Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-bold text-muted-foreground w-6 text-center">
            #{set.order}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              disabled={isPending}
              aria-checked={isWarmup}
              onClick={handleToggleType}
              title={isWarmup ? "Série de aquecimento (clique para alternar)" : "Série de trabalho (clique para alternar)"}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isPending ? "opacity-60 cursor-not-allowed" : ""
              } ${isWarmup ? "bg-amber-500" : "bg-muted-foreground/30"}`}
            >
              <span
                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  isWarmup ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              onClick={isPending ? undefined : handleToggleType}
              className={`cursor-pointer font-heading text-[11px] font-semibold select-none transition-colors ${
                isWarmup ? "text-amber-500 font-bold" : "text-muted-foreground"
              }`}
            >
              {isWarmup ? "Aquecimento" : "Trabalho"}
            </span>
          </div>
        </div>

        {/* Delete & Complete Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-1.5 py-0.5 animate-in fade-in">
              <span className="font-heading text-[10px] font-semibold text-destructive">
                Excluir?
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleExecuteDelete}
                disabled={isPending}
                className="h-6 px-2 font-heading text-[11px] font-bold rounded-md"
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Sim"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isPending}
                className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
              >
                Não
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={handleInitiateDelete}
              className="size-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
              title="Remover série"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remover</span>
            </Button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleComplete}
            aria-label={isCompleted ? "Desfazer conclusão" : "Concluir série"}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-all ${
              isPending
                ? "opacity-75 cursor-not-allowed"
                : "cursor-pointer active:scale-95"
            } ${
              isCompleted
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border/80 bg-background text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Check className={`size-5 ${isCompleted ? "stroke-[3]" : "stroke-2"}`} />
            )}
          </button>
        </div>
      </div>

      {/* Inputs Grid — Big touch targets (min 44px), centered, numeric */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Carga (Kg) */}
        <div className="flex flex-col gap-1">
          <span className="font-heading text-[10px] uppercase font-semibold text-muted-foreground text-center">
            Carga (kg)
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={weightText}
            onChange={(e) => setWeightText(e.target.value)}
            onBlur={handleBlur}
            className="h-11 w-full rounded-lg border border-input bg-background px-2 text-center font-heading text-base font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Reps ou Tempo (conforme modo) */}
        {mode === "reps" ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-heading text-[10px] uppercase font-semibold text-muted-foreground text-center">
                Reps
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={repsText}
                onChange={(e) => setRepsText(e.target.value)}
                onBlur={handleBlur}
                className="h-11 w-full rounded-lg border border-input bg-background px-2 text-center font-heading text-base font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-heading text-[10px] uppercase font-semibold text-muted-foreground text-center">
                RIR
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="—"
                value={rirText}
                onChange={(e) => setRirText(e.target.value)}
                onBlur={handleBlur}
                className="h-11 w-full rounded-lg border border-input bg-background px-2 text-center font-heading text-base font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        ) : (
          <div className="col-span-2 flex flex-col gap-1">
            <span className="font-heading text-[10px] uppercase font-semibold text-muted-foreground text-center">
              Duração (segundos)
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 45"
              value={durationText}
              onChange={(e) => setDurationText(e.target.value)}
              onBlur={handleBlur}
              className="h-11 w-full rounded-lg border border-input bg-background px-2 text-center font-heading text-base font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {isCompleted && completedAt && (
        <div className="flex items-center justify-end px-1 pt-0.5">
          <span className="text-[10px] text-primary/80 font-medium">
            Concluída às {dayjs(completedAt).format("HH:mm")}
          </span>
        </div>
      )}
    </div>
  );
}
