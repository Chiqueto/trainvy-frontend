"use client";

import { toast } from "sonner";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Dumbbell,
  FileEdit,
  Flame,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Search,
  Send,
  User,
  UserX,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revokeStudentAction } from "../_actions";
import {
  CoachAthleteIncentiveModal,
  type IncentiveAthleteData,
} from "./coach-athlete-incentive-modal";
import { PersonalDashboardKpis } from "./personal-dashboard-kpis";

export interface AthleteItem {
  linkId: string;
  athleteId: string;
  name: string;
  email: string;
  image?: string | null;
  acceptedAt: string;
  evolutionShared?: boolean;
  lastWorkoutSessionAt?: string | null;
  workoutsThisWeekCount?: number;
  hasActiveWorkoutPlan?: boolean;
  activeWorkoutPlanName?: string | null;
  pendingPrescriptionsCount?: number;
  activePrescription?: {
    id: string;
    status: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "CANCELLED";
    name: string;
    updatedAt: string;
  } | null;
}

export interface CoachSummaryData {
  totalAthletes: number;
  activeThisWeekCount: number;
  atRiskCount: number;
  pendingPrescriptionsCount: number;
  withoutPlanCount: number;
}

interface AthletesListProps {
  athletes: AthleteItem[];
  summary?: CoachSummaryData;
  activeCount?: number;
  limit?: number | null;
}

type FilterType =
  | "all"
  | "active"
  | "at_risk"
  | "without_plan"
  | "pending_prescription";

