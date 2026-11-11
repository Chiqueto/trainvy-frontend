"use client";

import React, { useRef, useState } from "react";
import type { CameraState } from "./use-spatial-state";

export interface SpatialCanvasProps {
  camera: CameraState;
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  children: React.ReactNode;
}

export function SpatialCanvas({
  camera,
  onPan,
  onZoom,
  children,
}: SpatialCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Manipulação de Pan ao arrastar o fundo
  const handlePointerDown = (e: React.PointerEvent) => {
    // Apenas se o clique foi direto no fundo do canvas ou no plano de grade
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest(".no-card-drag") ||
      target.closest("[data-holo-card]")
    ) {
      return;
    }

    setIsPanning(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      onPan(dx, dy);
    };

    const onPointerUp = () => {
      setIsPanning(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Zoom no scroll da roda do mouse
  const handleWheel = (e: React.WheelEvent) => {
    // Zoom suave
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    onZoom(zoomDelta);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
      }}
      className="relative size-full select-none overflow-hidden bg-[#04070d]"
    >
      {/* 1. ILUMINAÇÃO VOLUMÉTRICA RADIAL CIANO/AZUL NO CENTRO DA MESA */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(6,182,212,0.18)_0%,rgba(56,189,248,0.08)_35%,transparent_75%)]" />

      {/* 2. GRADE HOLOGRÁFICA EM PERSPECTIVA */}
      <div
        style={{
          transform: `translate3d(${camera.panX * 0.3}px, ${camera.panY * 0.3}px, 0) rotateX(${camera.tilt * 1.2}deg)`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.25s ease-out",
        }}
        className="pointer-events-none absolute -inset-[60%] bg-[linear-gradient(to_right,#00f2fe0f_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe0f_1px,transparent_1px)] [background-size:64px_64px] opacity-70"
      />

      {/* Círculo tático holográfico orbital no centro da mesa */}
      <div
        style={{
          transform: `translate(-50%, -50%) translate3d(${camera.panX}px, ${camera.panY}px, 0) rotateX(${camera.tilt}deg)`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.25s ease-out",
        }}
        className="pointer-events-none absolute left-1/2 top-1/2 size-[680px] rounded-full border border-cyan-500/15 shadow-[0_0_80px_rgba(0,242,254,0.06)]"
      >
        <div className="absolute inset-8 rounded-full border border-dashed border-cyan-400/10 animate-[spin_60s_linear_infinite]" />
        <div className="absolute inset-24 rounded-full border border-white/5" />
      </div>

      {/* 3. O PLANO ESPACIAL TRANSFORMADO (ONDE FICAM AS CARTAS E LINKS SVG) */}
      <div
        style={{
          transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale(${camera.zoom}) rotateX(${camera.tilt}deg)`,
          transformOrigin: "50% 50%",
          transformStyle: "preserve-3d",
          transition: isPanning ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="absolute inset-0 size-full"
      >
        {children}
      </div>
    </div>
  );
}

