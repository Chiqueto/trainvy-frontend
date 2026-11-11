import { useEffect, useState } from "react";
import { Popover } from "radix-ui";
import { RefreshCw } from "lucide-react";
import { loadSwapAlternatives } from "./swap-actions";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
export function OrbitalSwapMenu({
  exerciseId,
  onSwap,
  compact = false,
}: {
  exerciseId?: string | null;
  onSwap: (e: ListExercises200Item) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ListExercises200Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open || !exerciseId) return;
    let alive = true;
    loadSwapAlternatives(exerciseId)
      .then((entries) => {
        if (alive) {
          setItems(entries);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [exerciseId, open]);
  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setLoading(true);
          setError(false);
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={!exerciseId}
          aria-expanded={open}
          aria-label="Trocar exercício"
          className={
            compact
              ? "flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-cyan-200 disabled:opacity-30"
              : "min-h-11 rounded-lg px-3 text-xs text-cyan-200 disabled:opacity-40"
          }
        >
          {compact ? <RefreshCw size={12} /> : "◎ Trocar"}
        </button>
      </Popover.Trigger>
      {open && (
        <Popover.Portal>
          <Popover.Content
            side="top"
            align="center"
            sideOffset={6}
            className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-cyan-400/30 bg-slate-950 p-2 text-zinc-100 shadow-xl"
            aria-label="Alternativas de exercício"
          >
            <p className="p-2 text-[10px] text-slate-400">
              Variações relacionadas no catálogo. Revise a adequação.
            </p>
            {loading ? (
              <p className="p-2 text-xs">Buscando variações…</p>
            ) : error ? (
              <p className="p-2 text-xs text-amber-300">
                Não foi possível carregar.
              </p>
            ) : items.length ? (
              items.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onSwap(e);
                    setOpen(false);
                  }}
                  className="min-h-11 w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-cyan-400/10"
                >
                  {e.name}
                </button>
              ))
            ) : (
              <p className="p-2 text-xs text-slate-400">
                Sem variações relacionadas cadastradas.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 w-full text-xs text-slate-400"
            >
              Fechar
            </button>
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}
