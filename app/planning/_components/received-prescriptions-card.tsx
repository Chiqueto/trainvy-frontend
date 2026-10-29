"use client";

import { toast } from "sonner";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Dumbbell,
  Eye,
  LoaderCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";

import {
  acceptPrescriptionAction,
  declinePrescriptionAction,
} from "@/app/planning/_actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AthletePrescriptionExercise {
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

export interface AthletePrescriptionDay {
  name: string;
  order?: number;
  dayOfWeek?: number;
  weekDay?: string;
  isRest?: boolean;
  isRestDay?: boolean;
  estimatedDurationMinutes?: number;
  estimatedDurationInSeconds?: number;
  exercises?: AthletePrescriptionExercise[];
}

export interface AthletePrescriptionPayload {
  days?: AthletePrescriptionDay[];
  workoutDays?: AthletePrescriptionDay[];
}

export interface AthletePrescriptionItem {
  id: string;
  coachId: string;
  coachName?: string;
  athleteId: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  name: string;
  notes: string | null;
  version: number;
  approvedAt?: string | null;
  approvedVersion?: number | null;
  approvedByUserId?: string | null;
  approvalMode?: "VERIFIED" | "TEST" | "UNVERIFIED";
  acceptedWorkoutPlanId: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coach?: {
    id: string;
    name: string;
    image?: string | null;
  };
  payload?: AthletePrescriptionPayload | null;
}

interface ReceivedPrescriptionsCardProps {
  prescriptions: AthletePrescriptionItem[];
}

