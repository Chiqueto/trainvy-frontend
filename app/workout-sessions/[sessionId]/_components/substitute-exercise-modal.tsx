"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  Dumbbell,
  Loader2,
  RotateCcw,
  Search,
  X,
  Zap,
} from "lucide-react";

import type {
  GetWorkoutSession200SessionExercisesItem,
  ListExercises200Item,
} from "@/app/_lib/api/fetch-generated";
import { getMuscleGroupLabel, type MuscleGroup } from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { listExercisesAction } from "../_actions";

interface SubstituteExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: GetWorkoutSession200SessionExercisesItem;
  onSubstitute: (newExerciseId: string) => Promise<void>;
}

export function SubstituteExerciseModal({
  isOpen,
  onClose,
  exercise,
  onSubstitute,
}: SubstituteExerciseModalProps) {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<ListExercises200Item[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmittingTransition] = useTransition();

  // Carrega exercícios do catálogo com debounce
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoadingCatalog(true);
      const res = await listExercisesAction(query.trim() || undefined);
      if (isMounted) {
        setIsLoadingCatalog(false);
        if (res.success) {
          setExercises(res.data);
        } else {
          setErrorMessage(res.error);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleClose = () => {
    setQuery("");
    setErrorMessage(null);
    onClose();
  };

  const handleSelect = (newExerciseId: string) => {
    if (isSubmitting) return;
    setErrorMessage(null);
    startSubmittingTransition(async () => {
      try {
        await onSubstitute(newExerciseId);
        handleClose();
      } catch (err: unknown) {
        setErrorMessage(
          (err as Error)?.message || "Erro ao substituir exercício",
        );
      }
    });
  };

  // Filtra o exercício já selecionado atualmente
  const filteredCatalog = exercises.filter(
    (ex) => ex.id !== exercise.exerciseId,
  );

  const hasAlternative1 =
    !!exercise.alternative1ExerciseId &&
    exercise.alternative1ExerciseId !== exercise.exerciseId;
  const hasAlternative2 =
    !!exercise.alternative2ExerciseId &&
    exercise.alternative2ExerciseId !== exercise.exerciseId;
  const hasFixedAlternatives = hasAlternative1 || hasAlternative2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="substitute-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ArrowRightLeft className="size-4" />
            </div>
            <div className="flex flex-col">
              <h2
                id="substitute-modal-title"
                className="font-heading text-lg font-bold text-foreground leading-tight"
              >
                Substituir Exercício
              </h2>
              <p className="font-heading text-xs text-muted-foreground">
                Atual:{" "}
                <span className="font-semibold text-foreground">
                  {exercise.exerciseNameSnapshot}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-heading text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Banner de Reversão (quando já está substituído) */}
        {exercise.wasSubstituted && exercise.plannedExerciseId && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-[11px] font-bold uppercase tracking-wider text-amber-500">
                Exercício Substituído
              </span>
              <p className="font-heading text-xs text-foreground">
                Planejado original:{" "}
                <span className="font-semibold">
                  {exercise.plannedExerciseNameSnapshot || "Original"}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSelect(exercise.plannedExerciseId!)}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 font-heading text-xs h-8 gap-1.5 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Restaurar Original
            </Button>
          </div>
        )}

        {/* ================= SEÇÃO: ALTERNATIVAS DO PLANO ================= */}
        {hasFixedAlternatives && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Zap className="size-3.5 text-primary" />
              <span>Alternativas do Plano (1 toque)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hasAlternative1 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelect(exercise.alternative1ExerciseId!)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-3 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-[10px] font-bold text-primary uppercase tracking-wide">
                      Alternativa 1
                    </span>
                    <span className="font-heading text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {exercise.alternative1ExerciseNameSnapshot ||
                        "Exercício alternativo 1"}
                    </span>
                  </div>
                  <ArrowRightLeft className="size-4 text-primary shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {hasAlternative2 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelect(exercise.alternative2ExerciseId!)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-3 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-[10px] font-bold text-primary uppercase tracking-wide">
                      Alternativa 2
                    </span>
                    <span className="font-heading text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {exercise.alternative2ExerciseNameSnapshot ||
                        "Exercício alternativo 2"}
                    </span>
                  </div>
                  <ArrowRightLeft className="size-4 text-primary shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= SEÇÃO: CATÁLOGO GERAL ================= */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Dumbbell className="size-3.5 text-muted-foreground" />
            <span>
              {hasFixedAlternatives
                ? "Ou Escolher do Catálogo"
                : "Escolher Exercício do Catálogo"}
            </span>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome do exercício..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8 font-heading text-sm h-10 rounded-xl"
              autoFocus={!hasFixedAlternatives}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Lista de Exercícios */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-56 sm:max-h-64 pr-1">
            {isLoadingCatalog ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="font-heading text-xs">
                  Carregando catálogo...
                </span>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-1 text-muted-foreground">
                <Dumbbell className="size-8 stroke-1 text-muted-foreground/40" />
                <span className="font-heading text-sm font-semibold">
                  Nenhum exercício encontrado
                </span>
                <span className="font-heading text-xs text-muted-foreground/70">
                  Tente buscar por outro termo
                </span>
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const primaryMuscle = item.muscles?.find(
                  (m) => m.role === "PRIMARY",
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelect(item.id)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 hover:border-primary/30 p-2.5 transition-all text-left cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-heading text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      {primaryMuscle && (
                        <span className="font-heading text-[11px] text-muted-foreground">
                          {getMuscleGroupLabel(
                            primaryMuscle.muscleGroup as MuscleGroup,
                          )}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="size-8 p-0 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 shrink-0"
                    >
                      <ArrowRightLeft className="size-4" />
                    </Button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="pt-2 border-t border-border/40 text-[11px] font-heading text-muted-foreground/80 flex items-center justify-between">
          <span>* A substituição afeta apenas esta sessão ativa.</span>
          {isSubmitting && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Loader2 className="size-3 animate-spin" />
              Substituindo...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
