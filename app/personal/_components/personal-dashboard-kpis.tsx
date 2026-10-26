"use client";

import {
  AlertTriangle,
  CalendarCheck2,
  ClipboardList,
  Dumbbell,
  Flame,
  Send,
  Users,
} from "lucide-react";

interface PersonalDashboardKpisProps {
  activeCount: number;
  limit: number | null;
  summary?: {
    totalAthletes: number;
    activeThisWeekCount: number;
    atRiskCount: number;
    pendingPrescriptionsCount: number;
    withoutPlanCount: number;
  };
  onFilterClick?: (filter: string) => void;
  activeFilter?: string;
}

export function PersonalDashboardKpis({
  activeCount,
  limit,
  summary,
  onFilterClick,
  activeFilter = "all",
}: PersonalDashboardKpisProps) {
  const activeThisWeek = summary?.activeThisWeekCount ?? 0;
  const atRisk = summary?.atRiskCount ?? 0;
  const withoutPlan = summary?.withoutPlanCount ?? 0;
  const pendingPrescriptions = summary?.pendingPrescriptionsCount ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. Ativos Esta Semana */}
      <button
        type="button"
        onClick={() => onFilterClick?.("active")}
        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
          activeFilter === "active"
            ? "border-emerald-500/80 bg-emerald-500/10 shadow-xs"
            : "border-border/70 bg-card hover:border-emerald-500/40 hover:bg-card/90"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Treinaram na Semana
          </span>
          <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <Flame className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-heading text-xl font-bold text-foreground">
            {activeThisWeek}
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold">
            ativos
          </span>
        </div>
      </button>

      {/* 2. Em Alerta (+4 dias sem treino) */}
      <button
        type="button"
        onClick={() => onFilterClick?.("at_risk")}
        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
          activeFilter === "at_risk"
            ? "border-amber-500/80 bg-amber-500/10 shadow-xs"
            : "border-border/70 bg-card hover:border-amber-500/40 hover:bg-card/90"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Em Alerta (+4d)
          </span>
          <div
            className={`flex size-6 items-center justify-center rounded-lg ${
              atRisk > 0
                ? "bg-amber-500/20 text-amber-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={`font-heading text-xl font-bold ${
              atRisk > 0 ? "text-amber-500" : "text-foreground"
            }`}
          >
            {atRisk}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {atRisk === 1 ? "aluno" : "alunos"}
          </span>
        </div>
      </button>

      {/* 3. Sem Treino Ativo */}
      <button
        type="button"
        onClick={() => onFilterClick?.("without_plan")}
        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
          activeFilter === "without_plan"
            ? "border-primary/80 bg-primary/10 shadow-xs"
            : "border-border/70 bg-card hover:border-primary/40 hover:bg-card/90"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Sem Plano Ativo
          </span>
          <div
            className={`flex size-6 items-center justify-center rounded-lg ${
              withoutPlan > 0
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ClipboardList className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-heading text-xl font-bold text-foreground">
            {withoutPlan}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            prescrever
          </span>
        </div>
      </button>

      {/* 4. Prescrições Aguardando Aceite */}
      <button
        type="button"
        onClick={() => onFilterClick?.("pending_prescription")}
        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
          activeFilter === "pending_prescription"
            ? "border-blue-500/80 bg-blue-500/10 shadow-xs"
            : "border-border/70 bg-card hover:border-blue-500/40 hover:bg-card/90"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            Aguardando Aluno
          </span>
          <div
            className={`flex size-6 items-center justify-center rounded-lg ${
              pendingPrescriptions > 0
                ? "bg-blue-500/20 text-blue-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Send className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={`font-heading text-xl font-bold ${
              pendingPrescriptions > 0 ? "text-blue-400" : "text-foreground"
            }`}
          >
            {pendingPrescriptions}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            enviadas
          </span>
        </div>
      </button>
    </div>
  );
}