export function ReceivedPrescriptionsCard({
  prescriptions,
}: ReceivedPrescriptionsCardProps) {
  const router = useRouter();
  const [selectedPrescription, setSelectedPrescription] =
    useState<AthletePrescriptionItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [declineTarget, setDeclineTarget] =
    useState<AthletePrescriptionItem | null>(null);
  const [acceptedSuccess, setAcceptedSuccess] = useState<{
    planId: string;
    planName: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtra prescrições pendentes de ação (SENT)
  const pendingPrescriptions = prescriptions.filter((p) => p.status === "SENT");

  if (prescriptions.length === 0) {
    return null;
  }

  function handleAccept(prescriptionId: string) {
    startTransition(async () => {
      const res = await acceptPrescriptionAction(prescriptionId);
      if (!res.success) {
        toast.error(res.error);
        router.refresh();
        return;
      }

      toast.success("Prescrição aceita com sucesso!");
      setAcceptedSuccess({
        planId: res.data.workoutPlanId,
        planName: res.data.workoutPlanName,
      });
      router.refresh();
    });
  }

  function handleDeclineConfirm() {
    if (!declineTarget) return;
    startTransition(async () => {
      const res = await declinePrescriptionAction(declineTarget.id);
      if (!res.success) {
        toast.error(res.error);
        router.refresh();
        return;
      }
      toast.success("Prescrição recusada.");
      setDeclineTarget(null);
      setIsDetailOpen(false);
      setSelectedPrescription(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      {/* Banner de Prescrição Pendente em Destaque */}
      {pendingPrescriptions.map((item) => {
        const coachName = item.coach?.name ?? item.coachName ?? "Seu Personal";
        const formattedDate = item.sentAt
          ? new Date(item.sentAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })
          : "";

        return (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-md flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-heading font-bold uppercase tracking-wider text-primary border border-primary/30">
                <Sparkles className="size-3" />
                <span>Prescrição de Treino Recebida</span>
              </div>
              <span className="text-[11px] font-heading text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 text-primary/70" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="size-11 border border-border shrink-0">
                <AvatarImage src={item.coach?.image ?? undefined} />
                <AvatarFallback className="font-heading font-bold text-xs bg-muted">
                  {coachName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="font-heading text-base font-bold text-foreground truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Elaborado por{" "}
                  <strong className="text-foreground">{coachName}</strong>
                </p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic pt-0.5">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPrescription(item);
                  setIsDetailOpen(true);
                  setAcceptedSuccess(null);
                }}
                className="w-full sm:w-auto h-9 font-heading text-xs font-semibold gap-1.5 border-border/80"
              >
                <Eye className="size-3.5" />
                <span>Revisar Treino</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setDeclineTarget(item)}
                  className="flex-1 sm:flex-none h-9 font-heading text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  Recusar
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleAccept(item.id)}
                  className="flex-1 sm:flex-none h-9 font-heading text-xs font-bold gap-1.5 shadow-sm"
                >
                  {isPending ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>Aceitar Prescrição</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal de Detalhes e Aceite do Aluno */}
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
                {selectedPrescription.status === "SENT" && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase"
                  >
                    Pendente
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setAcceptedSuccess(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Enviado por{" "}
              <strong>
                {selectedPrescription.coach?.name ?? "Seu Treinador"}
              </strong>
              {selectedPrescription.approvalMode === "TEST" ? (
                <> · Aprovação em modo de testes, sem CREF verificado</>
              ) : selectedPrescription.approvedAt &&
                selectedPrescription.approvedVersion ===
                  selectedPrescription.version ? (
                <>
                  {" "}
                  · Aprovação registrada em{" "}
                  {new Date(selectedPrescription.approvedAt).toLocaleDateString(
                    "pt-BR",
                  )}{" "}
                  · versão {selectedPrescription.approvedVersion}
                </>
              ) : (
                <> · Aprovação profissional não verificada neste registro</>
              )}
            </p>

            {/* Estado de Sucesso pós-aceite */}
            {acceptedSuccess ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center flex flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Prescrição Aceita com Sucesso!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    O planejamento foi adicionado à sua conta como{" "}
                    <strong>inativo</strong>. Seu treino atual permanece
                    intocado até que você decida ativá-lo.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
                  <Link
                    href={`/workout-plans/${acceptedSuccess.planId}`}
                    className="flex-1"
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-10 font-heading text-xs font-bold gap-1.5 shadow-sm"
                    >
                      <Play className="size-3.5" />
                      <span>Ver e Ativar Planejamento Agora</span>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setAcceptedSuccess(null);
                    }}
                    className="flex-1 h-10 font-heading text-xs font-semibold"
                  >
                    Manter inativo por enquanto
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {selectedPrescription.notes && (
                  <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground space-y-1">
                    <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">
                      Instruções do Personal:
                    </span>
                    <p className="leading-relaxed">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                )}

                {/* Informação sobre ativação voluntária */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Dumbbell className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Ao aceitar, este planejamento passará a ser seu e ficará
                    armazenado na sua conta como inativo. Você poderá ativá-lo
                    voluntariamente a qualquer momento.
                  </p>
                </div>

                {/* Detalhes dos Dias e Exercícios */}
                <div className="space-y-3">
                  <span className="font-heading font-bold uppercase tracking-wider text-[11px] text-muted-foreground block">
                    Exercícios Prescritos:
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
                            Dia de recuperação.
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

                {selectedPrescription.status === "SENT" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setDeclineTarget(selectedPrescription)}
                      className="w-full sm:w-auto text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      Recusar Prescrição
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleAccept(selectedPrescription.id)}
                      className="w-full sm:w-auto sm:ml-auto font-heading font-bold gap-1.5 shadow-sm"
                    >
                      {isPending && (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      )}
                      <span>Aceitar Prescrição</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recusa */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Recusar Prescrição
                </h3>
                <p className="text-xs text-muted-foreground">
                  {declineTarget.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza de que deseja recusar a prescrição enviada pelo
              treinador? O treinador será informado da sua decisão.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setDeclineTarget(null)}
                className="flex-1 rounded-xl h-9 font-heading text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleDeclineConfirm}
                className="flex-1 rounded-xl h-9 font-heading text-xs font-bold gap-1.5"
              >
                {isPending && (
                  <LoaderCircle className="size-3.5 animate-spin" />
                )}
                <span>Sim, recusar</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
