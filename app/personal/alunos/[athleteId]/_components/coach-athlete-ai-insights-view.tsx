"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Dumbbell,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import type { GetCoachAthleteProgressInsights200 } from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchCoachAthleteProgressInsightsAction,
  type EvolutionRange,
} from "@/app/personal/alunos/[athleteId]/_actions";

interface CoachAthleteAiInsightsViewProps {
  athleteId: string;
  athleteName: string;
  weeksCount: EvolutionRange;
  onSelectWeeksCount: (weeks: EvolutionRange) => void;
}

export function CoachAthleteAiInsightsView({
  athleteId,
  athleteName,
  weeksCount,
  onSelectWeeksCount,
}: CoachAthleteAiInsightsViewProps) {
  const [insights, setInsights] =
    useState<GetCoachAthleteProgressInsights200 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  const loadInsights = useCallback(
    async (range: EvolutionRange) => {
      setIsLoading(true);
      setError(null);

      const res = await fetchCoachAthleteProgressInsightsAction({
        athleteId,
        weeksCount: range,
        tz: timezone,
      });

      if (res.success) {
        setInsights(res.data);
      } else {
        setError(res.error);
      }
      setIsLoading(false);
    },
    [athleteId, timezone],
  );

  useEffect(() => {
    void loadInsights(weeksCount);
  }, [weeksCount, loadInsights]);

  const handleRangeChange = (range: EvolutionRange) => {
    onSelectWeeksCount(range);
    void loadInsights(range);
  };

  const getStatusBadge = (
    status: "BALANCED" | "OVERTRAINED" | "UNDERTRAINED" | "ATTENTION",
  ) => {
    switch (status) {
      case "BALANCED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
            Equilibrado
          </Badge>
        );
      case "ATTENTION":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
            Atenção
          </Badge>
        );
      case "UNDERTRAINED":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
            Volume Baixo
          </Badge>
        );
      case "OVERTRAINED":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
            Volume Alto
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header com Seletor de Período e Botão de Atualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Brain className="size-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Diagnóstico Inteligente da IA</span>
              <Sparkles className="size-3.5 text-primary" />
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Análise biomecânica, desequilíbrios e diretrizes para prescrição
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
            {([4, 8, 12] as EvolutionRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                  weeksCount === range
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range} sem
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => loadInsights(weeksCount)}
            disabled={isLoading}
            className="size-8 rounded-xl shrink-0"
            title="Recalcular Análise IA"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Estado de Carregamento */}
      {isLoading && (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
            <Brain className="size-6 animate-bounce" />
          </div>
          <p className="font-heading text-sm font-semibold text-foreground">
            Consultando dados reais de {athleteName}...
          </p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Avaliando volume semanal, equilíbrio de grupamentos musculares e
            progressão de carga para gerar recomendações personalizadas.
          </p>
          <div className="flex items-center gap-2 text-xs text-primary font-medium mt-1">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Processando com Coach AI</span>
          </div>
        </div>
      )}

      {/* Estado de Erro */}
      {!isLoading && error && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 flex flex-col items-center text-center gap-2 text-xs text-destructive">
          <ShieldAlert className="size-6" />
          <p className="font-semibold">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadInsights(weeksCount)}
            className="mt-2 text-xs"
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Conteúdo Carregado */}
      {!isLoading && insights && (
        <div className="space-y-4">
          {/* Card 1: Resumo Executivo & Consistência */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumo Geral da Fase
              </span>
              <Badge variant="outline" className="text-[11px] font-semibold gap-1">
                <Zap className="size-3 text-primary" />
                <span>{insights.consistencyAssessment}</span>
              </Badge>
            </div>

            <p className="font-heading text-xs sm:text-sm leading-relaxed text-foreground">
              {insights.summary}
            </p>
          </div>

          {/* Grid: Destaques & Alertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Destaques Positivos */}
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-heading text-xs font-bold uppercase tracking-wider">
                <Trophy className="size-4" />
                <span>Pontos Fortes & Evolução</span>
              </div>
              <ul className="space-y-2">
                {insights.highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-foreground leading-relaxed"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pontos de Atenção & Alertas */}
            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-heading text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="size-4" />
                <span>Pontos de Atenção</span>
              </div>
              <ul className="space-y-2">
                {insights.warnings.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-foreground leading-relaxed"
                  >
                    <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Equilíbrio Muscular */}
          {insights.muscleBalanceInsights &&
            insights.muscleBalanceInsights.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Equilíbrio Muscular & Volume
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Agonistas vs Antagonistas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.muscleBalanceInsights.map((mb, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-heading text-xs font-semibold text-foreground truncate">
                          {mb.muscleGroup}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {mb.observation}
                        </p>
                      </div>
                      {getStatusBadge(mb.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recomendações Práticas para o Personal */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-primary font-heading text-xs font-bold uppercase tracking-wider">
              <Dumbbell className="size-4" />
              <span>Diretrizes para o Treinador</span>
            </div>

            <div className="space-y-2">
              {insights.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-secondary/40 p-2.5 text-xs text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sugestão de Foco para a Próxima Prescrição */}
          <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-4" />
                <span>Foco Sugerido na Próxima Prescrição</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {insights.suggestedFocusForNextPrescription}
              </p>
            </div>

            <Button
              asChild
              className="font-heading text-xs font-bold gap-2 rounded-2xl shadow-sm shrink-0"
            >
              <Link href={`/personal/alunos/${athleteId}/prescrever`}>
                <span>Criar Nova Prescrição</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
