"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Trophy, Dumbbell, Loader2, Calendar } from "lucide-react";

import { LocalDate } from "@/app/_components/local-date";
import type {
  GetExerciseEvolution200,
  GetExerciseEvolution200ItemsItem,
  GetExerciseEvolution200ItemsItemSetsItem,
} from "@/app/_lib/api/fetch-generated";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import {
  formatDateOnly,
  formatSetDuration,
  formatWeightInGrams,
  formatWeightKg,
  getHistorySessionTitle,
} from "@/app/_lib/training-formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { loadExerciseEvolutionPage } from "../../../_actions";
import { appendUniqueEvolutionSessions } from "../../../_lib/evolution-data";
import { Logo } from "@/app/_components/logo";

export function ExerciseEvolutionDetail({
  initialData,
}: {
  initialData: GetExerciseEvolution200;
}) {
  const [items, setItems] = useState(initialData.items);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorInFlightRef = useRef<string | null>(null);

  const loadMore = useCallback(async () => {
    const cursor = nextCursor;
    if (
      !cursor ||
      !hasMore ||
      isLoading ||
      cursorInFlightRef.current === cursor
    ) {
      return;
    }

    cursorInFlightRef.current = cursor;
    setIsLoading(true);
    setError(null);
    const response = await loadExerciseEvolutionPage({
      exerciseId: initialData.exercise.id,
      cursor,
    });

    if (response.success) {
      setItems((current) =>
        appendUniqueEvolutionSessions(current, response.data.items),
      );
      setNextCursor(response.data.nextCursor);
      setHasMore(response.data.hasMore);
    } else {
      setError(response.error);
    }
    setIsLoading(false);
    if (cursorInFlightRef.current === cursor) cursorInFlightRef.current = null;
  }, [hasMore, initialData.exercise.id, isLoading, nextCursor]);

  return (
    <div className="flex flex-col">
      {/* Top Bar Padrão Trainvy */}
      <div className="flex h-[56px] items-center justify-between border-b border-border/60 px-5">
        <Link
          href="/stats"
          className="inline-flex items-center gap-2 font-heading text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar para Estatísticas</span>
        </Link>
        <Logo size="sm" asLink />
      </div>

      <main className="trainvy-page mx-auto w-full px-5 pt-5 pb-8">
        {/* Cabeçalho do Exercício */}
        <header className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {initialData.exercise.name}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {initialData.exercise.muscles.map((muscle) => (
              <Badge
                key={`${muscle.muscleGroup}-${muscle.role}`}
                variant={muscle.role === "PRIMARY" ? "default" : "secondary"}
                className="rounded-full text-[10px] font-semibold"
              >
                {getMuscleGroupLabel(muscle.muscleGroup)} ·{" "}
                {muscle.role === "PRIMARY" ? "Principal" : "Secundário"}
              </Badge>
            ))}
          </div>
        </header>

        {/* PR de Carga */}
        <LoadPrCard loadPR={initialData.loadPR} hasHistory={items.length > 0} />

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <Dumbbell
              className="mx-auto size-8 text-muted-foreground/60"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-heading text-base font-semibold text-foreground">
              Nenhuma sessão registrada
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              As métricas e evolução aparecerão após registrar este exercício em um treino concluído.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full font-heading text-xs font-semibold">
              <Link href="/history">Ver histórico</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Gráfico de Evolução com Valores e Interatividade */}
            <ExerciseLoadChart items={items} />

            {/* Lista de Sessões Anteriores */}
            <section aria-labelledby="exercise-sessions-title" className="mt-7 flex flex-col gap-3">
              <h2
                id="exercise-sessions-title"
                className="font-heading text-base font-semibold text-foreground flex items-center gap-2"
              >
                <Calendar className="size-4 text-primary" />
                Histórico de Execuções ({items.length})
              </h2>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <ExerciseSessionCard key={item.workoutSessionId} item={item} />
                ))}
              </div>
            </section>

            {hasMore && nextCursor && (
              <div className="mt-6 text-center">
                {error && (
                  <p className="mb-2 text-xs text-destructive">{error}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full font-heading text-xs font-semibold"
                  disabled={isLoading}
                  onClick={() => void loadMore()}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
                  )}
                  {error ? "Tentar novamente" : "Carregar mais sessões"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function LoadPrCard({
  loadPR,
  hasHistory,
}: {
  loadPR: GetExerciseEvolution200["loadPR"];
  hasHistory: boolean;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20">
            <Trophy className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-primary">
              Recorde Pessoal (PR)
            </h2>
            <span className="text-[11px] text-muted-foreground">Maior carga levantada</span>
          </div>
        </div>
      </div>

      {loadPR ? (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-foreground">
              {formatWeightInGrams(loadPR.weightInGrams)}
            </span>
            {loadPR.reps !== null && (
              <span className="font-heading text-lg font-semibold text-muted-foreground">
                × {loadPR.reps} reps
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {loadPR.rir !== null && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
                RIR {loadPR.rir}
              </span>
            )}
            <LocalDate isoDate={loadPR.completedAt} />
            {(loadPR.workoutDayNameSnapshot || loadPR.workoutPlanNameSnapshot) && (
              <span className="truncate">
                • {loadPR.workoutDayNameSnapshot ?? loadPR.workoutPlanNameSnapshot}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {hasHistory
            ? "Nenhum PR de carga registrado ainda."
            : "O PR aparecerá após uma execução com carga registrada."}
        </p>
      )}
    </section>
  );
}

function ExerciseLoadChart({
  items,
}: {
  items: GetExerciseEvolution200ItemsItem[];
}) {
  const chronologicalItems = [...items].reverse();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const maxWeight = Math.max(
    0,
    ...chronologicalItems.map((item) => item.topSet?.weightKg ?? 0),
  );
  const labelStep = chronologicalItems.length > 8 ? 3 : 2;

  const selectedItem =
    selectedIndex !== null ? chronologicalItems[selectedIndex] : null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            Carga máxima por sessão
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Top set registrado (toque em uma barra para detalhes)
          </p>
        </div>
      </div>

      <figure className="mt-5" aria-label="Carga máxima por sessão">
        <div
          className="grid h-44 items-end gap-1.5 border-b border-border sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${chronologicalItems.length}, minmax(0, 1fr))`,
          }}
        >
          {chronologicalItems.map((item, idx) => {
            const weight = item.topSet?.weightKg;
            const isSelected = selectedIndex === idx;
            const height =
              maxWeight === 0
                ? 0
                : weight !== null && weight !== undefined
                  ? (weight / maxWeight) * 100
                  : 0;

            const label = `${formatDateOnly(item.completedAt)}: ${
              weight !== null && weight !== undefined
                ? formatWeightKg(weight)
                : "sem carga"
            }${item.topSet?.reps ? `, ${item.topSet.reps} reps` : ""}.`;

            return (
              <button
                key={item.workoutSessionId}
                type="button"
                onClick={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
                className="group flex h-full min-w-0 flex-col items-center justify-end focus:outline-none"
                aria-label={label}
                title={label}
              >
                {/* Rótulo de Valor em cima de cada barra */}
                <span
                  className={`mb-1 truncate text-[10px] font-bold tracking-tight select-none transition-all ${
                    isSelected
                      ? "text-primary scale-110"
                      : "text-muted-foreground/80 group-hover:text-foreground"
                  }`}
                >
                  {weight !== null && weight !== undefined ? formatWeightKg(weight) : "—"}
                </span>

                {/* Barra do Gráfico */}
                <div
                  className={`w-full max-w-9 rounded-t-md transition-all ${
                    isSelected
                      ? "bg-primary shadow-md shadow-primary/25 ring-2 ring-primary ring-offset-1 ring-offset-card"
                      : weight !== null && weight !== undefined
                        ? "bg-primary/75 group-hover:bg-primary"
                        : "bg-muted/40"
                  }`}
                  style={{
                    height:
                      weight !== null && weight !== undefined
                        ? `${Math.max(8, height)}%`
                        : "3px",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Eixo de Datas */}
        <div
          className="mt-2 grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${chronologicalItems.length}, minmax(0, 1fr))`,
          }}
          aria-hidden="true"
        >
          {chronologicalItems.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <span
                key={item.workoutSessionId}
                className={`truncate text-center text-[9px] transition-colors sm:text-[10px] ${
                  isSelected ? "font-bold text-primary" : "text-muted-foreground"
                }`}
              >
                {index % labelStep === 0 || index === chronologicalItems.length - 1
                  ? formatDateOnly(item.completedAt)
                  : ""}
              </span>
            );
          })}
        </div>

        {/* Card Interativo com Detalhes da Barra Selecionada */}
        {selectedItem && (
          <div className="mt-4 flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs animate-in fade-in slide-in-from-bottom-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-foreground">
                Sessão em {formatDateOnly(selectedItem.completedAt)}
              </span>
              <span className="text-primary font-bold">
                {selectedItem.topSet?.weightKg != null
                  ? `${selectedItem.topSet.weightKg} kg`
                  : "Sem carga"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{formatTopSet(selectedItem)}</span>
              <span>•</span>
              <span>{selectedItem.workingSetsCount} séries registradas</span>
            </div>
          </div>
        )}
      </figure>
    </section>
  );
}

function ExerciseSessionCard({
  item,
}: {
  item: GetExerciseEvolution200ItemsItem;
}) {
  const title = getHistorySessionTitle(item);

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition hover:border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-sm font-semibold text-foreground">
            {title}
          </h3>
          <LocalDate
            isoDate={item.completedAt}
            className="mt-0.5 block text-[11px] text-muted-foreground"
          />
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold">
          {item.origin === "PLANNED" ? "Planejado" : "Avulso"}
        </Badge>
      </div>

      <div className="mt-3 rounded-xl border border-border/50 bg-muted/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Top set desta sessão
        </p>
        <p className="mt-0.5 font-heading text-sm font-bold text-foreground">
          {formatTopSet(item)}
        </p>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {item.workingSetsCount} séries · {item.totalReps} reps ·{" "}
        {item.loadVolumeKg > 0
          ? formatWeightKg(item.loadVolumeKg)
          : "Sem carga registrada"}
      </p>

      <div className="mt-3 divide-y divide-border/60 border-y border-border/60">
        {item.sets.map((set) => (
          <EvolutionSetRow key={set.id} set={set} />
        ))}
      </div>

      <Link
        href={`/history/${item.workoutSessionId}`}
        className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg font-heading text-xs font-semibold text-primary outline-none transition hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>Ver treino completo</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}

function formatTopSet(item: GetExerciseEvolution200ItemsItem): string {
  if (!item.topSet) return "Sem top set registrado";
  const facts = [
    item.topSet.weightInGrams !== null
      ? formatWeightInGrams(item.topSet.weightInGrams)
      : null,
    item.topSet.reps !== null ? `${item.topSet.reps} reps` : null,
    item.topSet.rir !== null ? `RIR ${item.topSet.rir}` : null,
  ].filter(Boolean);
  return facts.length > 0 ? facts.join(" · ") : "Sem carga ou reps registradas";
}

function EvolutionSetRow({
  set,
}: {
  set: GetExerciseEvolution200ItemsItemSetsItem;
}) {
  const facts = [
    set.weightInGrams !== null ? formatWeightInGrams(set.weightInGrams) : null,
    set.reps !== null ? `${set.reps} reps` : null,
    set.rir !== null ? `RIR ${set.rir}` : null,
    set.reps === null && set.durationInSeconds !== null
      ? formatSetDuration(set.durationInSeconds)
      : null,
  ].filter(Boolean);

  return (
    <div className="py-2 text-xs">
      <p className="text-foreground">
        <span className="mr-2 font-mono text-[11px] text-muted-foreground">#{set.order}</span>
        {facts.length > 0 ? facts.join(" · ") : "Sem métricas registradas"}
      </p>
      {set.notes && (
        <p className="mt-1 pl-5 text-[11px] text-muted-foreground">
          {set.notes}
        </p>
      )}
    </div>
  );
}
