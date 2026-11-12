"use client";
import React, { useRef, useState } from "react";
import { Dumbbell, ListPlus, Pencil, Sparkles, Unlink } from "lucide-react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import { prescriptionSets, runeLabel, RUNE_COLORS } from "../../_lib/tactical";
import { CARD_WIDTH, CARD_HEIGHT, type Point } from "./spatial-utils";
import { TacticalSheet } from "./tactical-sheet";
import { PrescriptionStepper } from "./prescription-stepper";
import {
  ExerciseConfiguration,
  type ExercisePanelTab,
} from "./exercise-configuration";
import { ExerciseActionsMenu } from "./exercise-actions-menu";
import { useHoldMenu } from "./use-hold-menu";
import { OrbitalSwapMenu } from "./orbital-swap-menu";
const RARITY_STYLES = {
  high: {
    border: "border-amber-400/40 hover:border-amber-300",
    glow: "shadow-[0_16px_36px_rgba(245,158,11,0.10)]",
    gradient: "from-amber-950/40 via-slate-950/90 to-slate-950",
    badge: "bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950",
    stars: "★★★",
    starColor: "text-amber-400",
    label: "Composto Pesado",
  },
  medium: {
    border: "border-cyan-400/40 hover:border-cyan-300",
    glow: "shadow-[0_16px_36px_rgba(6,182,212,0.10)]",
    gradient: "from-cyan-950/40 via-slate-950/90 to-slate-950",
    badge: "bg-cyan-400 text-slate-950",
    stars: "★★",
    starColor: "text-cyan-400",
    label: "Multiarticular",
  },
  low: {
    border: "border-emerald-400/40 hover:border-emerald-300",
    glow: "shadow-[0_16px_36px_rgba(16,185,129,0.10)]",
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
  orderLabel: string;
  x: number;
  y: number;
  demand?: "low" | "medium" | "high";
  muscle?: string;
  isBiSet?: boolean;
  isDragTarget?: boolean;
  onPositionChange: (point: Point) => void;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onRemove: () => void;
  onStartWirePull: (index: number, point: Point) => void;
  onSeparateBiSet?: () => void;
  disabled?: boolean;
  toBoardPoint?: (point: Point) => Point;
  onDragEnd?: (clientPoint: Point) => void;
  onDragStateChange?: (dragging: boolean) => void;
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
  muscle = "",
  isBiSet,
  isDragTarget,
  onPositionChange,
  onChange,
  onRemove,
  onStartWirePull,
  onSeparateBiSet,
  disabled,
  toBoardPoint,
  onDragEnd,
  onDragStateChange,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null),
    cleanupRef = useRef<(() => void) | null>(null);
  const [dragging, setDragging] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [detailsOpen, setDetailsOpen] = useState(false),
    [tab, setTab] = useState<ExercisePanelTab>("prescription");
  const hold = useHoldMenu(() => setMenuOpen(true));
  const sets = prescriptionSets(item),
    rarity = RARITY_STYLES[demand];
  function configure(next: ExercisePanelTab) {
    setTab(next);
    setMenuOpen(false);
    setDetailsOpen(true);
  }
  function changeSets(count: number) {
    const next = Array.from({ length: count }, (_, i) => ({
      ...(sets[i] ?? sets[sets.length - 1]),
    }));
    onChange({ sets: count, setPrescription: next });
  }
  function handlePointerDown(event: React.PointerEvent) {
    if (
      disabled ||
      event.button !== 0 ||
      !cardRef.current?.contains(event.target as Node)
    )
      return;
    const target = event.target as Element;
    if (target.closest("button,input,select,summary,.no-card-drag")) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const convert = toBoardPoint ?? ((p: Point) => p),
      start = convert({ x: event.clientX, y: event.clientY });
    let moved = false;
    const move = (e: PointerEvent) => {
      if (hold.held.current) return;
      if (
        !moved &&
        Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY) < 8
      )
        return;
      if (!moved) {
        moved = true;
        hold.cancel();
        setDragging(true);
        onDragStateChange?.(true);
      }
      const point = convert({ x: e.clientX, y: e.clientY });
      onPositionChange({
        x: Math.round(x + point.x - start.x),
        y: Math.round(y + point.y - start.y),
      });
    };
    const clean = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      cleanupRef.current = null;
    };
    const end = (e: PointerEvent) => {
      setDragging(false);
      onDragStateChange?.(false);
      hold.cancel();
      if (moved && e.type !== "pointercancel" && !hold.held.current)
        onDragEnd?.({ x: e.clientX, y: e.clientY });
      clean();
    };
    cleanupRef.current?.();
    cleanupRef.current = clean;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }
  React.useEffect(
    () => () => {
      cleanupRef.current?.();
    },
    [],
  );
  return (
    <div
      ref={cardRef}
      inert={disabled || undefined}
      data-holo-card
      data-exercise-index={index}
      {...{
        onPointerDownCapture: (e: React.PointerEvent) => {
          if (cardRef.current?.contains(e.target as Node))
            hold.onPointerDownCapture(e);
        },
        onPointerMoveCapture: hold.onPointerMoveCapture,
        onPointerUpCapture: hold.onPointerUpCapture,
        onPointerCancelCapture: hold.onPointerCancelCapture,
      }}
      onContextMenu={(e) => {
        if (cardRef.current?.contains(e.target as Node)) {
          e.preventDefault();
          setMenuOpen(true);
        }
      }}
      onPointerDown={handlePointerDown}
      onClickCapture={(e) => {
        if (hold.held.current && cardRef.current?.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        zIndex: dragging ? 60 : 20,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      className="spatial-exercise group select-none"
    >
      <div
        data-wire-input={index}
        title="Entrada IN · recebe a saída OUT da carta anterior"
        style={{ left: "50%", transform: "translate(-50%,-50%)" }}
        className="no-card-drag absolute top-0 z-30 flex size-6 items-center justify-center rounded-full border border-cyan-400/60 bg-slate-950 shadow-[0_0_12px_#22d3ee66]"
      >
        <span className="size-2 rounded-full bg-cyan-300" />
      </div>
      <div
        style={{ height: CARD_HEIGHT }}
        className={`spatial-card-body relative flex flex-col rounded-2xl border bg-gradient-to-b p-3 ${rarity.border} ${rarity.gradient} ${isDragTarget ? "ring-2 ring-violet-400" : ""}`}
      >
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-1.5 py-1 font-mono text-[10px] font-bold ${rarity.badge}`}
            >
              #{orderLabel}
            </span>
            <span
              title={`${rarity.label} · demanda estimada ${demand === "high" ? "alta" : demand === "medium" ? "moderada" : "baixa"}`}
              className={`text-[10px] ${rarity.starColor}`}
            >
              {rarity.stars}
            </span>
          </div>
          <div className="no-card-drag flex items-center">
            <OrbitalSwapMenu
              compact
              exerciseId={item.exerciseId}
              onSwap={(entry) =>
                onChange({
                  name: entry.name,
                  exerciseId: entry.id,
                  alternative1ExerciseId: null,
                  alternative2ExerciseId: null,
                  alternative1Name: "",
                  alternative2Name: "",
                })
              }
            />
            <ExerciseActionsMenu
              open={menuOpen}
              onOpenChange={setMenuOpen}
              ignoreOutside={hold.ignoreOutside}
              onConfigure={configure}
              onRemove={onRemove}
            />
          </div>
        </div>
        <button
          type="button"
          data-card-title
          onDoubleClick={() => configure("prescription")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              configure("prescription");
            }
          }}
          title="Duplo clique para editar a prescrição · ou use o lápis"
          className="no-card-drag text-left"
        >
          <span className="line-clamp-2 block min-h-9 text-sm font-semibold leading-tight text-white">
            {item.name || "Selecionar exercício"}
          </span>
          <span className="mt-1 block text-[9px] font-normal text-slate-500">
            {item.repsMin && item.repsMax
              ? `Faixa ${item.repsMin}–${item.repsMax} reps · 2× para editar`
              : "2× no título para editar"}
          </span>
        </button>
        <div className="relative my-2 flex min-h-10 flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-slate-900/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf81a_1px,transparent_1px)] [background-size:10px_10px]" />
          <Dumbbell
            size={28}
            strokeWidth={1.3}
            className="relative my-2 text-cyan-200/80"
          />
          <span className="relative mb-2 max-w-full truncate px-2 text-[9px] uppercase tracking-widest text-cyan-200/80">
            {muscle}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/60 py-1.5">
          <PrescriptionStepper
            label="Séries"
            value={sets.length}
            min={1}
            max={100}
            disabled={disabled}
            onChange={changeSets}
          />
          <PrescriptionStepper
            label="Repetições"
            value={item.reps}
            min={1}
            max={10000}
            disabled={disabled}
            onChange={(reps) =>
              onChange({ reps, repsMin: null, repsMax: null })
            }
          />
        </div>
        <div className="no-card-drag mt-2 flex justify-between gap-1">
          <button
            type="button"
            title="Editar prescrição e descanso"
            aria-label="Editar prescrição"
            onClick={() => configure("prescription")}
            className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] text-slate-400 hover:bg-white/5"
          >
            <Pencil size={12} />
            {item.restTimeInSeconds}s
          </button>
          <button
            type="button"
            title="Adicionar exercícios substitutos"
            aria-label="Exercícios substitutos"
            onClick={() => configure("alternatives")}
            className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] text-cyan-200/80 hover:bg-white/5"
          >
            <ListPlus size={13} />
            {[
              item.alternative1ExerciseId || item.alternative1Name,
              item.alternative2ExerciseId || item.alternative2Name,
            ].filter(Boolean).length || "Substitutos"}
          </button>
          {isBiSet && onSeparateBiSet && (
            <button
              type="button"
              title="Separar Bi-Set"
              aria-label="Separar Bi-Set"
              onClick={onSeparateBiSet}
              className="px-1 text-violet-300"
            >
              <Unlink size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="spatial-technique-tabs no-card-drag absolute left-full top-7 flex max-h-[240px] w-20 flex-col gap-1 overflow-y-auto pl-1.5 sm:w-[112px]">
        <button
          type="button"
          onClick={() => configure("techniques")}
          className="flex min-h-8 items-center gap-1 rounded-r-lg border border-l-0 border-cyan-300/20 bg-slate-950/95 px-2 text-[10px] text-cyan-200"
        >
          <Sparkles size={12} />
          Técnicas +
        </button>
        {(item.runes ?? []).map((rune) => (
          <button
            type="button"
            key={rune}
            onClick={() => configure("techniques")}
            title="Clique para configurar os valores da técnica"
            style={{
              color: RUNE_COLORS[rune],
              borderColor: `${RUNE_COLORS[rune]}55`,
            }}
            className="min-h-8 rounded-r-lg border border-l-0 bg-slate-950/95 px-2 py-1 text-left text-[9px] leading-relaxed"
          >
            {runeLabel(item, rune)}
          </button>
        ))}
      </div>
      <div
        title="Saída OUT · arraste até a entrada IN da próxima carta"
        onPointerDown={(e) => {
          e.stopPropagation();
          hold.cancel();
          if (!disabled)
            onStartWirePull(index, {
              x: x + CARD_WIDTH / 2,
              y: y + CARD_HEIGHT,
            });
        }}
        style={{ left: "50%", transform: "translate(-50%,50%)" }}
        className="no-card-drag absolute bottom-0 z-30 flex size-6 cursor-crosshair items-center justify-center rounded-full border border-violet-400/60 bg-slate-950 shadow-[0_0_12px_#a855f766]"
      >
        <span className="size-2 rounded-full bg-violet-300" />
      </div>
      <TacticalSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={item.name}
        description="Configure os valores da prescrição, técnicas e substitutos."
      >
        <ExerciseConfiguration
          item={item}
          onChange={onChange}
          tab={tab}
          onTabChange={setTab}
          disabled={disabled}
        />
      </TacticalSheet>
    </div>
  );
}
