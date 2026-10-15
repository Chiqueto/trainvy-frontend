"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock3,
  Dumbbell,
  Filter,
  History,
  Layers3,
  LineChart,
  Loader2,
  Lock,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
} from "lucide-react";
import type {
  GetCoachAthleteProgressOverview200,
  GetCoachAthleteProgressSessionDetail200,
  GetMuscleTrainingAnalytics200,
  GetWeeklyTrainingAnalytics200WeeksItem,
  ListCoachAthleteProgressSessions200ItemsItem,
} from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalDate } from "@/app/_components/local-date";
import {
  formatDuration,
  formatWeightKg,
  getHistorySessionTitle,
} from "@/app/_lib/training-formatters";
import { WeeklyVolumeChart } from "@/app/stats/_components/weekly-volume-chart";
import { MuscleDistribution } from "@/app/stats/_components/muscle-distribution";
import {
  fetchCoachAthleteProgressOverviewAction,
  fetchCoachAthleteProgressSessionDetailAction,
  fetchCoachAthleteProgressSessionsAction,
  type EvolutionRange,
} from "@/app/personal/alunos/[athleteId]/_actions";
import { CoachProgressSessionModal } from "./coach-progress-session-modal";
import { CoachProgressExerciseView } from "./coach-progress-exercise-view";

interface CoachAthleteEvolutionDashboardProps {
  athleteId: string;
  athleteName: string;
}

type EvolutionSubTab = "overview" | "sessions" | "exercises";

