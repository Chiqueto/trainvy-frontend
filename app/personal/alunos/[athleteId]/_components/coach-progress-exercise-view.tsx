"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Search,
  Trophy,
} from "lucide-react";
import type {
  GetCoachAthleteProgressExerciseEvolution200,
  ListCoachAthleteProgressExercises200Item,
} from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDate } from "@/app/_components/local-date";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import {
  formatSetDuration,
  formatWeightInGrams,
  formatWeightKg,
} from "@/app/_lib/training-formatters";
import {
  fetchCoachAthleteProgressExercisesAction,
  fetchCoachAthleteProgressExerciseEvolutionAction,
} from "@/app/personal/alunos/[athleteId]/_actions";

interface CoachProgressExerciseViewProps {
  athleteId: string;
}

export function CoachProgressExerciseView({
  athleteId,
}: CoachProgressExerciseViewProps) {
  const [exercises, setExercises] = useState<ListCoachAthleteProgressExercises200Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const [evolutionData, setEvolutionData] =
    useState<GetCoachAthleteProgressExerciseEvolution200 | null>(null);
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Busca lista de exercícios com histórico autorizado (com debounce)
  const loadExercises = useCallback(
    async (q = "") => {
      setIsSearching(true);
      const res = await fetchCoachAthleteProgressExercisesAction({
        athleteId,
        q: q.trim() || undefined,
      });
      if (res.success) {
        setExercises(res.data);
      }
      setIsSearching(false);
    },
    [athleteId],
  );

  // Carregamento inicial e debounce na busca
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExercises(searchQuery);
    }, searchQuery ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery, loadExercises]);

  // Carregar evolução quando um exercício for selecionado
  const handleSelectExercise = async (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setEvolutionError(null);
    setIsLoadingEvolution(true);

    const res = await fetchCoachAthleteProgressExerciseEvolutionAction({
      athleteId,
      exerciseId,
      limit: 10,
    });

    if (res.success) {
      setEvolutionData(res.data);
    } else {
      setEvolutionError(res.error);
    }
    setIsLoadingEvolution(false);
  };

  // Carregar mais sessões (paginação via cursor)
  const handleLoadMore = async () => {
    if (!evolutionData?.nextCursor || isLoadingMore || !selectedExerciseId) return;

    setIsLoadingMore(true);
    const res = await fetchCoachAthleteProgressExerciseEvolutionAction({
      athleteId,
      exerciseId: selectedExerciseId,
      cursor: evolutionData.nextCursor,
      limit: 10,
    });

    if (res.success) {
      setEvolutionData((prev) => {
        if (!prev) return res.data;
        return {
          ...res.data,
          items: [...prev.items, ...res.data.items],
        };
      });
    }
    setIsLoadingMore(false);
  };

  return (
    <div className="space-y-5">
      {/* Barra de Seleção / Busca de Exercício */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label
            htmlFor="exercise-search"
            className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Selecione um Exercício com Histórico
          </label>
          <span className="text-[11px] text-muted-foreground">
            {exercises.length} encontrado(s)
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="exercise-search"
            placeholder="Buscar por nome do exercício..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl text-xs bg-muted/30"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />
          )}
        </div>

        {/* Chips de Exercícios Disponíveis */}
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
          {exercises.map((ex) => {
            const isSelected = selectedExerciseId === ex.id;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExercise(ex.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-muted/50 text-foreground hover:bg-muted border border-border/60"
                }`}
              >
                {isSelected && <Check className="size-3" />}
                <span>{ex.name}</span>
              </button>
            );
          })}

          {!isSearching && exercises.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 italic">
              Nenhum exercício com histórico autorizado encontrado.
            </p>
          )}
        </div>
      </section>

      {/* Estado: Carregando Detalhes */}
      {isLoadingEvolution && (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
          <Loader2 className="size-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">
            Calculando evolução e recordes autorizados...
          </p>
        </div>
      )}

      {/* Estado: Erro */}
      {evolutionError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <p className="text-xs leading-relaxed">{evolutionError}</p>
        </div>
      )}

      {/* Painel da Evolução do Exercício Selecionado */}
      {!isLoadingEvolution && evolutionData && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Cabeçalho do Exercício */}
          <div className="rounded-3xl border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {evolutionData.exercise.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {evolutionData.exercise.muscles.map((m) => (
                    <Badge
                      key={`${m.muscleGroup}-${m.role}`}
                      variant={m.role === "PRIMARY" ? "default" : "secondary"}
                      className="rounded-full text-[10px]"
                    >
                      {getMuscleGroupLabel(m.muscleGroup)} ·{" "}
                      {m.role === "PRIMARY" ? "Principal" : "Secundário"}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Card de PR (Recorde Pessoal) */}
              {evolutionData.loadPR && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 block">
                      Melhor Carga Registrada
                    </span>
                    <span className="font-heading text-base font-bold text-foreground">
                      {formatWeightInGrams(evolutionData.loadPR.weightInGrams)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {evolutionData.loadPR.reps !== null
                        ? `${evolutionData.loadPR.reps} reps`
                        : ""}{" "}
                      {evolutionData.loadPR.rir !== null
                        ? `@${evolutionData.loadPR.rir}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso quando dados são insuficientes para avaliar tendência */}
            {evolutionData.items.length < 2 && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 flex items-center gap-2.5 text-blue-600 dark:text-blue-400 text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  Histórico insuficiente para avaliar tendência (menos de 2
                  sessões registradas com este exercício no período autorizado).
                </span>
              </div>
            )}
          </div>

          {/* Linha do Tempo das Execuções */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs uppercase font-bold tracking-wider text-muted-foreground px-1">
              Execuções Registradas ({evolutionData.items.length})
            </h4>

            <div className="space-y-3">
              {evolutionData.items.map((session) => (
                <div
                  key={session.workoutSessionId}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
                    <div>
                      <LocalDate
                        isoDate={session.completedAt}
                        long
                        className="font-heading text-sm font-bold text-foreground block"
                      />
                      {(session.workoutPlanNameSnapshot || session.workoutDayNameSnapshot) && (
                        <p className="text-[11px] text-muted-foreground">
                          {session.workoutPlanNameSnapshot ?? "Treino"}{" "}
                          {session.workoutDayNameSnapshot &&
                            `· ${session.workoutDayNameSnapshot}`}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-semibold text-foreground">
                        {session.workingSetsCount}
                      </span>{" "}
                      <span className="text-muted-foreground">séries válidas</span>
                      {session.loadVolumeKg > 0 && (
                        <p className="text-[11px] font-mono text-muted-foreground">
                          Vol: {formatWeightKg(session.loadVolumeKg)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Séries Executadas nesta sessão */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {session.sets.map((set) => {
                      return (
                        <div
                          key={set.id}
                          className="rounded-xl p-2 text-xs border bg-muted/60 border-border/60 text-foreground"
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Série #{set.order}</span>
                            {set.durationInSeconds !== null && (
                              <span>{formatSetDuration(set.durationInSeconds)}</span>
                            )}
                          </div>
                          <div className="font-heading font-bold text-sm">
                            {set.weightInGrams !== null
                              ? formatWeightInGrams(set.weightInGrams)
                              : "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center justify-between mt-0.5">
                            <span>
                              {set.reps !== null ? `${set.reps} reps` : "—"}
                            </span>
                            {set.rir !== null && <span>RIR {set.rir}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Carregar Mais */}
            {evolutionData.hasMore && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="rounded-xl font-heading text-xs font-semibold gap-1.5"
                >
                  {isLoadingMore && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Carregar Mais Execuções</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
