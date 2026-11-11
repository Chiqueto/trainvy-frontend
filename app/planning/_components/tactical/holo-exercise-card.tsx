"use client";

import React, { useRef, useState, type CSSProperties } from "react";
import { Popover } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cable,
  Check,
  Dumbbell,
  GripHorizontal,
  Minus,
  PersonStanding,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Unlink,
  Zap,
} from "lucide-react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import {
  cycleRune,
  haptic,
  prescriptionSets,
  runeLabel,
  RUNES,
  RUNE_COLORS,
  toggleRune,
  zoneFor,
  ZONES,
  type Rune,
  type TacticalSet,
  type Zone,
} from "../../_lib/tactical";
import { OrbitalSwapMenu } from "./orbital-swap-menu";
import { TacticalSheet } from "./tactical-sheet";
import { AdvancedPrescriptionFields } from "../advanced-prescription-fields";

const RARITY_STYLES = {
  high: {
    border: "border-amber-400/80 hover:border-amber-300",
    glow: "shadow-[0_16px_36px_rgba(245,158,11,0.25)]",
    gradient: "from-amber-950/40 via-slate-950/90 to-slate-950",
    badge: "bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950",
    stars: "★★★",
    starColor: "text-amber-400",
    label: "Composto Pesado",
  },
  medium: {
    border: "border-cyan-400/80 hover:border-cyan-300",
    glow: "shadow-[0_16px_36px_rgba(6,182,212,0.25)]",
    gradient: "from-cyan-950/40 via-slate-950/90 to-slate-950",
    badge: "bg-cyan-400 text-slate-950",
    stars: "★★",
    starColor: "text-cyan-400",
    label: "Multiarticular",
  },
  low: {
    border: "border-emerald-400/80 hover:border-emerald-300",
    glow: "shadow-[0_16px_36px_rgba(16,185,129,0.2)]",
    gradient: "from-emerald-950/30 via-slate-950/90 to-slate-950",
    badge: "bg-emerald-400 text-slate-950",
    stars: "★",
    starColor: "text-emerald-400",
    label: "Isolador",
  },
};

export interface HoloCardProps {
  item: WorkoutPlanDraftExercise;
  index: number;
  orderLabel: string; // Ex: "01", "01A", "02"
  x: number;
  y: number;
  demand?: "low" | "medium" | "high";
  muscle?: string;
  isBiSet?: boolean;
  isDragTarget?: boolean;
  onPositionChange: (newPos: { x: number; y: number }) => void;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onRemove: () => void;
  onStartWirePull: (index: number, startPoint: { x: number; y: number }) => void;
  onSeparateBiSet?: () => void;
  allExerciseCandidates?: { index: number; name: string }[];
  onMergeWith?: (targetIndex: number) => void;
}

