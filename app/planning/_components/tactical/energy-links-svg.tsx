"use client";

import React from "react";
import { calculateBezierCurve, type Point } from "./spatial-utils";
import { ArrowLeftRight, Clock, X } from "lucide-react";

export interface EnergyConnection {
  fromIndex: number;
  toIndex: number;
  fromPoint: Point;
  toPoint: Point;
  restTimeSeconds: number;
}

interface EnergyLinksSvgProps {
  connections: EnergyConnection[];
  activeWire?: {
    fromPoint: Point;
    currentPoint: Point;
  } | null;
  onInvertOrder?: (fromIndex: number, toIndex: number) => void;
  onDisconnect?: (fromIndex: number, toIndex: number) => void;
  onUpdateRestTime?: (toIndex: number, restSeconds: number) => void;
}

export function EnergyLinksSvg({
  connections,
  activeWire,
  onInvertOrder,
  onDisconnect,
}: EnergyLinksSvgProps) {
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        style={{ zIndex: 10 }}
      >
        <defs>
          {/* Brilho neon holográfico */}
          <filter id="holo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="wire-pulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente de feixe de energia direcional (01 -> 02) */}
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
          </linearGradient>

          {/* Gradiente do fio sendo arrastado */}
          <linearGradient id="active-wire-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Links estabelecidos entre os cards */}
        {connections.map((conn, idx) => {
          const { path } = calculateBezierCurve(conn.fromPoint, conn.toPoint);

          return (
            <g key={`conn-${conn.fromIndex}-${conn.toIndex}-${idx}`}>
              {/* Linha externa de brilho volumétrico */}
              <path
                d={path}
                fill="none"
                stroke="url(#beam-gradient)"
                strokeWidth="7"
                strokeOpacity="0.25"
                filter="url(#holo-glow)"
              />

              {/* Linha central da curva */}
              <path
                d={path}
                fill="none"
                stroke="url(#beam-gradient)"
                strokeWidth="2.5"
                strokeOpacity="0.95"
              />

              {/* Feixe com partículas de energia fluindo no sentido do treino */}
              <path
                d={path}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="6, 18"
                className="animate-[energyPulse_1.4s_linear_infinite]"
                strokeOpacity="0.85"
                filter="url(#holo-glow)"
              />

              {/* Ponto luminoso de saída (OUT) */}
              <circle
                cx={conn.fromPoint.x}
                cy={conn.fromPoint.y}
                r="4.5"
                fill="#00f2fe"
                filter="url(#holo-glow)"
              />

              {/* Ponto luminoso de entrada (IN) */}
              <circle
                cx={conn.toPoint.x}
                cy={conn.toPoint.y}
                r="4.5"
                fill="#a855f7"
                filter="url(#holo-glow)"
              />
            </g>
          );
        })}

        {/* Fio sendo ativamente puxado pelo usuário */}
        {activeWire && (
          <g>
            {(() => {
              const { path } = calculateBezierCurve(
                activeWire.fromPoint,
                activeWire.currentPoint,
              );
              return (
                <>
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#active-wire-gradient)"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                    filter="url(#wire-pulse)"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="4, 10"
                    className="animate-[energyPulse_0.6s_linear_infinite]"
                  />
                  <circle
                    cx={activeWire.currentPoint.x}
                    cy={activeWire.currentPoint.y}
                    r="7"
                    fill="#f59e0b"
                    filter="url(#wire-pulse)"
                  />
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Mini-HUDs Flutuantes nos pontos médios das conexões */}
      {connections.map((conn) => {
        const { midpoint } = calculateBezierCurve(conn.fromPoint, conn.toPoint);

        return (
          <div
            key={`hud-${conn.fromIndex}-${conn.toIndex}`}
            style={{
              position: "absolute",
              left: `${midpoint.x}px`,
              top: `${midpoint.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 25,
            }}
            className="group pointer-events-auto flex items-center gap-1 rounded-full border border-cyan-500/40 bg-slate-950/85 px-2 py-0.5 shadow-[0_0_12px_rgba(0,242,254,0.25)] backdrop-blur-md transition-all hover:scale-110 hover:border-cyan-400"
          >
            {/* Ícone e Tempo de Transição / Descanso */}
            <span className="flex items-center gap-1 font-mono text-[9px] font-medium text-cyan-300">
              <Clock size={10} className="text-cyan-400" />
              {conn.restTimeSeconds}s
            </span>

            {/* Ações rápidas no Hover */}
            <div className="flex items-center gap-0.5 border-l border-white/15 pl-1 opacity-70 transition-opacity group-hover:opacity-100">
              {onInvertOrder && (
                <button
                  type="button"
                  title="Inverter sequência (01 ⇄ 02)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvertOrder(conn.fromIndex, conn.toIndex);
                  }}
                  className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeftRight size={10} />
                </button>
              )}

              {onDisconnect && (
                <button
                  type="button"
                  title="Cortar link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect(conn.fromIndex, conn.toIndex);
                  }}
                  className="rounded p-0.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

