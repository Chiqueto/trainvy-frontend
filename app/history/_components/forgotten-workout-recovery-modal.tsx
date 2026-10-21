"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Dumbbell,
  Layers,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  GetForgottenWorkoutDraft200Draft as ForgottenWorkoutDraftDto,
  GetForgottenWorkoutDraft200DraftProposedExercisesItem as ForgottenWorkoutExercise,
  GetForgottenWorkoutDraft200DraftProposedExercisesItemSetsItem as ForgottenWorkoutSet,
  GetForgottenWorkoutDraft200Conflicts as WorkoutRecoveryConflictDetails,
} from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  confirmForgottenWorkoutRecoveryAction,
  discardForgottenWorkoutDraftAction,
  getForgottenWorkoutDraftAction,
  updateForgottenWorkoutDraftAction,
} from "../_recovery-actions";

interface ForgottenWorkoutRecoveryModalProps {
  draftId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed?: (sessionId: string) => void;
}

export function ForgottenWorkoutRecoveryModal({
  draftId,
  isOpen,
  onClose,
  onConfirmed,
}: ForgottenWorkoutRecoveryModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ForgottenWorkoutDraftDto | null>(null);
  const [conflicts, setConflicts] = useState<WorkoutRecoveryConflictDetails | null>(null);

  // Campos editáveis
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ForgottenWorkoutExercise[]>([]);
  const [confirmConflict, setConfirmConflict] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Ações em andamento
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Carrega dados do rascunho
  useEffect(() => {
    if (!isOpen || !draftId) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    getForgottenWorkoutDraftAction(draftId).then((res) => {
      if (!mounted) return;
      if (!res.success) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      setDraft(res.data.draft);
      setConflicts(res.data.conflicts);
      setDate(res.data.draft.sessionDate);
      setTitle(res.data.draft.title);
      setExercises(res.data.draft.proposedExercises);
      setConfirmConflict(false);
      setHasChanges(false);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, draftId]);

  if (!isOpen) return null;

  const todayIso = new Date().toISOString().slice(0, 10);

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof ForgottenWorkoutSet,
    val: any,
  ) => {
    setExercises((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ForgottenWorkoutExercise[];
      (next[exIdx].sets[setIdx] as any)[field] = val;
      return next;
    });
    setHasChanges(true);
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ForgottenWorkoutExercise[];
      const curSets = next[exIdx].sets;
      const lastSet = curSets[curSets.length - 1];
      const newOrder = curSets.length + 1;

      next[exIdx].sets.push({
        order: newOrder,
        type: "WORKING",
        weightKg: lastSet?.weightKg ?? 20,
        reps: lastSet?.reps ?? 10,
        rir: lastSet?.rir ?? null,
      });
      return next;
    });
    setHasChanges(true);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ForgottenWorkoutExercise[];
      if (next[exIdx].sets.length <= 1) {
        toast.error("O exercício deve conter ao menos 1 série.");
        return prev;
      }
      next[exIdx].sets.splice(setIdx, 1);
      next[exIdx].sets.forEach((s: ForgottenWorkoutSet, idx: number) => {
        s.order = idx + 1;
      });
      return next;
    });
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!draft) return;
    setIsSavingChanges(true);

    const res = await updateForgottenWorkoutDraftAction(draft.id, {
      clientRevision: draft.revision,
      date,
      title,
      exercises,
    });

    setIsSavingChanges(false);

    if (!res.success) {
      if (res.code === "REVISION_MISMATCH") {
        toast.error("O rascunho foi modificado. Recarregando dados mais recentes...");
        const refreshed = await getForgottenWorkoutDraftAction(draft.id);
        if (refreshed.success) {
          setDraft(refreshed.data.draft);
          setConflicts(refreshed.data.conflicts);
          setDate(refreshed.data.draft.sessionDate);
          setTitle(refreshed.data.draft.title);
          setExercises(refreshed.data.draft.proposedExercises);
          setHasChanges(false);
        }
        return;
      }
      toast.error(res.error);
      return;
    }

    const updated = res.data as unknown as ForgottenWorkoutDraftDto;
    setDraft(updated);
    setDate(updated.sessionDate);
    setTitle(updated.title);
    setExercises(updated.proposedExercises);
    setHasChanges(false);
    toast.success("Alterações salvas no rascunho!");
  };

  const handleConfirm = async () => {
    if (!draft) return;

    if (conflicts?.hasConflict && !confirmConflict) {
      toast.error(
        "Por favor, confirme a ciência do conflito de data para registrar o segundo treino.",
      );
      return;
    }

    setIsConfirming(true);

    // Se houve alterações não salvas, salva primeiro
    let currentRevision = draft.revision;
    if (hasChanges) {
      const saveRes = await updateForgottenWorkoutDraftAction(draft.id, {
        clientRevision: draft.revision,
        date,
        title,
        exercises,
      });

      if (!saveRes.success) {
        setIsConfirming(false);
        toast.error(saveRes.error || "Falha ao salvar rascunho antes da confirmação.");
        return;
      }
      const savedDraft = saveRes.data as unknown as ForgottenWorkoutDraftDto;
      currentRevision = savedDraft.revision;
      setDraft(savedDraft);
    }

    const res = await confirmForgottenWorkoutRecoveryAction(draft.id, {
      clientRevision: currentRevision,
      confirmConflict,
    });

    setIsConfirming(false);

    if (!res.success) {
      if (res.code === "POTENTIAL_CONFLICT_DETECTED") {
        toast.error("Detectamos outro treino neste mesmo dia. Marque a caixa de confirmação.");
        setConfirmConflict(false);
        return;
      }
      if (res.code === "REVISION_MISMATCH") {
        toast.error("Rascunho atualizado por outra ação. Recarregando...");
        const refreshed = await getForgottenWorkoutDraftAction(draft.id);
        if (refreshed.success) {
          setDraft(refreshed.data.draft);
          setConflicts(refreshed.data.conflicts);
        }
        return;
      }
      toast.error(res.error);
      return;
    }

    toast.success("Treino retroativo registrado no histórico com sucesso!");
    onConfirmed?.(res.data.sessionId);
    onClose();
    startTransition(() => {
      router.refresh();
    });
  };

  const handleDiscard = async () => {
    if (!draft) return;
    if (!confirm("Tem certeza que deseja descartar este treino? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDiscarding(true);
    const res = await discardForgottenWorkoutDraftAction(draft.id, "Descartado pelo atleta");
    setIsDiscarding(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    toast.info("Rascunho de treino descartado.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Recuperação de Treino Esquecido
              </h2>
              <p className="text-xs text-muted-foreground">
                Revise os detalhes antes de registrar a sessão retroativa no histórico.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm">Carregando detalhes do rascunho...</p>
            </div>
          ) : error || !draft ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="size-8" />
              <p className="mt-2 text-sm">{error || "Rascunho não encontrado."}</p>
              <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
                Fechar
              </Button>
            </div>
          ) : (
            <>
              {/* Info de data civil & precisão temporal */}
              {draft.timePrecision === "DATE_ONLY" && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Precisão por data civil: </span>
                  Este treino foi relatado sem horários exatos de início e término. A duração será
                  exibida como <em>Não informada</em> para não inventar métricas falsas.
                </div>
              )}

              {/* Alerta de Conflito de Treino no mesmo dia */}
              {conflicts?.hasConflict && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-amber-500 font-medium">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <span>Conflito de Data Detectado</span>
                  </div>
                  <p className="text-muted-foreground">
                    Você já possui <strong>{conflicts.conflictingSessions.length} treino(s)</strong>{" "}
                    registrado(s) para este mesmo dia (
                    {conflicts.conflictingSessions
                      .map((s: any) => s.workoutPlanNameSnapshot || "Treino")
                      .join(", ")}
                    ).
                  </p>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={confirmConflict}
                      onChange={(e) => setConfirmConflict(e.target.checked)}
                      className="size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Confirmo o registro deste segundo treino neste mesmo dia</span>
                  </label>
                </div>
              )}

              {/* Informações Básicas: Data e Título */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="session-date" className="text-xs font-semibold">
                    Data do Treino
                  </Label>
                  <Input
                    id="session-date"
                    type="date"
                    max={todayIso}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-title" className="text-xs font-semibold">
                    Título da Sessão
                  </Label>
                  <Input
                    id="session-title"
                    type="text"
                    value={title}
                    placeholder="Ex: Treino de Peito e Tríceps"
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Lista de Exercícios e Séries */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                    <Dumbbell className="size-4 text-primary" />
                    Exercícios e Séries Realizadas
                  </h3>
                  <Badge variant="outline" className="text-[11px]">
                    {exercises.length} {exercises.length === 1 ? "exercício" : "exercícios"}
                  </Badge>
                </div>

                {exercises.map((ex, exIdx) => (
                  <div
                    key={ex.exerciseId || exIdx}
                    className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {ex.order || exIdx + 1}
                        </span>
                        <span className="font-heading text-sm font-semibold text-foreground">
                          {ex.exerciseNameSnapshot || "Exercício"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSet(exIdx)}
                        className="h-7 gap-1 text-xs text-primary hover:text-primary"
                      >
                        <Plus className="size-3.5" />
                        Série
                      </Button>
                    </div>

                    {/* Tabela de Séries */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-1">
                        <span className="col-span-1">#</span>
                        <span className="col-span-3">Tipo</span>
                        <span className="col-span-3">Carga (kg)</span>
                        <span className="col-span-3">Reps</span>
                        <span className="col-span-1">RIR</span>
                        <span className="col-span-1 text-right"></span>
                      </div>

                      {ex.sets.map((s: ForgottenWorkoutSet, sIdx: number) => (
                        <div
                          key={s.order || sIdx}
                          className="grid grid-cols-12 gap-2 items-center rounded-lg bg-background/50 p-1.5 border border-border/40 text-xs"
                        >
                          <span className="col-span-1 text-center font-bold text-muted-foreground text-[11px]">
                            {s.order || sIdx + 1}
                          </span>
                          <div className="col-span-3">
                            <select
                              value={s.type}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, sIdx, "type", e.target.value)
                              }
                              className="h-7 w-full rounded border border-input bg-transparent px-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="WORKING">Válida</option>
                              <option value="WARMUP">Aquec.</option>
                            </select>
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={s.weightKg ?? ""}
                              onChange={(e) =>
                                handleUpdateSet(
                                  exIdx,
                                  sIdx,
                                  "weightKg",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="h-7 px-2 text-xs"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min="1"
                              value={s.reps ?? ""}
                              onChange={(e) =>
                                handleUpdateSet(
                                  exIdx,
                                  sIdx,
                                  "reps",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className="h-7 px-2 text-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={s.rir ?? ""}
                              placeholder="-"
                              onChange={(e) =>
                                handleUpdateSet(
                                  exIdx,
                                  sIdx,
                                  "rir",
                                  e.target.value === "" ? null : parseInt(e.target.value, 10),
                                )
                              }
                              className="h-7 px-1 text-center text-xs"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exIdx, sIdx)}
                              className="rounded p-1 text-muted-foreground hover:text-destructive transition"
                              title="Remover série"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 px-5 py-3.5 bg-card/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={isLoading || isDiscarding || isConfirming}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 text-xs"
          >
            {isDiscarding ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Descartar
          </Button>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isLoading || isSavingChanges || isConfirming}
                className="gap-1.5 text-xs"
              >
                {isSavingChanges && <Loader2 className="size-3.5 animate-spin" />}
                Salvar Rascunho
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={
                isLoading ||
                isConfirming ||
                isSavingChanges ||
                (Boolean(conflicts?.hasConflict) && !confirmConflict)
              }
              className="gap-1.5 text-xs font-semibold"
            >
              {isConfirming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Confirmar e Salvar no Histórico
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