export function CoachAthleteEvolutionDashboard({
  athleteId,
  athleteName,
}: CoachAthleteEvolutionDashboardProps) {
  const [subTab, setSubTab] = useState<EvolutionSubTab>("overview");
  const [weeksCount, setWeeksCount] = useState<EvolutionRange>(4);
  const [timezone, setTimezone] = useState<string>("UTC");

  // Estados de Overview
  const [overviewData, setOverviewData] =
    useState<GetCoachAthleteProgressOverview200 | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewStatus, setOverviewStatus] = useState<number | null>(null);
  const [overviewErrorCode, setOverviewErrorCode] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Estados de Sessões
  const [sessions, setSessions] = useState<ListCoachAthleteProgressSessions200ItemsItem[]>([]);
  const [sessionsNextCursor, setSessionsNextCursor] = useState<string | null>(null);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [sessionsOrigin, setSessionsOrigin] = useState<"ALL" | "PLANNED" | "FREE">("ALL");
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMoreSessions, setIsLoadingMoreSessions] = useState(false);

  // Modal de Detalhe de Sessão
  const [selectedSessionDetail, setSelectedSessionDetail] =
    useState<GetCoachAthleteProgressSessionDetail200 | null>(null);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);

  // Detecta Timezone do Navegador
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  // Carrega Overview de Progresso
  const loadOverview = useCallback(
    async (range: EvolutionRange, tz: string) => {
      setIsLoadingOverview(true);
      setOverviewError(null);
      setOverviewErrorCode(null);

      const res = await fetchCoachAthleteProgressOverviewAction({
        athleteId,
        weeksCount: range,
        tz,
      });

      setOverviewStatus(res.status);
      if (res.success) {
        setOverviewData(res.data);
      } else {
        setOverviewErrorCode(res.code ?? null);
        setOverviewError(res.error);
      }
      setIsLoadingOverview(false);
    },
    [athleteId],
  );

  useEffect(() => {
    loadOverview(weeksCount, timezone);
  }, [weeksCount, timezone, loadOverview]);

  // Carrega Lista de Sessões
  const loadSessions = useCallback(
    async (originFilter: "ALL" | "PLANNED" | "FREE") => {
      setIsLoadingSessions(true);
      const res = await fetchCoachAthleteProgressSessionsAction({
        athleteId,
        limit: 10,
        origin: originFilter === "ALL" ? undefined : originFilter,
      });

      if (res.success) {
        setSessions(res.data.items);
        setSessionsNextCursor(res.data.nextCursor);
        setSessionsHasMore(res.data.hasMore);
      }
      setIsLoadingSessions(false);
    },
    [athleteId],
  );

  useEffect(() => {
    if (subTab === "sessions") {
      loadSessions(sessionsOrigin);
    }
  }, [subTab, sessionsOrigin, loadSessions]);

  // Paginação de Sessões
  const handleLoadMoreSessions = async () => {
    if (!sessionsNextCursor || isLoadingMoreSessions) return;
    setIsLoadingMoreSessions(true);

    const res = await fetchCoachAthleteProgressSessionsAction({
      athleteId,
      cursor: sessionsNextCursor,
      limit: 10,
      origin: sessionsOrigin === "ALL" ? undefined : sessionsOrigin,
    });

    if (res.success) {
      setSessions((prev) => [...prev, ...res.data.items]);
      setSessionsNextCursor(res.data.nextCursor);
      setSessionsHasMore(res.data.hasMore);
    }
    setIsLoadingMoreSessions(false);
  };

  // Abrir Modal de Sessão
  const handleOpenSession = async (sessionId: string) => {
    setIsLoadingSessionDetail(true);
    const res = await fetchCoachAthleteProgressSessionDetailAction({
      athleteId,
      sessionId,
    });
    if (res.success) {
      setSelectedSessionDetail(res.data);
    }
    setIsLoadingSessionDetail(false);
  };

  // 1. ESTADO: CARREGANDO INICIAL
  if (isLoadingOverview && !overviewData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="font-heading text-sm font-semibold text-foreground">
          Carregando dados de evolução do aluno...
        </p>
        <p className="text-xs text-muted-foreground">
          Verificando autorizações e compilando métricas.
        </p>
      </div>
    );
  }

  // 2. ESTADO: SEM CONSENTIMENTO (403 SHARING_NOT_AUTHORIZED)
  if (
    overviewStatus === 403 &&
    overviewErrorCode === "SHARING_NOT_AUTHORIZED"
  ) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Lock className="size-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Compartilhamento Não Autorizado
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este aluno ainda não autorizou o compartilhamento do histórico de treinos.
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 text-left max-w-md w-full space-y-2">
          <div className="flex items-center gap-2 font-heading font-semibold text-xs text-foreground">
            <Shield className="size-4 text-primary shrink-0" />
            <span>Como o aluno pode habilitar:</span>
          </div>
          <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1 leading-relaxed">
            <li>Acessar o Trainvy pelo seu próprio login de atleta.</li>
            <li>Navegar até a aba <strong>Perfil</strong>.</li>
            <li>Na seção <strong>Meu Treinador</strong>, localizar <strong>Compartilhamento de evolução</strong>.</li>
            <li>Ativar a chave de autorização.</li>
          </ol>
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          Por motivos de privacidade e conformidade LGPD/GDPR, métricas e sessões
          permanecem estritamente privadas até a concessão explícita.
        </p>
      </div>
    );
  }

  // 3. ESTADO: ERRO DE ENTITLEMENT OU ACESSO NEGADO
  if (overviewStatus === 403) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center text-center gap-3">
        <ShieldAlert className="size-8 text-destructive" />
        <h2 className="font-heading text-base font-bold text-foreground">
          Acesso Restrito
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {overviewError ??
            "Sua assinatura atual não possui permissão para visualizar o histórico de alunos."}
        </p>
      </div>
    );
  }

  // 4. ESTADO: VÍNCULO NÃO ENCONTRADO (404)
  if (overviewStatus === 404) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center text-center gap-3">
        <AlertCircle className="size-8 text-muted-foreground" />
        <h2 className="font-heading text-base font-bold text-foreground">
          Vínculo Inativo ou Revogado
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Não foi encontrado um vínculo ativo com este aluno.
        </p>
      </div>
    );
  }

  // 5. ESTADO: ERRO INESPERADO OU FALHA DE CONEXÃO
  if (!overviewData || overviewError) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center text-center gap-3">
        <AlertCircle className="size-8 text-amber-500" />
        <h2 className="font-heading text-base font-bold text-foreground">
          Falha ao carregar evolução
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {overviewError ??
            "Não foi possível carregar os dados de evolução do aluno no momento."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadOverview(weeksCount, timezone)}
          className="rounded-xl font-heading text-xs font-semibold gap-1.5 mt-2"
        >
          <RefreshCw className="size-3.5" />
          <span>Tentar Novamente</span>
        </Button>
      </div>
    );
  }

  const { summary, weekly, muscles } = overviewData;

  return (
    <div className="space-y-5">
      {/* Sub-navegação interna de Evolução */}
      <div className="grid grid-cols-3 p-1 rounded-2xl bg-muted/60 border border-border/60">
        <button
          type="button"
          onClick={() => setSubTab("overview")}
          className={`h-8 rounded-xl font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === "overview"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LineChart className="size-3.5" />
          <span>Resumo</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("sessions")}
          className={`h-8 rounded-xl font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === "sessions"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="size-3.5" />
          <span>Sessões</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("exercises")}
          className={`h-8 rounded-xl font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            subTab === "exercises"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Dumbbell className="size-3.5" />
          <span>Por Exercício</span>
        </button>
      </div>

      {/* SUB-VIEW 1: RESUMO & GRÁFICOS */}
      {subTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Seletor de Período Temporal */}
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Período de Análise
            </span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
              {([4, 8, 12] as EvolutionRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setWeeksCount(range)}
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
          </div>

          {/* Cards dos Indicadores Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Dumbbell className="size-3.5 text-primary" />
                <span>Treinos Concluídos</span>
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-foreground">
                {summary.totalWorkouts}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                nas últimas {weeksCount} semanas
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Activity className="size-3.5 text-primary" />
                <span>Frequência Semanal</span>
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-foreground">
                {summary.weeklyFrequency}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  /sem
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                média do período
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Layers3 className="size-3.5 text-primary" />
                <span>Séries Válidas</span>
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-foreground">
                {summary.totalWorkingSets}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                séries de trabalho
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Scale className="size-3.5 text-primary" />
                <span>Volume Total</span>
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-foreground truncate">
                {summary.totalLoadVolumeKg > 0
                  ? formatWeightKg(summary.totalLoadVolumeKg)
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                carga acumulada
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Clock3 className="size-3.5 text-primary" />
                <span>Duração Média</span>
              </div>
              <p className="mt-1 font-heading text-xl font-bold text-foreground">
                {formatDuration(summary.averageDurationInSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                por sessão concluída
              </p>
            </div>
          </div>

          {/* Gráfico 1: Volume Semanal */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-xs overflow-hidden">
            <WeeklyVolumeChart
              weeks={weekly.weeks as unknown as GetWeeklyTrainingAnalytics200WeeksItem[]}
            />
          </div>

          {/* Gráfico 2: Distribuição Muscular */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-xs overflow-hidden">
            <MuscleDistribution
              analytics={muscles as unknown as GetMuscleTrainingAnalytics200}
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: SESSÕES CONCLUÍDAS */}
      {subTab === "sessions" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filtros de Origem */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filtrar:</span>
            </div>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
              {(
                [
                  { key: "ALL", label: "Todos" },
                  { key: "PLANNED", label: "Planejados" },
                  { key: "FREE", label: "Avulsos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSessionsOrigin(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                    sessionsOrigin === f.key
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de Carregamento de Sessões */}
          {isLoadingSessions && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">
                Buscando histórico autorizado...
              </p>
            </div>
          )}

          {/* Lista de Sessões */}
          {!isLoadingSessions && sessions.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
              <Dumbbell className="size-8 text-muted-foreground mx-auto" />
              <p className="font-heading text-sm font-semibold text-foreground">
                Nenhum treino concluído encontrado
              </p>
              <p className="text-xs text-muted-foreground">
                Não há sessões concluídas dentro do período e escopo autorizados.
              </p>
            </div>
          )}

          {!isLoadingSessions && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((session) => {
                const title = getHistorySessionTitle(session);
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleOpenSession(session.id)}
                    className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {title}
                        </h4>
                        {session.origin === "PLANNED" &&
                          session.workoutPlanNameSnapshot &&
                          session.workoutPlanNameSnapshot !== title && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {session.workoutPlanNameSnapshot}
                            </p>
                          )}
                        <LocalDate
                          isoDate={session.completedAt}
                          className="text-[11px] text-muted-foreground block mt-1"
                        />
                      </div>

                      <Badge
                        variant={
                          session.origin === "PLANNED" ? "default" : "secondary"
                        }
                        className="font-heading text-[10px] uppercase font-bold shrink-0"
                      >
                        {session.origin === "PLANNED" ? "Planejado" : "Avulso"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Dumbbell className="size-3 text-primary shrink-0" />
                        <span>{session.exercisesCount} exercícios</span>
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Layers3 className="size-3 text-primary shrink-0" />
                        <span>{session.workingSetsCount} séries</span>
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Clock3 className="size-3 text-primary shrink-0" />
                        <span>{formatDuration(session.durationInSeconds)}</span>
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Scale className="size-3 text-primary shrink-0" />
                        <span>
                          {session.totalLoadVolumeKg > 0
                            ? formatWeightKg(session.totalLoadVolumeKg)
                            : "—"}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Botão Carregar Mais */}
              {sessionsHasMore && (
                <div className="pt-2 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreSessions}
                    disabled={isLoadingMoreSessions}
                    className="rounded-xl font-heading text-xs font-semibold gap-1.5"
                  >
                    {isLoadingMoreSessions && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    <span>Carregar Mais Treinos</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: EVOLUÇÃO POR EXERCÍCIO */}
      {subTab === "exercises" && (
        <div className="animate-in fade-in duration-200">
          <CoachProgressExerciseView athleteId={athleteId} />
        </div>
      )}

      {/* Modal Read-Only de Detalhes da Sessão */}
      {selectedSessionDetail && (
        <CoachProgressSessionModal
          session={selectedSessionDetail}
          onClose={() => setSelectedSessionDetail(null)}
        />
      )}

      {/* Indicador de Carregamento de Modal */}
      {isLoadingSessionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="rounded-2xl bg-card p-5 shadow-xl border border-border flex items-center gap-3">
            <Loader2 className="size-5 text-primary animate-spin" />
            <span className="text-xs font-heading font-semibold text-foreground">
              Carregando snapshot do treino...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
