"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cable,
  Dumbbell,
  Minus,
  PersonStanding,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { tacticalMetadata, RUNES, RUNE_COLORS, type Rune } from "../../_lib/tactical";
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
  { label: "Potência", groups: ["POWER"] },
];

const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export interface PlayerHandProps {
  catalog: ListExercises200Item[];
  onSummonExercise: (entry: ListExercises200Item, clientX?: number, clientY?: number) => void;
  onApplyRuneToActive?: (rune: Rune) => void;
}

export function PlayerHand({
  catalog,
  onSummonExercise,
  onApplyRuneToActive,
}: PlayerHandProps) {
  const [filterIndex, setFilterIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isHandCollapsed, setIsHandCollapsed] = useState(false);

  // Filtragem instantânea do Deck
  const filteredCatalog = useMemo(() => {
    return catalog.filter((e) => {
      const matchesSearch = searchText(e.name).includes(searchText(query));
      if (!matchesSearch) return false;

      if (!filterIndex) return true;
      const groupConfig = FILTERS[filterIndex].groups;
      if (groupConfig.includes("POWER")) {
        return tacticalMetadata(e).attributeWeights.power === 10;
      }
      return e.muscles.some(
        (m) => m.role === "PRIMARY" && groupConfig.includes(m.muscleGroup),
      );
    });
  }, [catalog, query, filterIndex]);

  // Limite visual de cartas simultâneas na mão para manter formato de leque limpo
  const visibleCards = useMemo(() => {
    return filteredCatalog.slice(0, 18);
  }, [filteredCatalog]);

  const middleIndex = (visibleCards.length - 1) / 2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-40 flex flex-col items-center justify-end">
      {/* 1. PÍLULA HOLOGRÁFICA FLUTUANTE DE FILTROS & SPELL RUNES */}
      <div className="pointer-events-auto mb-2 flex max-w-[95vw] flex-wrap items-center gap-1.5 rounded-full border border-cyan-500/30 bg-slate-950/70 px-3 py-1 shadow-[0_4px_24px_rgba(0,240,255,0.18)] backdrop-blur-xl transition-all">
        {/* Runas de Magia Rápidas */}
        <div className="flex items-center gap-1 border-r border-white/15 pr-2">
          {(Object.keys(RUNES) as Rune[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => onApplyRuneToActive?.(r)}
              title={`Equipar ${RUNES[r]}`}
              style={{ color: RUNE_COLORS[r] }}
              className="flex size-7 items-center justify-center rounded-full bg-white/5 text-[11px] transition-transform hover:scale-125 hover:bg-white/15"
            >
              {r === "DROP_SET"
                ? "🔥"
                : r === "REST_PAUSE"
                  ? "⚡"
                  : r === "ISOMETRIC_HOLD"
                    ? "❄"
                    : r === "CLUSTER_SET"
                      ? "⛓"
                      : "◷"}
            </button>
          ))}
        </div>

        {/* Filtros por Grupo Muscular */}
        <div className="no-scrollbar flex max-w-[50vw] items-center gap-1 overflow-x-auto">
          {FILTERS.map((f, i) => (
            <button
              type="button"
              key={f.label}
              onClick={() => setFilterIndex(i)}
              className={`h-7 shrink-0 rounded-full px-2.5 text-[10px] font-medium transition-all ${
                filterIndex === i
                  ? "bg-cyan-400 font-bold text-slate-950 shadow-[0_0_12px_#22d3ee]"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Botão de Busca */}
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          title="Buscar exercício no deck"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-cyan-300"
        >
          <Search size={13} />
        </button>

        {/* Toggle Minimizar Mão */}
        <button
          type="button"
          onClick={() => setIsHandCollapsed(!isHandCollapsed)}
          className="ml-1 text-[10px] text-zinc-400 hover:text-white"
        >
          {isHandCollapsed ? "▲ Expandir Deck" : "▼ Recolher"}
        </button>
      </div>

      {/* Caixa de Busca Flutuante */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto mb-2 flex w-72 items-center gap-2 rounded-2xl border border-cyan-400/40 bg-slate-950/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl"
          >
            <Search size={14} className="text-cyan-400" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no deck..."
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. O LEQUE DE CARTAS FLUTUANTE (PLAYER'S HAND EM ARCO) */}
      {!isHandCollapsed && (
        <div className="pointer-events-auto relative flex h-[155px] max-w-[98vw] items-end justify-center px-4 overflow-visible">
          {visibleCards.map((entry, idx) => {
            const meta = tacticalMetadata(entry);
            const distFromCenter = idx - middleIndex;
            // Rotação suave em leque (-14deg até 14deg)
            const rotationDeg = distFromCenter * 2.8;
            // Elevação no arco (mais alto no centro, mais baixo nas pontas)
            const arcY = Math.abs(distFromCenter) * 3;

            return (
              <motion.div
                key={entry.id}
                style={{
                  transformOrigin: "bottom center",
                  marginLeft: idx === 0 ? 0 : "-44px", // Sobreposição tipo leque
                  zIndex: 10 + idx,
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{
                  opacity: 1,
                  y: arcY,
                  rotate: rotationDeg,
                }}
                whileHover={{
                  y: -36,
                  rotate: 0,
                  scale: 1.18,
                  zIndex: 60,
                  transition: { duration: 0.18, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  onSummonExercise(entry, e.clientX, e.clientY - 200);
                }}
                className="group relative flex h-[146px] w-[124px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-shadow hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(0,242,254,0.4)]"
              >
                {/* Linha superior: Custo SNC e Músculo */}
                <div className="flex items-center justify-between text-[8px] font-mono text-cyan-300">
                  <span>
                    {meta.cnsDemand === "high"
                      ? "★★★"
                      : meta.cnsDemand === "medium"
                        ? "★★"
                        : "★"}
                  </span>
                  <span className="truncate max-w-[60px] rounded bg-white/5 px-1 uppercase text-zinc-300">
                    {meta.primaryMuscles.map(getMuscleGroupLabel).slice(0, 1)}
                  </span>
                </div>

                {/* Ícone holográfico central */}
                <div className="relative my-auto flex size-9 items-center justify-center self-center text-cyan-400">
                  <span className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40" />
                  {meta.equipment === "Barra" ? (
                    <Minus size={22} />
                  ) : meta.equipment === "Máquina / cabo" ? (
                    <Cable size={22} />
                  ) : (
                    <Dumbbell size={22} />
                  )}
                </div>

                {/* Nome do exercício */}
                <span className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-white group-hover:text-cyan-300">
                  {entry.name}
                </span>

                {/* Badge Invocação no hover */}
                <div className="absolute inset-x-1 bottom-1 hidden items-center justify-center rounded-md bg-cyan-400 py-0.5 text-[8px] font-black uppercase text-slate-950 group-hover:flex">
                  Invocação ⚡
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

