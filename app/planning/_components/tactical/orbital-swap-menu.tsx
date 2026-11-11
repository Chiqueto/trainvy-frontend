import { useEffect, useState } from "react";
import { loadSwapAlternatives } from "./swap-actions";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
export function OrbitalSwapMenu({
  exerciseId,
  onSwap,
}: {
  exerciseId?: string | null;
  onSwap: (e: ListExercises200Item) => void;
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
    <div className="relative">
      <button
        type="button"
        disabled={!exerciseId}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setLoading(true);
          setError(false);
        }}
        className="min-h-11 rounded-lg px-3 text-xs text-cyan-200 disabled:opacity-40"
      >
        ◎ Trocar
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-30 w-64 rounded-2xl border border-cyan-400/30 bg-slate-950 p-2 shadow-xl"
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
        </div>
      )}
    </div>
  );
}
