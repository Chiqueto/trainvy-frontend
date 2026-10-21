"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import type {
  ConfirmWorkoutSetProposal200CreatedSetsItem,
  ConfirmWorkoutSetProposalBodySetsItem,
  ConfirmWorkoutSetProposalBodySetsItemType,
  ListWorkoutSetProposals200ProposalsItem,
  ListWorkoutSetProposals200ProposalsItemStatus,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

import {
  confirmWorkoutSetProposalAction,
  discardWorkoutSetProposalAction,
} from "../_actions";

interface SetProposalCardProps {
  proposal: ListWorkoutSetProposals200ProposalsItem;
  sessionId: string;
  onConfirmed?: (
    createdSets: ConfirmWorkoutSetProposal200CreatedSetsItem[],
    sessionExerciseId: string,
  ) => void;
  onDiscarded?: (proposalId: string) => void;
}

export function SetProposalCard({
  proposal,
  sessionId,
  onConfirmed,
  onDiscarded,
}: SetProposalCardProps) {
  const [status, setStatus] = useState<ListWorkoutSetProposals200ProposalsItemStatus>(
    proposal.status,
  );
  const [invalidationReason, setInvalidationReason] = useState<string | null | undefined>(
    proposal.invalidationReason,
  );
  const [sets, setSets] = useState<ConfirmWorkoutSetProposalBodySetsItem[]>(() =>
    proposal.suggestedSets.map((s) => ({
      type: (s.type as ConfirmWorkoutSetProposalBodySetsItemType) || "WORKING",
      weightKg: s.weightKg ?? null,
      reps: s.reps ?? null,
      rir: s.rir ?? null,
      durationInSeconds: s.durationInSeconds ?? null,
      notes: s.notes ?? null,
    })),
  );

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateSet = (
    index: number,
    field: keyof ConfirmWorkoutSetProposalBodySetsItem,
    value: any,
  ) => {
    setSets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleConfirm = async () => {
    if (status !== "PENDING" || isConfirming || isDiscarding) return;

    // Validação client-side básica
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      if (s.weightKg !== null && s.weightKg !== undefined) {
        if (s.weightKg < 0 || s.weightKg > 1000) {
          setErrorMessage(`Série ${i + 1}: carga deve estar entre 0 e 1000 kg`);
          return;
        }
      }
      if (s.reps !== null && s.reps !== undefined) {
        if (s.reps < 0 || s.reps > 500) {
          setErrorMessage(`Série ${i + 1}: repetições devem estar entre 0 e 500`);
          return;
        }
      }
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = `proposal-${proposal.id}-${Date.now()}`;
      const res = await confirmWorkoutSetProposalAction(
        sessionId,
        proposal.id,
        {
          idempotencyKey,
          sets,
        },
      );

      if (!res.success) {
        if (
          res.code === "CONTEXT_REVISION_MISMATCH" ||
          res.code === "PROPOSAL_OUTDATED"
        ) {
          setStatus("INVALIDATED");
          setInvalidationReason("CONTEXT_REVISION_MISMATCH");
          setErrorMessage(
            "Esta proposta está desatualizada devido a alterações recentes no treino ou exercício.",
          );
          toast.error("Proposta desatualizada por alterações recentes");
        } else if (res.code === "PROPOSAL_EXPIRED") {
          setStatus("INVALIDATED");
          setInvalidationReason("EXPIRED");
          setErrorMessage("Esta proposta expirou e não pode mais ser gravada.");
          toast.error("A proposta expirou");
        } else {
          setErrorMessage(res.error);
          toast.error(res.error);
        }
        return;
      }

      setStatus("CONFIRMED");
      toast.success("Séries registradas com sucesso no treino!");
      onConfirmed?.(res.data.createdSets, proposal.sessionExerciseId);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscard = async () => {
    if (status !== "PENDING" || isConfirming || isDiscarding) return;

    setIsDiscarding(true);
    setErrorMessage(null);

    try {
      const res = await discardWorkoutSetProposalAction(sessionId, proposal.id);
      if (!res.success) {
        setErrorMessage(res.error);
        toast.error(res.error);
        return;
      }

      setStatus("DISCARDED");
      toast.info("Proposta descartada");
      onDiscarded?.(proposal.id);
    } finally {
      setIsDiscarding(false);
    }
  };

  const isPending = status === "PENDING";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm transition hover:border-primary/40">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Dumbbell className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-sm font-bold text-foreground line-clamp-1">
              {proposal.targetExerciseNameSnapshot}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Proposta do Assistente de Treino
            </span>
          </div>
        </div>

        {/* Badge de Status */}
        {status === "PENDING" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
            <Clock className="size-3" />
            Pendente
          </span>
        )}
        {status === "CONFIRMED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500">
            <CheckCircle2 className="size-3" />
            Confirmado
          </span>
        )}
        {status === "DISCARDED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            <Trash2 className="size-3" />
            Descartado
          </span>
        )}
        {status === "INVALIDATED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
            <XCircle className="size-3" />
            Desatualizado
          </span>
        )}
      </div>

      {/* Alerta de Invalidação ou Erro */}
      {status === "INVALIDATED" && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>
            {invalidationReason === "EXPIRED"
              ? "Esta proposta expirou. Peça ao assistente para gerar uma nova recomendação."
              : "O exercício ou as séries sofreram alterações recentes. Esta proposta não é mais válida."}
          </span>
        </div>
      )}

      {errorMessage && status === "PENDING" && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lista de Séries da Proposta */}
      <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-2.5">
        <div className="grid grid-cols-12 gap-1 px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span className="col-span-2">Série</span>
          <span className="col-span-3">Tipo</span>
          <span className="col-span-4 text-center">Carga (kg)</span>
          <span className="col-span-3 text-center">Reps</span>
        </div>

        {sets.map((set, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 p-1.5 text-xs"
          >
            {/* Número da série */}
            <span className="col-span-2 font-mono font-bold text-foreground text-center">
              #{idx + 1}
            </span>

            {/* Tipo: WARMUP vs WORKING */}
            <div className="col-span-3">
              {isPending ? (
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateSet(
                      idx,
                      "type",
                      set.type === "WARMUP" ? "WORKING" : "WARMUP",
                    )
                  }
                  className={`w-full rounded px-1.5 py-1 text-[10px] font-bold uppercase transition ${
                    set.type === "WARMUP"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {set.type === "WARMUP" ? "Aquec." : "Válida"}
                </button>
              ) : (
                <span
                  className={`inline-block w-full text-center rounded px-1 py-0.5 text-[10px] font-bold uppercase ${
                    set.type === "WARMUP"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {set.type === "WARMUP" ? "Aquec." : "Válida"}
                </span>
              )}
            </div>

            {/* Carga (kg) */}
            <div className="col-span-4 flex items-center justify-center">
              {isPending ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1000"
                    value={set.weightKg ?? ""}
                    onChange={(e) =>
                      handleUpdateSet(
                        idx,
                        "weightKg",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-16 rounded-md border border-border bg-card px-1.5 py-1 text-center font-mono text-xs font-semibold focus:border-primary focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground">kg</span>
                </div>
              ) : (
                <span className="font-mono font-bold text-foreground">
                  {set.weightKg !== null ? `${set.weightKg} kg` : "—"}
                </span>
              )}
            </div>

            {/* Reps */}
            <div className="col-span-3 flex items-center justify-center">
              {isPending ? (
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={set.reps ?? ""}
                  onChange={(e) =>
                    handleUpdateSet(
                      idx,
                      "reps",
                      e.target.value === "" ? null : parseInt(e.target.value, 10),
                    )
                  }
                  placeholder="0"
                  className="w-12 rounded-md border border-border bg-card px-1.5 py-1 text-center font-mono text-xs font-semibold focus:border-primary focus:outline-none"
                />
              ) : (
                <span className="font-mono font-bold text-foreground">
                  {set.reps !== null ? `${set.reps} reps` : "—"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botões de Ação para Status PENDING */}
      {isPending && (
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirming || isDiscarding}
            className="flex-1 rounded-xl bg-primary font-heading text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isConfirming ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Gravando séries...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5" />
                Confirmar Séries
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isConfirming || isDiscarding}
            aria-label="Descartar proposta"
            className="rounded-xl border-border font-heading text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            {isDiscarding ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