export function HoloExerciseCard({
  item,
  index,
  orderLabel,
  x,
  y,
  demand = "medium",
  muscle = "Peito",
  isBiSet = false,
  isDragTarget = false,
  onPositionChange,
  onChange,
  onRemove,
  onStartWirePull,
  onSeparateBiSet,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 3D Tilt effect
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });

  const rarity = RARITY_STYLES[demand];
  const sets = prescriptionSets(item);
  const currentZone = sets[0]?.zone ?? zoneFor(item.reps);

  // Drag livre do Card no plano espacial
  const handlePointerDown = (e: React.PointerEvent) => {
    // Não arrastar se clicou em botões de controle
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest(".no-card-drag")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startPosX = x;
    const startPosY = y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;
      onPositionChange({
        x: Math.round(startPosX + dx),
        y: Math.round(startPosY + dy),
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Efeito 3D Tilt interativo no hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rx = (py - 0.5) * -16; // -8deg a 8deg
    const ry = (px - 0.5) * 16;
    setTilt({
      rx,
      ry,
      glareX: px * 100,
      glareY: py * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  // Ciclo da Zona de Repetições
  const cycleZone = () => {
    const zones: Zone[] = ["strength", "hypertrophy", "endurance"];
    const nextZone = zones[(zones.indexOf(currentZone) + 1) % zones.length];
    const cfg = ZONES[nextZone];

    onChange({
      repsMin: nextZone === "hypertrophy" ? 8 : null,
      repsMax: nextZone === "hypertrophy" ? 12 : null,
      reps: cfg.reps,
      restTimeInSeconds: cfg.rest,
      setPrescription: sets.map((s) => ({
        ...s,
        zone: nextZone,
        reps: cfg.reps,
        restSeconds: cfg.rest,
      })),
    });
    haptic(15);
  };

  // Ajustar número de séries
  const updateSetsCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(12, sets.length + delta));
    if (newCount === sets.length) return;

    if (delta > 0) {
      const lastSet = sets[sets.length - 1] ?? {
        reps: item.reps,
        zone: currentZone,
        restSeconds: item.restTimeInSeconds,
      };
      const nextSets = [...sets, { ...lastSet }];
      onChange({
        sets: nextSets.length,
        setPrescription: nextSets,
      });
    } else {
      const nextSets = sets.slice(0, -1);
      onChange({
        sets: nextSets.length,
        setPrescription: nextSets,
      });
    }
    haptic(10);
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "196px",
        zIndex: isDragging ? 50 : 20,
        cursor: isDragging ? "grabbing" : "grab",
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${isDragging ? 1.05 : 1})`,
        transition: isDragging ? "none" : "transform 0.15s ease-out",
        userSelect: "none",
        touchAction: "none",
      }}
      className="group relative select-none"
    >
      {/* NÓ DE ENTRADA LUMINOSO (IN) - TOPO */}
      <div
        title="Porta de Energia (IN) - Recebe sequência anterior"
        style={{ left: "50%", transform: "translate(-50%, -50%)" }}
        className="absolute top-0 z-30 flex size-5 items-center justify-center rounded-full border border-cyan-400 bg-slate-950 shadow-[0_0_10px_#00f2fe]"
      >
        <span className="size-2 animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="absolute size-2 rounded-full bg-cyan-300" />
      </div>

      {/* CORPO PRINCIPAL DA CARTA HOLOGRÁFICA */}
      <div
        className={`relative flex h-[248px] flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-b p-2 backdrop-blur-xl transition-all duration-300 ${rarity.border} ${rarity.glow} ${rarity.gradient} ${
          isDragTarget ? "ring-4 ring-purple-500/80 ring-offset-2 ring-offset-slate-950" : ""
        }`}
      >
        {/* Holographic Glare overlay */}
        <div
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
          }}
          className="pointer-events-none absolute inset-0 opacity-80"
        />

        {/* 1. CABEÇALHO DA CARTA */}
        <div className="relative z-10 mb-1 flex items-center justify-between border-b border-white/10 pb-1">
          {/* Badge de Ordem #01 com raridade */}
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 items-center justify-center rounded-md px-1.5 font-mono text-[10px] font-black uppercase tracking-wider ${rarity.badge}`}
            >
              #{orderLabel}
            </span>
            <span className={`text-[10px] font-bold tracking-tighter ${rarity.starColor}`}>
              {rarity.stars}
            </span>
          </div>

          {/* Troca Rápida e Menu */}
          <div className="flex items-center gap-0.5 no-card-drag">
            <OrbitalSwapMenu
              compact
              exerciseId={item.exerciseId}
              onSwap={(e) =>
                onChange({
                  name: e.name,
                  exerciseId: e.id,
                  alternative1ExerciseId: null,
                  alternative2ExerciseId: null,
                  alternative1Name: "",
                  alternative2Name: "",
                })
              }
            />
            <button
              type="button"
              title="Excluir da mesa"
              onClick={onRemove}
              className="rounded p-0.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-300"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Título do Exercício */}
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          title={`Editar: ${item.name}`}
          className="relative z-10 no-card-drag text-left"
        >
          <span className="line-clamp-1 block text-xs font-bold leading-tight tracking-tight text-white hover:text-cyan-300">
            {item.name || "Selecionar Exercício"}
          </span>
        </button>

        {/* 2. JANELA CENTRAL (ARTE / HOLOGRAMA SCI-FI) */}
        <div
          onClick={() => setDetailsOpen(true)}
          className="relative my-1.5 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-1 shadow-inner cursor-pointer hover:border-cyan-400/40"
        >
          {/* Fundo com grade holográfica */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf822_1px,transparent_1px)] [background-size:8px_8px]" />

          {/* Ícone vetorial flutuante do equipamento */}
          <div className="relative my-auto flex size-12 items-center justify-center text-cyan-300">
            <span className="absolute inset-0 animate-pulse rounded-full bg-cyan-400/20 blur-md" />
            <Dumbbell size={28} className="relative z-10 text-cyan-200 drop-shadow-[0_0_8px_#38bdf8]" />
          </div>

          {/* Tag do Músculo Alvo */}
          <span className="relative z-10 mt-auto truncate rounded-full border border-white/10 bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
            {muscle}
          </span>
        </div>

        {/* 3. PAINEL DE ATRIBUTOS BASE (ATK / DEF ESTILO YU-GI-OH) */}
        <div className="relative z-10 mt-auto grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/80 p-1 font-mono">
          {/* LADO ESQUERDO: SÉRIES (ATK) */}
          <div className="flex flex-col items-center justify-center border-r border-white/10 pr-1 no-card-drag">
            <span className="text-[8px] uppercase tracking-wider text-zinc-400">Séries</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateSetsCount(-1)}
                className="flex size-4 items-center justify-center rounded bg-white/10 text-zinc-300 hover:bg-white/20"
              >
                <Minus size={9} />
              </button>
              <span className="font-mono text-xs font-black text-amber-300">
                {sets.length}
              </span>
              <button
                type="button"
                onClick={() => updateSetsCount(1)}
                className="flex size-4 items-center justify-center rounded bg-white/10 text-zinc-300 hover:bg-white/20"
              >
                <Plus size={9} />
              </button>
            </div>
          </div>

          {/* LADO DIREITO: ZONA / REPS (DEF) */}
          <button
            type="button"
            onClick={cycleZone}
            title="Alternar Faixa de Repetições"
            className="flex flex-col items-center justify-center no-card-drag hover:bg-white/5 rounded"
          >
            <span className="text-[8px] uppercase tracking-wider text-cyan-400">
              {currentZone === "hypertrophy"
                ? "Hiper"
                : currentZone === "strength"
                  ? "Força"
                  : "Resist"}
            </span>
            <span className="text-xs font-black text-white">
              {item.repsMin && item.repsMax ? `${item.repsMin}-${item.repsMax}` : item.reps}{" "}
              <span className="text-[8px] font-normal text-zinc-400">reps</span>
            </span>
          </button>
        </div>

        {/* Botão de separar Bi-set se estiver agrupado */}
        {isBiSet && onSeparateBiSet && (
          <button
            type="button"
            onClick={onSeparateBiSet}
            className="no-card-drag mt-1 flex items-center justify-center gap-1 rounded-lg border border-purple-500/40 bg-purple-950/60 py-0.5 text-[9px] font-bold text-purple-300 hover:bg-purple-900/80"
          >
            <Unlink size={10} />
            Separar Bi-Set
          </button>
        )}
      </div>

      {/* 4. CARTAS DE MAGIA / EQUIPAMENTO ENCAIXADAS (RUNAS DE TÉCNICAS) */}
      <div className="relative -mt-1 flex flex-wrap gap-1 px-1 no-card-drag">
        <AnimatePresence>
          {(item.runes ?? []).map((rune) => (
            <motion.div
              key={rune}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              style={{
                borderColor: RUNE_COLORS[rune],
                color: RUNE_COLORS[rune],
              }}
              className="flex items-center gap-0.5 rounded-b-lg border border-t-0 bg-slate-950/95 px-1.5 py-0.5 text-[9px] font-bold shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            >
              <button
                type="button"
                onClick={() => onChange(cycleRune(item, rune))}
                title="Ciclar parâmetro da técnica"
                className="hover:underline"
              >
                {runeLabel(item, rune)}
              </button>
              <button
                type="button"
                onClick={() => onChange(toggleRune(item, rune))}
                title="Ejetar magia"
                className="ml-0.5 text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Botão + Magia para equipar técnica */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-b-lg border border-t-0 border-white/20 bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 hover:border-cyan-400 hover:text-cyan-300"
            >
              <Sparkles size={9} />
              + Magia
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="center"
              sideOffset={4}
              className="z-[90] w-56 rounded-xl border border-white/20 bg-slate-950 p-2 text-white shadow-2xl backdrop-blur-xl"
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Equipar Técnica Holográfica
              </p>
              {(Object.keys(RUNES) as Rune[]).map((r) => {
                const isActive = item.runes?.includes(r);
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => onChange(toggleRune(item, r))}
                    style={{ color: RUNE_COLORS[r] }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-white/10"
                  >
                    <span>{RUNES[r]}</span>
                    {isActive && <Check size={14} />}
                  </button>
                );
              })}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* NÓ DE SAÍDA LUMINOSO (OUT) - BASE */}
      <div
        title="Porta de Energia (OUT) - Puxe para conectar com o próximo exercício"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartWirePull(index, { x: x + 98, y: y + 248 });
        }}
        style={{ left: "50%", transform: "translate(-50%, 50%)" }}
        className="no-card-drag absolute bottom-0 z-30 flex size-5 cursor-crosshair items-center justify-center rounded-full border border-purple-400 bg-slate-950 shadow-[0_0_12px_#a855f7] hover:scale-125 transition-transform"
      >
        <span className="size-2 animate-ping rounded-full bg-purple-400 opacity-75" />
        <span className="absolute size-2 rounded-full bg-purple-300" />
      </div>

      {/* Folha tática de detalhes avançados */}
      <TacticalSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={item.name}
        description="Prescrição detalhada do exercício, cargas e séries."
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">Prescrição por série</p>
          {sets.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[20px_1fr_1fr_1fr] items-end gap-2 text-xs"
            >
              <span className="pb-3 text-zinc-500">{i + 1}</span>
              <label>
                Reps
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={s.reps}
                  onChange={(e) => {
                    const next = [...sets];
                    next[i] = { ...s, reps: Number(e.target.value) };
                    onChange({ setPrescription: next, reps: next[0].reps });
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 text-sm text-white"
                />
              </label>
              <label>
                Descanso (s)
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={s.restSeconds}
                  onChange={(e) => {
                    const next = [...sets];
                    next[i] = { ...s, restSeconds: Number(e.target.value) };
                    onChange({
                      setPrescription: next,
                      restTimeInSeconds: next[0].restSeconds,
                    });
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 text-sm text-white"
                />
              </label>
              <label>
                Carga (kg)
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={s.load ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const next = [...sets];
                    next[i] = { ...s, load: e.target.value ? Number(e.target.value) : undefined };
                    onChange({ setPrescription: next });
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 text-sm text-white"
                />
              </label>
            </div>
          ))}

          <AdvancedPrescriptionFields value={item} onChange={onChange} />
        </div>
      </TacticalSheet>
    </div>
  );
}

