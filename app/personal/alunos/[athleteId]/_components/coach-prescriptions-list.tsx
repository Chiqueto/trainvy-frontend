"use client";

import { toast } from "sonner";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Eye,
  FileEdit,
  LoaderCircle,
  Plus,
  Send,
  X,
  XCircle,
} from "lucide-react";

import { cancelPrescriptionAction } from "@/app/personal/_actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PrescriptionDayExercise {
  name?: string;
  exerciseName?: string;
  exerciseId?: string;
  order?: number;
  orderIndex?: number;
  sets: number;
  warmupSets?: number;
  reps: number;
  restSeconds?: number;
  restTimeInSeconds?: number;
  notes?: string;
  alternative1ExerciseName?: string | null;
  alternative2ExerciseName?: string | null;
}

export interface PrescriptionDay {
  name: string;
  order?: number;
  dayOfWeek?: number;
  weekDay?: string;
  isRest?: boolean;
  isRestDay?: boolean;
  estimatedDurationMinutes?: number;
  estimatedDurationInSeconds?: number;
  exercises?: PrescriptionDayExercise[];
}

export interface PrescriptionPayloadData {
  days?: PrescriptionDay[];
  workoutDays?: PrescriptionDay[];
}

export interface PrescriptionListItem {
  id: string;
  coachId: string;
  athleteId: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  name: string;
  notes: string | null;
  version: number;
  approvalMode?:"VERIFIED"|"TEST"|"UNVERIFIED";
  acceptedWorkoutPlanId: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payload?: PrescriptionPayloadData | null;
}

interface CoachPrescriptionsListProps {
  athleteId: string;
  athleteName: string;
  prescriptions: PrescriptionListItem[];
}

