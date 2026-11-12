"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Cable,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { tacticalMetadata } from "../../_lib/tactical";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";

const FILTERS = [
  { label: "Todos", groups: [] },
  { label: "Peito", groups: ["CHEST"] },
  { label: "Costas", groups: ["BACK"] },
  {
    label: "Pernas",
    groups: ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ADDUCTORS"],
  },
  { label: "Ombros", groups: ["SHOULDERS"] },
  { label: "Braços", groups: ["BICEPS", "TRICEPS", "FOREARMS"] },
  { label: "Core", groups: ["CORE"] },
];
const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const PAGE_SIZE = 6;

export interface PlayerHandProps {
  catalog: ListExercises200Item[];
  onSummonExercise: (entry: ListExercises200Item) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function PlayerHand({
  catalog,
  onSummonExercise,
  disabled,
  isLoading,
}: PlayerHandProps) {
  const [filterIndex, setFilterIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      catalog.filter(
        (entry) =>
          searchText(entry.name).includes(searchText(query)) &&
          (!filterIndex ||
            entry.muscles.some(
              (m) =>
                m.role === "PRIMARY" &&
                FILTERS[filterIndex].groups.includes(m.muscleGroup),
            )),
      ),
    [catalog, query, filterIndex],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <section
      aria-label="Catálogo de exercícios"
      className="spatial-deck pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6"
    >
      <div className="spatial-glass pointer-events-auto relative z-20 w-full max-w-4xl rounded-2xl p-2 sm:px-3">
        <div className="flex items-center gap-2">
          <div className="hidden shrink-0 items-center gap-2 border-r border-white/10 pr-3 sm:flex">
            <LayersIcon />
            <span className="text-xs font-medium text-slate-200">Seu deck</span>
            <span className="font-mono text-[10px] text-slate-500">
              {filtered.length}
            </span>
          </div>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
            <Search size={14} className="shrink-0 text-slate-500" />
            <input
              type="search"
              aria-label="Buscar exercícios no deck"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
                setCollapsed(false);
              }}
              placeholder="Buscar exercício…"
              className="min-w-0 w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setQuery("");
                  setPage(0);
                }}
              >
                <X size={13} />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir deck" : "Recolher deck"}
            className="spatial-icon-button !size-8 !border-0 !bg-transparent"
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {!collapsed && (
          <div
            className="no-scrollbar mt-2 flex gap-1 overflow-x-auto"
            role="group"
            aria-label="Filtrar grupo muscular"
          >
            {FILTERS.map((filter, i) => (
              <button
                type="button"
                key={filter.label}
                onClick={() => {
                  setFilterIndex(i);
                  setPage(0);
                }}
                aria-pressed={filterIndex === i}
                className={`h-7 shrink-0 rounded-lg px-3 text-[11px] transition-colors ${filterIndex === i ? "bg-cyan-300/10 text-cyan-200" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="spatial-hand no-scrollbar pointer-events-auto flex w-full max-w-4xl items-end gap-2 overflow-x-auto px-1 pb-1 pt-5 sm:justify-center sm:gap-0 sm:overflow-visible">
            {visible.map((entry, i) => {
              const meta = tacticalMetadata(entry);
              return (
                <button
                  type="button"
                  key={entry.id}
                  disabled={disabled}
                  aria-label={`Adicionar ${entry.name}`}
                  onClick={() => onSummonExercise(entry)}
                  style={
                    {
                      "--fan-angle": `${(i - (visible.length - 1) / 2) * 2}deg`,
                      "--card-accent":
                        meta.cnsDemand === "high"
                          ? "#e5b979"
                          : meta.cnsDemand === "low"
                            ? "#6ed8b3"
                            : "#67d9ee",
                    } as CSSProperties
                  }
                  className="spatial-hand-card group relative flex h-[124px] w-[132px] shrink-0 flex-col rounded-xl border border-white/15 p-3 text-left disabled:opacity-40 sm:h-[136px] sm:w-[148px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--card-accent)]">
                      {meta.primaryMuscles.map(getMuscleGroupLabel).slice(0, 1)}
                    </span>
                    <Plus
                      size={13}
                      className="text-slate-500 group-hover:text-cyan-200"
                    />
                  </div>
                  <div className="my-auto flex items-center gap-2 text-slate-500">
                    {meta.equipment === "Máquina / cabo" ? (
                      <Cable size={24} strokeWidth={1.2} />
                    ) : (
                      <Dumbbell size={24} strokeWidth={1.2} />
                    )}
                    <span className="text-[9px]">{meta.equipment}</span>
                  </div>
                  <span className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-100">
                    {entry.name}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <div
                role="status"
                className="flex h-[124px] w-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-400"
              >
                <Search size={22} className="text-slate-600" />
                <span>
                  {isLoading
                    ? "Carregando exercícios…"
                    : "Nenhum exercício encontrado"}
                </span>
                {!isLoading && (
                  <span className="text-[10px] text-slate-500">
                    Tente outro nome ou grupo muscular.
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="pointer-events-auto mt-1 flex h-7 items-center gap-4 text-[10px] text-slate-500">
            <span className="hidden sm:inline">
              Toque em uma carta para adicionar ao treino
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior de exercícios"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="flex size-7 items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-12 text-center font-mono">
                {currentPage + 1} / {pages}
              </span>
              <button
                type="button"
                aria-label="Próxima página de exercícios"
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
                className="flex size-7 items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-20"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function LayersIcon() {
  return <Sparkles size={15} className="text-cyan-300" />;
}
