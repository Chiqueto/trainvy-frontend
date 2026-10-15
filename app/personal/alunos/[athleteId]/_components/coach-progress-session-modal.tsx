"use client";

import { useEffect } from "react";
import {
  Clock3,
  Dumbbell,
  Flame,
  Layers3,
  Scale,
  Shield,
  X,
} from "lucide-react";
import type { GetCoachAthleteProgressSessionDetail200 } from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalDate } from "@/app/_components/local-date";
import {
  formatDuration,
  formatSetDuration,
  formatWeightInGrams,
  formatWeightKg,
  getHistorySessionTitle,
  getSetTypeLabel,
} from "@/app/_lib/training-formatters";

interface CoachProgressSessionModalProps {
  session: GetCoachAthleteProgressSessionDetail200;
  onClose: () => void;
}

export function CoachProgressSessionModal({
  session,
  onClose,
}: CoachProgressSessionModalProps) {
  // Fecha modal com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const title = getHistorySessionTitle(session);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header Fixo */}
        <div className="flex items-start justify-between border-b border-border/80 px-5 py-4 bg-card/90 backdrop-blur-md shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={session.origin === "PLANNED" ? "default" : "secondary"}
                className="font-heading text-[10px] uppercase font-bold tracking-wider"
              >
                {session.origin === "PLANNED" ? "Treino Planejado" : "Treino Avulso"}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                <Shield className="size-3 text-primary" />
                Somente Leitura
              </span>
            </div>
            <h2
              id="session-modal-title"
              className="font-heading text-lg sm:text-xl font-bold text-foreground truncate"
            >
              {title}
            </h2>
            <LocalDate
              isoDate={session.completedAt}
              long
              className="text-xs text-muted-foreground block mt-0.5"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Fechar detalhes da sessão"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Snapshots de Planejamento */}
          {session.origin === "PLANNED" &&
            session.workoutPlanNameSnapshot &&
            session.workoutPlanNameSnapshot !== title && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-foreground">
                <span className="font-semibold text-primary">Plano Vinculado: </span>
                {session.workoutPlanNameSnapshot}
                {session.workoutDayNameSnapshot && (
                  <span className="text-muted-foreground">
                    {" "}
                    · Dia: {session.workoutDayNameSnapshot}
                  </span>
                )}
              </div>
            )}

          {/* Cards de Métricas da Sessão */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Layers3 className="size-3.5 text-primary" />
                <span>Séries Válidas</span>
              </div>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {session.summary.workingSetsCount}
                {session.summary.warmupSetsCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (+{session.summary.warmupSetsCount} aq.)
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Dumbbell className="size-3.5 text-primary" />
                <span>Exercícios</span>
              </div>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {session.summary.exercisesCount}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Scale className="size-3.5 text-primary" />
                <span>Volume Total</span>
              </div>
              <p className="mt-1 font-heading text-lg font-bold text-foreground truncate">
                {session.summary.totalLoadVolumeKg > 0
                  ? formatWeightKg(session.summary.totalLoadVolumeKg)
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Clock3 className="size-3.5 text-primary" />
                <span>Duração</span>
              </div>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">
                {formatDuration(session.durationInSeconds)}
              </p>
            </div>
          </div>

          {/* Lista de Exercícios Realizados */}
          <div className="space-y-4">
            <h3 className="font-heading text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Exercícios Executados ({session.exercises.length})
            </h3>

            {session.exercises.map((exercise, exIdx) => (
              <div
                key={exercise.id}
                className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      #{exIdx + 1}
                    </span>
                    <h4 className="font-heading text-sm font-bold text-foreground">
                      {exercise.exerciseNameSnapshot}
                    </h4>
                    {exercise.notes && (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        &quot;{exercise.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-muted-foreground shrink-0">
                    <span className="font-semibold text-foreground">
                      {exercise.performed.workingSetsCount}
                    </span>{" "}
                    séries válidas
                    {exercise.performed.loadVolumeKg > 0 && (
                      <div className="font-mono text-[10px]">
                        Vol: {formatWeightKg(exercise.performed.loadVolumeKg)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metas Planejadas (quando disponíveis no snapshot) */}
                {session.origin === "PLANNED" &&
                  (exercise.planned.targetRepsMin || exercise.planned.workingSets) && (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      {exercise.planned.workingSets && (
                        <span>
                          Alvo:{" "}
                          <strong className="text-foreground">
                            {exercise.planned.workingSets} séries
                          </strong>
                        </span>
                      )}
                      {exercise.planned.targetRepsMin && (
                        <span>
                          Reps:{" "}
                          <strong className="text-foreground">
                            {exercise.planned.targetRepsMin}
                            {exercise.planned.targetRepsMax
                              ? `-${exercise.planned.targetRepsMax}`
                              : ""}
                          </strong>
                        </span>
                      )}
                      {exercise.planned.targetRir !== null && (
                        <span>
                          RIR:{" "}
                          <strong className="text-foreground">
                            {exercise.planned.targetRir}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}

                {/* Tabela de Séries */}
                <div className="rounded-xl border border-border/60 overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 font-heading font-semibold text-[10px] uppercase text-muted-foreground">
                    <span className="col-span-2">Série</span>
                    <span className="col-span-3 text-right">Carga</span>
                    <span className="col-span-3 text-right">Reps</span>
                    <span className="col-span-2 text-right">RIR</span>
                    <span className="col-span-2 text-right">Tempo</span>
                  </div>

                  <div className="divide-y divide-border/40">
                    {exercise.sets.map((set) => {
                      const isWarmup = set.type === "WARMUP";
                      return (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 items-center px-3 py-2 transition-colors ${
                            isWarmup ? "bg-muted/20 text-muted-foreground" : "bg-card"
                          }`}
                        >
                          <div className="col-span-2 flex items-center gap-1 font-mono font-medium">
                            {isWarmup ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
                                <Flame className="size-3" />
                                Aq
                              </span>
                            ) : (
                              <span>#{set.order}</span>
                            )}
                          </div>

                          <div className="col-span-3 text-right font-medium text-foreground">
                            {set.weightInGrams !== null
                              ? formatWeightInGrams(set.weightInGrams)
                              : "—"}
                          </div>

                          <div className="col-span-3 text-right font-medium text-foreground">
                            {set.reps !== null ? `${set.reps} reps` : "—"}
                          </div>

                          <div className="col-span-2 text-right text-muted-foreground">
                            {set.rir !== null ? `@${set.rir}` : "—"}
                          </div>

                          <div className="col-span-2 text-right text-muted-foreground text-[11px]">
                            {set.durationInSeconds !== null
                              ? formatSetDuration(set.durationInSeconds)
                              : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/80 px-5 py-3 bg-muted/30 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Snapshot imutável gravado no momento da conclusão do treino.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl font-heading text-xs font-semibold px-4"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