export function CoachPrescriptionsList({
  athleteId,
  athleteName,
  prescriptions,
}: CoachPrescriptionsListProps) {
  const router = useRouter();
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancelConfirm() {
    if (!cancelTargetId) return;
    startTransition(async () => {
      const res = await cancelPrescriptionAction({
        id: cancelTargetId,
        athleteId,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Prescrição cancelada.");
      setCancelTargetId(null);
      router.refresh();
    });
  }

  function renderStatusBadge(status: PrescriptionListItem["status"]) {
    switch (status) {
      case "DRAFT":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider"
          >
            Rascunho
          </Badge>
        );
      case "SENT":
        return (
          <Badge
            variant="outline"
            className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
          >
            <Clock className="size-2.5" />
            <span>Enviado</span>
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
          >
            <CheckCircle2 className="size-2.5" />
            <span>Aceito</span>
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider"
          >
            Recusado
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="border-muted bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase tracking-wider"
          >
            Cancelado
          </Badge>
        );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top CTA Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-heading text-sm font-bold text-foreground">
            Prescrições de Treino
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Treinos preparados para {athleteName}, com exercícios, séries,
            repetições e orientações. Salve como rascunho para ajustar; depois,
            revise, aprove e envie para o aluno aceitar no planejamento dele.
          </p>
        </div>

        <Link href={`/personal/alunos/${athleteId}/prescrever`}>
          <Button
            size="sm"
            className="h-9 rounded-xl font-heading text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Nova Prescrição</span>
          </Button>
        </Link>
      </div>

      {/* Lista de Prescrições */}
      {prescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Dumbbell className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold text-foreground">
              Nenhuma prescrição criada ainda
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Crie uma rotina de treino personalizada com dias, exercícios e
              séries para enviar a {athleteName}.
            </p>
          </div>
          <Link
            href={`/personal/alunos/${athleteId}/prescrever`}
            className="mt-1"
          >
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl font-heading text-xs font-semibold gap-1.5 border-border/80"
            >
              <Plus className="size-3.5 text-primary" />
              <span>Criar Primeira Prescrição</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {prescriptions.map((item) => {
            const workoutDays: PrescriptionDay[] =
              item.payload?.days ?? item.payload?.workoutDays ?? [];
            const activeDays = workoutDays.filter(
              (d) => !(d.isRestDay ?? d.isRest),
            );
            const totalExercises = workoutDays.reduce(
              (acc: number, d) => acc + (d.exercises?.length ?? 0),
              0,
            );

            const formattedDate = new Date(
              item.sentAt || item.createdAt,
            ).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex flex-col gap-3 transition-colors hover:border-border"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-bold text-foreground">
                        {item.name}
                      </h3>
                      {renderStatusBadge(item.status)}
                      {item.approvalMode === "TEST" && <Badge variant="outline" className="border-amber-500/50 text-amber-600">Teste · CREF não verificado</Badge>}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        &quot;{item.notes}&quot;
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-heading text-muted-foreground shrink-0 flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground/70" />
                    <span>{formattedDate}</span>
                  </span>
                </div>

                {/* Métricas do Treino */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground border-y border-border/40 py-2">
                  <span className="font-heading">
                    <strong className="text-foreground font-semibold">
                      {activeDays.length}
                    </strong>{" "}
                    {activeDays.length === 1
                      ? "dia de treino"
                      : "dias de treino"}
                  </span>
                  <span>•</span>
                  <span className="font-heading">
                    <strong className="text-foreground font-semibold">
                      {totalExercises}
                    </strong>{" "}
                    {totalExercises === 1 ? "exercício" : "exercícios"}
                  </span>
                </div>

                {/* Ações por Status */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedPrescription(item);
                      setIsDetailOpen(true);
                    }}
                    className="h-8 px-2.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    <span>Ver Detalhes</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {item.status === "DRAFT" && (
                      <>
                        <Link
                          href={`/personal/alunos/${athleteId}/prescricoes/${item.id}/editar`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs font-heading font-medium gap-1 rounded-lg"
                          >
                            <FileEdit className="size-3" />
                            <span>Editar</span>
                          </Button>
                        </Link>

                        <Button
                          size="sm"
                          variant="default"
                          disabled={isPending}
                          onClick={() =>
                            router.push(
                              `/personal/alunos/${athleteId}/prescricoes/${item.id}/editar`,
                            )
                          }
                          className="h-8 px-3 text-xs font-heading font-semibold gap-1.5 rounded-lg shadow-xs"
                        >
                          {isPending ? (
                            <LoaderCircle className="size-3 animate-spin" />
                          ) : (
                            <Send className="size-3" />
                          )}
                          <span>Revisar e aprovar</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setCancelTargetId(item.id)}
                          className="h-8 px-2 text-xs font-heading text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          title="Cancelar rascunho"
                        >
                          <XCircle className="size-3.5" />
                        </Button>
                      </>
                    )}

                    {item.status === "SENT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setCancelTargetId(item.id)}
                        className="h-8 px-2.5 text-xs font-heading text-muted-foreground hover:text-destructive hover:border-destructive/40 rounded-lg"
                      >
                        <span>Cancelar Envio</span>
                      </Button>
                    )}

                    {item.status === "ACCEPTED" && (
                      <span className="text-[11px] font-heading font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Plano Criado pelo Aluno
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Prescrição */}
      {isDetailOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {selectedPrescription.name}
                </h3>
                {renderStatusBadge(selectedPrescription.status)}
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Prescrição para {athleteName}
            </p>

            {selectedPrescription.notes && (
              <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground space-y-1">
                <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">
                  Orientações do Treinador:
                </span>
                <p className="leading-relaxed">{selectedPrescription.notes}</p>
              </div>
            )}

            {/* Dias e Exercícios */}
            <div className="space-y-3">
              <span className="font-heading font-bold uppercase tracking-wider text-[11px] text-muted-foreground block">
                Estrutura dos Treinos:
              </span>

              {(
                selectedPrescription.payload?.days ??
                selectedPrescription.payload?.workoutDays ??
                []
              ).map((day, dayIdx) => {
                const isRest = day.isRestDay ?? day.isRest ?? false;
                const durationMinutes =
                  day.estimatedDurationMinutes ??
                  Math.round((day.estimatedDurationInSeconds ?? 0) / 60);

                return (
                  <div
                    key={dayIdx}
                    className="rounded-xl border border-border/80 bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                      <span className="font-heading text-xs font-bold text-foreground">
                        {day.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {isRest ? "Descanso" : `${durationMinutes} min`}
                      </span>
                    </div>

                    {isRest ? (
                      <p className="text-xs text-muted-foreground italic py-1">
                        Dia destinado à recuperação muscular.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {(day.exercises ?? []).map((ex, exIdx) => {
                          const exName =
                            ex.name ??
                            ex.exerciseName ??
                            ex.exerciseId ??
                            `Exercício ${exIdx + 1}`;
                          const restTime =
                            ex.restSeconds ?? ex.restTimeInSeconds ?? 60;
                          const warmup = ex.warmupSets ?? 0;

                          return (
                            <div
                              key={exIdx}
                              className="flex flex-col text-xs py-1.5 px-2.5 rounded-lg bg-muted/30 gap-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {exName}
                                </span>
                                <span className="font-mono text-muted-foreground text-[11px]">
                                  {warmup > 0 && (
                                    <span className="text-amber-500 font-medium mr-1.5">
                                      {warmup}aq +
                                    </span>
                                  )}
                                  {ex.sets}x{ex.reps} • {restTime}s
                                </span>
                              </div>
                              {(ex.alternative1ExerciseName ||
                                ex.alternative2ExerciseName) && (
                                <p className="text-[10px] text-muted-foreground">
                                  Alt:{" "}
                                  {[
                                    ex.alternative1ExerciseName,
                                    ex.alternative2ExerciseName,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {Boolean(cancelTargetId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="size-5" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Confirmar Cancelamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja cancelar esta prescrição? Esta ação não
              poderá ser desfeita e o aluno não poderá mais aceitá-la.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setCancelTargetId(null)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleCancelConfirm}
                className="flex-1 gap-1.5"
              >
                {isPending && (
                  <LoaderCircle className="size-3.5 animate-spin" />
                )}
                <span>Cancelar Prescrição</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
