"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarRange,
  ChevronRight,
  Dumbbell,
  Layers,
} from "lucide-react";

import type {
  GetPlanningOverview200ActiveContext,
  GetPlanningOverview200PeriodizationsItem,
  GetPlanningOverview200PlansItem,
} from "@/app/_lib/api/fetch-generated";
import { WorkoutCover } from "@/app/_components/workout-cover";
import { Badge } from "@/components/ui/badge";
import { PlannedDeadlineBadge } from "./planned-deadline-badge";
import { WorkoutPlanCard } from "./workout-plan-card";

interface PlanningHubProps {
  activeContext: GetPlanningOverview200ActiveContext;
  plans: GetPlanningOverview200PlansItem[];
  periodizations: GetPlanningOverview200PeriodizationsItem[];
}

export function PlanningHub({
  activeContext,
  plans,
  periodizations,
}: PlanningHubProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "periodizations">(
    "plans",
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO CARD: Rotina em Execução */}
      <section
        aria-labelledby="active-routine-heading"
        className="flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between">
          <h2
            id="active-routine-heading"
            className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Rotina em Execução
          </h2>
        </div>

        {activeContext.type === "NONE" && (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/60 p-6 text-center shadow-xs">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Dumbbell className="size-6" />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Nenhum plano ativo no momento
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
              Ative um plano existente ou crie uma nova rotina personalizada
              para acompanhar seus treinos.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/planning/plans/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <span>Criar plano manual</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {activeContext.type === "STANDALONE_PLAN" && (
          <div className="group relative overflow-hidden rounded-3xl border border-border/60 p-6 shadow-md transition hover:border-primary/50">
            <WorkoutCover name={activeContext.plan.name} variant="plan" />

            <div className="relative flex flex-col justify-between gap-5 z-10 min-h-[170px]">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 border border-emerald-500/30 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-heading text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    PLANO EM EXECUÇÃO
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                  <Calendar className="size-3.5 text-primary" />
                  <span>
                    {activeContext.plan.workoutDaysCount}{" "}
                    {activeContext.plan.workoutDaysCount === 1 ? "dia" : "dias"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-2xl font-bold leading-tight text-white drop-shadow-sm">
                  {activeContext.plan.name}
                </h3>
                <p className="text-xs text-white/70">
                  Rotina semanal fixa ativa para seus treinos diários.
                </p>
              </div>

              <div className="flex items-center justify-end pt-1">
                <Link
                  href={`/workout-plans/${activeContext.plan.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 font-heading text-xs font-bold shadow-md transition hover:bg-white/90 active:scale-95"
                >
                  <span>Abrir rotina ativa</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeContext.type === "PERIODIZATION" && (
          <div className="group relative overflow-hidden rounded-3xl border border-primary/30 p-6 shadow-md transition hover:border-primary/60">
            <WorkoutCover
              name={activeContext.periodization.name}
              variant="cycle"
            />

            <div className="relative flex flex-col justify-between gap-5 z-10 min-h-[190px]">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/25 px-3 py-1 border border-primary/40 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-heading text-[11px] font-bold uppercase tracking-wider text-primary">
                    PERIODIZAÇÃO ATIVA
                  </span>
                </div>

                <div className="rounded-full bg-black/50 px-3 py-1 font-heading text-xs font-semibold text-white/90 backdrop-blur-md">
                  Etapa {activeContext.periodization.currentBlock.order} de{" "}
                  {activeContext.periodization.totalBlocks}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-2xl font-bold leading-tight text-white drop-shadow-sm">
                  {activeContext.periodization.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <Dumbbell className="size-4 text-amber-400" />
                  <span>
                    Bloco atual:{" "}
                    {activeContext.periodization.currentBlock.workoutPlanName}
                  </span>
                </div>

                {/* Barra de Progresso do Ciclo */}
                <div className="mt-1 flex flex-col gap-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-xs">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          (activeContext.periodization.currentBlock.order /
                            Math.max(
                              activeContext.periodization.totalBlocks,
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <PlannedDeadlineBadge
                  plannedEndDate={
                    activeContext.periodization.currentBlock.plannedEndDate
                  }
                />

                <Link
                  href={`/planning/periodizations/${activeContext.periodization.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 font-heading text-xs font-bold shadow-md transition hover:bg-white/90 active:scale-95"
                >
                  <span>Ver ciclo completo</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. SEGMENTAÇÃO POR ABAS: Planos vs Periodizações */}
      <section className="flex flex-col gap-4">
        {/* Switchers de Aba com visual escuro de alto contraste */}
        <div className="flex items-center rounded-2xl border border-border/80 bg-muted/30 p-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-heading text-xs font-bold transition-all ${
              activeTab === "plans"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className="size-3.5" />
            <span>Planos de Treino</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "plans"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {plans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("periodizations")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-heading text-xs font-bold transition-all ${
              activeTab === "periodizations"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Periodizações</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "periodizations"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {periodizations.length}
            </span>
          </button>
        </div>

        {/* Conteúdo da Aba: Planos de Treino */}
        {activeTab === "plans" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/40 py-10 px-5 text-center">
                <Dumbbell className="size-8 text-muted-foreground/40 mb-1" />
                <p className="font-heading text-sm font-semibold text-foreground">
                  Nenhum plano de treino cadastrado
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Crie seu primeiro plano de treino.
                </p>
                <Link
                  href="/planning/plans/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  <span>Criar novo plano</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {plans.map((plan) => (
                  <WorkoutPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da Aba: Periodizações */}
        {activeTab === "periodizations" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {periodizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/40 py-10 px-5 text-center">
                <CalendarRange className="size-8 text-muted-foreground/40 mb-1" />
                <p className="font-heading text-sm font-semibold text-foreground">
                  Nenhuma periodização criada
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Periodizações organizam etapas e blocos de treino progressivos
                  ao longo das semanas.
                </p>
                <Link
                  href="/planning/periodizations/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm"
                >
                  <span>Criar periodização</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {periodizations.map((periodization) => {
                  let statusLabel = "RASCUNHO";
                  let statusVariant: "default" | "secondary" | "outline" =
                    "secondary";
                  let progressText = `${periodization.totalBlocks} etapas`;

                  if (periodization.status === "ACTIVE") {
                    statusLabel = "ATIVA";
                    statusVariant = "default";
                    progressText = `${periodization.completedBlocks} de ${periodization.totalBlocks} etapas concluídas`;
                  } else if (periodization.status === "PAUSED") {
                    statusLabel = "PAUSADA";
                    statusVariant = "secondary";
                    progressText = periodization.currentBlock
                      ? `Última etapa: ${periodization.currentBlock.workoutPlanName}`
                      : "Não iniciada";
                  } else if (periodization.status === "COMPLETED") {
                    statusLabel = "CONCLUÍDA";
                    statusVariant = "outline";
                    progressText = `${periodization.completedBlocks} de ${periodization.totalBlocks} etapas executadas`;
                  }

                  return (
                    <Link
                      key={periodization.id}
                      href={`/planning/periodizations/${periodization.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CalendarRange className="size-4 text-primary shrink-0" />
                            <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {periodization.name}
                            </h3>
                          </div>
                          {periodization.goal && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                              {periodization.goal}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant={statusVariant}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                        >
                          {statusLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground pl-6">
                        <span className="font-heading font-medium text-foreground/80">
                          {progressText}
                        </span>
                        <div className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                          <span className="text-[11px] font-bold">
                            Ver ciclo
                          </span>
                          <ChevronRight className="size-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