export function AthletesList({
  athletes,
  summary,
  activeCount = 0,
  limit = null,
}: AthletesListProps) {
  const [referenceTime] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [confirmingLinkId, setConfirmingLinkId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal de Incentivo / WhatsApp
  const [incentiveAthlete, setIncentiveAthlete] =
    useState<IncentiveAthleteData | null>(null);

  const filteredAthletes = useMemo(() => {
    let result = athletes;

    // 1. Filtro por status
    if (activeFilter === "active") {
      result = result.filter((ath) => (ath.workoutsThisWeekCount ?? 0) > 0);
    } else if (activeFilter === "at_risk") {
      result = result.filter((ath) => {
        if (!ath.evolutionShared) return false;
        if (!ath.lastWorkoutSessionAt) return true;
        const diffDays = Math.floor(
          (referenceTime - new Date(ath.lastWorkoutSessionAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return diffDays >= 4;
      });
    } else if (activeFilter === "without_plan") {
      result = result.filter((ath) => !ath.hasActiveWorkoutPlan);
    } else if (activeFilter === "pending_prescription") {
      result = result.filter(
        (ath) =>
          (ath.pendingPrescriptionsCount ?? 0) > 0 ||
          ath.activePrescription?.status === "SENT",
      );
    }

    // 2. Busca por texto (nome ou email)
    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;

    return result.filter(
      (ath) =>
        ath.name.toLowerCase().includes(q) ||
        ath.email.toLowerCase().includes(q),
    );
  }, [athletes, searchQuery, activeFilter, referenceTime]);

  const handleRevoke = (linkId: string) => {
    startTransition(async () => {
      const res = await revokeStudentAction(linkId);
      if (!res.success) {
        toast.error(res.error);
        setConfirmingLinkId(null);
      } else {
        toast.success("Vínculo encerrado com sucesso.");
        setConfirmingLinkId(null);
      }
    });
  };

  if (athletes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <User className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Nenhum aluno ativo
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Seus alunos vinculados aparecerão aqui assim que aceitarem o link de
            convite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. KPIs de Aderência e Prescrições */}
      <PersonalDashboardKpis
        activeCount={activeCount || athletes.length}
        limit={limit}
        summary={summary}
        activeFilter={activeFilter}
        onFilterClick={(f) => setActiveFilter(f as FilterType)}
      />

      {/* 2. Header da Lista com Contagem e Busca */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Alunos Vinculados ({athletes.length})
          </h2>
          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="font-heading text-[11px] text-primary hover:underline font-semibold"
            >
              Ver todos ({athletes.length})
            </button>
          )}
        </div>

        {/* Chips de Filtro Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 transition-all ${
              activeFilter === "all"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({athletes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("active")}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 flex items-center gap-1 transition-all ${
              activeFilter === "active"
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            <Flame className="size-3" />
            <span>Ativos ({summary?.activeThisWeekCount ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("at_risk")}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 flex items-center gap-1 transition-all ${
              activeFilter === "at_risk"
                ? "bg-amber-500 text-black shadow-xs font-bold"
                : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            <AlertTriangle className="size-3" />
            <span>Em Alerta ({summary?.atRiskCount ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("without_plan")}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 flex items-center gap-1 transition-all ${
              activeFilter === "without_plan"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Dumbbell className="size-3" />
            <span>Sem Treino ({summary?.withoutPlanCount ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("pending_prescription")}
            className={`px-3 py-1 rounded-full text-xs font-heading font-semibold shrink-0 flex items-center gap-1 transition-all ${
              activeFilter === "pending_prescription"
                ? "bg-blue-500 text-white shadow-xs"
                : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
            }`}
          >
            <Send className="size-3" />
            <span>Aguardando ({summary?.pendingPrescriptionsCount ?? 0})</span>
          </button>
        </div>

        {/* Busca por Texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar aluno por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 text-xs placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Limpar campo de busca"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Alunos Filtrados */}
      {filteredAthletes.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-6 text-center flex flex-col items-center gap-2">
          <p className="font-heading text-xs text-muted-foreground">
            {searchQuery ? (
              <>
                Nenhum aluno encontrado para &quot;
                <strong>{searchQuery}</strong>&quot;
              </>
            ) : (
              "Nenhum aluno encontrado com os filtros selecionados."
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="h-7 text-xs font-heading text-primary"
          >
            {searchQuery ? "Limpar busca" : "Limpar filtros"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAthletes.map((ath) => {
            const isConfirming = confirmingLinkId === ath.linkId;

            // Análise de tempo desde o último treino
            let lastWorkoutDays: number | null = null;
            if (ath.lastWorkoutSessionAt) {
              const diffMs =
                referenceTime - new Date(ath.lastWorkoutSessionAt).getTime();
              lastWorkoutDays = Math.max(
                0,
                Math.floor(diffMs / (1000 * 60 * 60 * 24)),
              );
            }

            const workoutsThisWeek = ath.workoutsThisWeekCount ?? 0;
            const hasPlan = ath.hasActiveWorkoutPlan ?? false;
            const isAtRisk =
              ath.evolutionShared &&
              (!ath.lastWorkoutSessionAt || (lastWorkoutDays ?? 0) >= 4);

            return (
              <div
                key={ath.linkId}
                className="group relative rounded-2xl border border-border/70 bg-card p-4 flex flex-col gap-3 shadow-xs hover:border-primary/40 hover:bg-card/90 transition-all"
              >
                {/* Linha Superior: Avatar, Nome, E-mail e Chevron */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/personal/alunos/${ath.athleteId}`}
                    className="flex items-center gap-3 min-w-0 flex-1 outline-none group/link"
                  >
                    <Avatar className="size-11 shrink-0 border border-border/60 shadow-xs">
                      <AvatarImage
                        src={ath.image ?? undefined}
                        alt={ath.name}
                      />
                      <AvatarFallback className="font-heading text-xs font-bold bg-muted text-foreground">
                        {ath.name?.charAt(0)?.toUpperCase() ?? "A"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading text-sm font-bold text-foreground truncate group-hover/link:text-primary transition-colors">
                          {ath.name}
                        </span>
                        {isAtRisk && (
                          <span
                            className="size-2 rounded-full bg-amber-500 shrink-0 animate-pulse"
                            title="Em alerta: mais de 4 dias sem treino"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {ath.email}
                      </span>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground/40 group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Ação de Desvincular / Revogar */}
                  <div className="shrink-0 flex items-center">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg animate-in fade-in duration-150">
                        <span className="font-heading text-[11px] font-semibold text-destructive">
                          Encerrar?
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleRevoke(ath.linkId)}
                          className="h-6 px-2 font-heading text-[11px] font-bold rounded-md"
                        >
                          {isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            "Sim"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setConfirmingLinkId(null)}
                          className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
                        >
                          Não
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingLinkId(ath.linkId)}
                        className="text-muted-foreground/60 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Encerrar vínculo com aluno"
                      >
                        <UserX className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Linha Intermediária: Badges de Status & Indicadores */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {/* Status do Treino Concluído */}
                  {ath.evolutionShared ? (
                    ath.lastWorkoutSessionAt ? (
                      lastWorkoutDays === 0 ? (
                        <Badge
                          variant="outline"
                          className="font-heading text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1 py-0.5"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          <span>Treinou hoje</span>
                        </Badge>
                      ) : lastWorkoutDays === 1 ? (
                        <Badge
                          variant="outline"
                          className="font-heading text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1 py-0.5"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          <span>Treinou ontem</span>
                        </Badge>
                      ) : lastWorkoutDays !== null && lastWorkoutDays < 4 ? (
                        <Badge
                          variant="outline"
                          className="font-heading text-[10px] font-semibold border-border bg-muted/50 text-muted-foreground gap-1 py-0.5"
                        >
                          <span>Há {lastWorkoutDays}d sem treinar</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="font-heading text-[10px] font-semibold border-amber-500/40 bg-amber-500/15 text-amber-400 gap-1 py-0.5"
                        >
                          <AlertTriangle className="size-2.5 text-amber-400 shrink-0" />
                          <span>Alerta: {lastWorkoutDays}d sem treino</span>
                        </Badge>
                      )
                    ) : (
                      <Badge
                        variant="outline"
                        className="font-heading text-[10px] font-semibold border-border/80 bg-muted/40 text-muted-foreground py-0.5"
                      >
                        Nenhum treino concluído
                      </Badge>
                    )
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-medium border-border/60 bg-muted/30 text-muted-foreground/70 gap-1 py-0.5"
                      title="O aluno ainda não autorizou o compartilhamento da evolução"
                    >
                      <Lock className="size-2.5" />
                      <span>Evolução não compartilhada</span>
                    </Badge>
                  )}

                  {/* Frequência Semanal */}
                  {workoutsThisWeek > 0 && (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1 py-0.5"
                    >
                      <Flame className="size-3 text-emerald-500" />
                      <span>
                        {workoutsThisWeek}{" "}
                        {workoutsThisWeek === 1 ? "treino" : "treinos"} na
                        semana
                      </span>
                    </Badge>
                  )}

                  {/* Plano de Treino Atual */}
                  {hasPlan ? (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-semibold border-border bg-card/80 text-foreground gap-1 py-0.5"
                    >
                      <Dumbbell className="size-2.5 text-muted-foreground" />
                      <span className="truncate max-w-[130px]">
                        {ath.activeWorkoutPlanName || "Plano Ativo"}
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-bold border-primary/30 bg-primary/10 text-primary gap-1 py-0.5"
                    >
                      <AlertTriangle className="size-2.5 text-primary shrink-0" />
                      <span>Sem treino ativo</span>
                    </Badge>
                  )}

                  {/* Prescrição Pendente ou Rascunho */}
                  {ath.activePrescription?.status === "SENT" ? (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-semibold border-blue-500/40 bg-blue-500/15 text-blue-400 gap-1 py-0.5"
                    >
                      <Send className="size-2.5 text-blue-400" />
                      <span>Aguardando aceite do aluno</span>
                    </Badge>
                  ) : ath.activePrescription?.status === "DRAFT" ? (
                    <Badge
                      variant="outline"
                      className="font-heading text-[10px] font-medium border-border bg-muted/60 text-muted-foreground gap-1 py-0.5"
                    >
                      <FileEdit className="size-2.5" />
                      <span>Rascunho salvo</span>
                    </Badge>
                  ) : null}
                </div>

                {/* Linha Inferior: Ações Rápidas (Prescrever, Incentivar WhatsApp, Ver Painel) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    {/* Botão de Prescrição Rápida */}
                    {!hasPlan ? (
                      <Link
                        href={`/personal/alunos/${ath.athleteId}/prescrever`}
                      >
                        <Button
                          size="sm"
                          className="h-7 px-2.5 rounded-lg font-heading text-[11px] font-bold gap-1 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        >
                          <Plus className="size-3" />
                          <span>Prescrever Treino</span>
                        </Button>
                      </Link>
                    ) : ath.activePrescription?.status === "DRAFT" ? (
                      <Link
                        href={`/personal/alunos/${ath.athleteId}/prescricoes/${ath.activePrescription.id}/editar`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 rounded-lg font-heading text-[11px] font-semibold gap-1 text-foreground"
                        >
                          <FileEdit className="size-3 text-muted-foreground" />
                          <span>Editar Rascunho</span>
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href={`/personal/alunos/${ath.athleteId}?tab=prescriptions`}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 rounded-lg font-heading text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Dumbbell className="size-3" />
                          <span>Prescrições</span>
                        </Button>
                      </Link>
                    )}

                    {/* Botão de Incentivo / WhatsApp */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setIncentiveAthlete({
                          athleteId: ath.athleteId,
                          name: ath.name,
                          email: ath.email,
                          workoutsThisWeekCount: ath.workoutsThisWeekCount ?? 0,
                          lastWorkoutSessionAt: ath.lastWorkoutSessionAt,
                          hasActiveWorkoutPlan:
                            ath.hasActiveWorkoutPlan ?? false,
                          activeWorkoutPlanName: ath.activeWorkoutPlanName,
                          pendingPrescriptionsCount:
                            ath.pendingPrescriptionsCount ?? 0,
                          activePrescription: ath.activePrescription,
                        })
                      }
                      className="h-7 px-2.5 rounded-lg font-heading text-[11px] font-semibold gap-1 text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15"
                      title="Enviar incentivo no WhatsApp"
                    >
                      <MessageCircle className="size-3 text-emerald-500" />
                      <span>Incentivar</span>
                    </Button>
                  </div>

                  <Link
                    href={`/personal/alunos/${ath.athleteId}`}
                    className="font-heading text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver Painel</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Incentivo e Mensagem WhatsApp */}
      <CoachAthleteIncentiveModal
        athlete={incentiveAthlete}
        isOpen={Boolean(incentiveAthlete)}
        onClose={() => setIncentiveAthlete(null)}
      />
    </div>
  );
}
