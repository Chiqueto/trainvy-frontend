"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Compass,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { telemetry } from "../../_lib/tactical";
import { BodyHeatmapSVG } from "./body-heatmap-svg";
import { AttributeRadarChart } from "./attribute-radar-chart";
import { SealButton } from "./seal-button";
import type { WorkoutPlanDraftDay } from "../../_lib/workout-plan-builder";

export interface HoloHudProps {
  days: WorkoutPlanDraftDay[];
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  onAddDay: () => void;
  telemetryData: ReturnType<typeof telemetry>;
  tilt: number;
  zoom: number;
  onToggleTilt: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onAutoArrange: () => void;
  onSave?: () => void;
  onClassicView?: () => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

export function HoloHud({
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  telemetryData,
  tilt,
  zoom,
  onToggleTilt,
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onAutoArrange,
  onSave,
  onClassicView,
  onOpenSettings,
  disabled,
}: HoloHudProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  // Sobrecarga neural em porcentagem formatada
  const neuralScore = Math.min(100, Math.round(telemetryData.neural * 2.2));

  return (
    <>
      {/* 1. HUD SUPERIOR ESQUERDO: SELETOR DE DIVISÕES + SOBRECARGA NEURAL (SNC) */}
      <div className="pointer-events-auto absolute left-4 top-4 z-40 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-1.5 shadow-[0_4px_24px_rgba(0,240,255,0.15)] backdrop-blur-xl">
          {/* Seletor de Divisões (Treino A, B, C...) */}
          <div className="flex items-center gap-1">
            {days.map((d, i) => (
              <button
                type="button"
                key={d.clientId ?? d.id ?? i}
                onClick={() => onSelectDay(i)}
                className={`flex h-8 items-center justify-center rounded-xl px-2.5 font-mono text-xs font-black transition-all ${
                  i === activeDayIndex
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_12px_#22d3ee]"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {String.fromCharCode(65 + (i % 26))}
              </button>
            ))}
            <button
              type="button"
              onClick={onAddDay}
              title="Adicionar novo treino"
              className="flex size-8 items-center justify-center rounded-xl border border-dashed border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="h-5 w-px bg-white/15" />

          {/* Telemetria Rápida: Duração e Séries */}
          <div className="flex items-center gap-2 px-1 text-[11px] font-mono">
            <span className="text-zinc-400">
              ⏱ <strong className="text-white">{telemetryData.minutes}m</strong>
            </span>
            <span className="text-zinc-400">
              ⚡ <strong className="text-cyan-300">{telemetryData.sets} sets</strong>
            </span>
          </div>
        </div>

        {/* Barra de Sobrecarga Neural SNC */}
        <div className="flex w-64 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-2.5 py-1 backdrop-blur-md">
          <Zap
            size={12}
            className={neuralScore > 75 ? "text-rose-400 animate-pulse" : "text-amber-400"}
          />
          <div className="flex-1">
            <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-400">
              <span>Demanda SNC</span>
              <span className={neuralScore > 75 ? "text-rose-300 font-bold" : "text-amber-200"}>
                {neuralScore}%
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                style={{ width: `${neuralScore}%` }}
                className={`h-full transition-all duration-500 ${
                  neuralScore > 75
                    ? "bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_8px_#f43f5e]"
                    : "bg-gradient-to-r from-cyan-400 to-amber-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. HUD SUPERIOR DIREITO: TOGGLE MODO + BOTÃO SELAR TREINO */}
      <div className="pointer-events-auto absolute right-4 top-4 z-40 flex items-center gap-2">
        {/* Toggle Modo Clássico / Jarvis 3D */}
        {onClassicView && (
          <button
            type="button"
            onClick={onClassicView}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs font-semibold text-zinc-300 shadow-lg backdrop-blur-xl hover:border-cyan-400/50 hover:text-white"
          >
            <span className="text-cyan-300">🌌 Jarvis 3D</span>
            <span className="text-zinc-500">/ 📋 Lista</span>
          </button>
        )}

        {/* Configurações do Treino */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Configurações do treino"
            className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/70 text-zinc-300 backdrop-blur-xl hover:bg-white/10 hover:text-white"
          >
            <Settings2 size={16} />
          </button>
        )}

        {/* Botão Selar Treino Brilhante */}
        {onSave && (
          <div className="w-36">
            <SealButton disabled={disabled} onSave={onSave} />
          </div>
        )}
      </div>

      {/* 3. WIDGET HOLOGRÁFICO RETRÁTIL NA ESQUERDA: SCANNER BIOMÉTRICO AZUL / RAIO-X */}
      <div className="pointer-events-auto absolute left-4 top-28 z-30 flex items-start">
        <AnimatePresence>
          {scannerOpen ? (
            <motion.div
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              className="relative w-64 overflow-hidden rounded-2xl border border-cyan-400/40 bg-slate-950/75 p-3 shadow-[0_0_30px_rgba(0,240,255,0.18)] backdrop-blur-xl"
            >
              {/* Scanline animada subindo e descendo estilo Raio-X Jarvis */}
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80 animate-[scanline_2.8s_ease-in-out_infinite]" />

              <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  <Activity size={12} />
                  Scanner Biométrico
                </span>
                <button
                  type="button"
                  onClick={() => setScannerOpen(false)}
                  className="rounded p-0.5 text-zinc-400 hover:text-white"
                >
                  <Minimize2 size={13} />
                </button>
              </div>

              {/* Raio-X do Corpo Humano */}
              <div className="relative flex justify-center [&_svg]:max-h-48">
                <BodyHeatmapSVG volumes={telemetryData.muscles} />
              </div>

              {/* Radar de Atributos */}
              <div className="mt-2 border-t border-white/10 pt-2 [&_svg]:max-h-36">
                <AttributeRadarChart values={telemetryData.attributes} />
              </div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-slate-950/70 px-2.5 py-1.5 font-mono text-[10px] font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,240,255,0.15)] backdrop-blur-xl hover:border-cyan-400 hover:bg-slate-900"
            >
              <Activity size={13} className="text-cyan-400 animate-pulse" />
              <span>Bio-Scanner</span>
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* 4. CONTROLES DE CÂMERA ESPACIAL 3D (CANTO DIREITO INFERIOR, ACIMA DA MÃO) */}
      <div className="pointer-events-auto absolute right-4 bottom-24 z-30 flex flex-col items-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-1.5 shadow-[0_4px_20px_rgba(0,240,255,0.15)] backdrop-blur-xl">
        {/* Toggle Visão 3D Isométrica / Top-down */}
        <button
          type="button"
          onClick={onToggleTilt}
          title={tilt > 5 ? "Alternar para Visão Superior 2D" : "Alternar para Mesa 3D Isométrica"}
          className={`flex size-8 items-center justify-center rounded-xl transition-all ${
            tilt > 5
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_#22d3ee]"
              : "bg-white/10 text-zinc-300 hover:text-white"
          }`}
        >
          <Compass size={16} />
        </button>

        {/* Auto-Alinhar Formação */}
        <button
          type="button"
          onClick={onAutoArrange}
          title="Auto-organizar formação tática"
          className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Sparkles size={15} />
        </button>

        <div className="h-px w-5 bg-white/15 my-0.5" />

        {/* Zoom In */}
        <button
          type="button"
          onClick={onZoomIn}
          title="Aumentar zoom"
          className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <ZoomIn size={14} />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={onZoomOut}
          title="Diminuir zoom"
          className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <ZoomOut size={14} />
        </button>

        {/* Reset Câmera */}
        <button
          type="button"
          onClick={onResetCamera}
          title="Centralizar câmera"
          className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </>
  );
}

