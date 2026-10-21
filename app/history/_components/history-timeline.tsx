"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";

import type {
  ListWorkoutHistory200,
  ListWorkoutHistory200ItemsItem,
  ListWorkoutHistoryOrigin,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadWorkoutHistoryPage } from "../_actions";
import { HistorySessionCard } from "./history-session-card";

type HistoryFilter = "ALL" | ListWorkoutHistoryOrigin;

const FILTERS: Array<{ value: HistoryFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PLANNED", label: "Planejados" },
  { value: "FREE", label: "Avulsos" },
];

function filterOrigin(
  filter: HistoryFilter,
): ListWorkoutHistoryOrigin | undefined {
  return filter === "ALL" ? undefined : filter;
}

export function appendUniqueSessions(
  current: ListWorkoutHistory200ItemsItem[],
  incoming: ListWorkoutHistory200ItemsItem[],
) {
  const seen = new Set(current.map((session) => session.id));
  const unique = incoming.filter((session) => {
    if (seen.has(session.id)) return false;
    seen.add(session.id);
    return true;
  });
  return [...current, ...unique];
}

export function HistoryTimeline({
  initialPage,
  initialError,
}: {
  initialPage: ListWorkoutHistory200 | null;
  initialError?: string | null;
}) {
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [items, setItems] = useState(initialPage?.items ?? []);
  const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? false);
  const [firstPageError, setFirstPageError] = useState<string | null>(
    initialError ?? null,
  );
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestGenerationRef = useRef(0);
  const cursorInFlightRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const replacePage = useCallback(async (nextFilter: HistoryFilter) => {
    const generation = ++requestGenerationRef.current;
    cursorInFlightRef.current = null;
    setFilter(nextFilter);
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    setFirstPageError(null);
    setLoadMoreError(null);
    setIsReplacing(true);
    setIsLoadingMore(false);

    const result = await loadWorkoutHistoryPage({
      origin: filterOrigin(nextFilter),
    });
    if (generation !== requestGenerationRef.current) return;

    if (!result.success) {
      setFirstPageError(result.error);
      setIsReplacing(false);
      return;
    }

    setItems(result.data.items);
    setNextCursor(result.data.nextCursor);
    setHasMore(result.data.hasMore);
    setIsReplacing(false);
  }, []);

  const loadMore = useCallback(async () => {
    const cursor = nextCursor;
    if (
      !hasMore ||
      !cursor ||
      isLoadingMore ||
      cursorInFlightRef.current === cursor
    ) {
      return;
    }

    const generation = requestGenerationRef.current;
    cursorInFlightRef.current = cursor;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    const result = await loadWorkoutHistoryPage({
      cursor,
      origin: filterOrigin(filter),
    });

    if (generation === requestGenerationRef.current) {
      if (result.success) {
        setItems((current) => appendUniqueSessions(current, result.data.items));
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
      } else {
        setLoadMoreError("Não foi possível carregar mais treinos.");
      }
      setIsLoadingMore(false);
    }

    if (cursorInFlightRef.current === cursor) cursorInFlightRef.current = null;
  }, [filter, hasMore, isLoadingMore, nextCursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, nextCursor]);

  const emptyTitle =
    filter === "PLANNED"
      ? "Nenhum treino planejado encontrado"
      : filter === "FREE"
        ? "Nenhum treino avulso encontrado"
        : "Nenhum treino concluído ainda";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 sm:px-6">
      <div className="mb-2">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-1.5 font-heading text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar ao início</span>
        </Link>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Evolução
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
            Histórico
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus treinos concluídos
          </p>
        </div>
        <Link
          href="/?chat_open=true&chat_initial_message=Esqueci%20de%20marcar%20um%20treino%20passado"
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
        >
          <CalendarPlus className="size-3.5" />
          <span>Treino Esquecido</span>
        </Link>
      </header>

      <div
        className="mt-5 grid grid-cols-3 rounded-xl bg-secondary p-1"
        aria-label="Filtrar histórico"
      >
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => void replacePage(option.value)}
            disabled={isReplacing && filter === option.value}
            aria-pressed={filter === option.value}
            className={cn(
              "min-h-10 rounded-lg px-2 font-heading text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              filter === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isReplacing ? (
        <HistoryListLoading />
      ) : firstPageError ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-base font-semibold text-foreground">
            Não foi possível carregar seu histórico.
          </h2>
          <Button
            className="mt-4 rounded-full"
            onClick={() => void replacePage(filter)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-7 text-center">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {filter === "ALL"
              ? "Quando você finalizar uma sessão, ela aparecerá aqui."
              : "Tente outro filtro para consultar seus treinos concluídos."}
          </p>
          {filter === "ALL" && (
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link href="/">Ir para o início</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-3" aria-live="polite">
          {items.map((session) => (
            <HistorySessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {items.length > 0 && hasMore && nextCursor && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
          {isLoadingMore && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Carregando mais treinos...
            </span>
          )}
          {loadMoreError && (
            <div className="text-center">
              <p className="text-xs text-destructive">
                Não foi possível carregar mais treinos
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {!loadMoreError && (
            <Button
              variant="outline"
              className="min-h-10 rounded-full"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
            >
              {isLoadingMore ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryListLoading() {
  return (
    <div className="mt-5 space-y-3" aria-label="Carregando histórico">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-2xl border border-border bg-muted/50"
        />
      ))}
    </div>
  );
}
