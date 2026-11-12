"use client";

import { useCallback, useRef, useState } from "react";
import {
  generateTacticalFormation,
  checkMagneticFusion,
  type Point,
} from "./spatial-utils";

export interface CameraState {
  panX: number;
  panY: number;
  zoom: number;
  tilt: number; // 0deg (top-down) ou 22deg (3D isometric)
}

export function useSpatialState(itemsCount: number) {
  // Estado de Câmera da Mesa Espacial
  const [camera, setCamera] = useState<CameraState>({
    panX: 0,
    panY: 0,
    zoom: 0.95,
    tilt: 22, // Inicia na perspectiva 3D estilo Yu-Gi-Oh!
  });

  // Posições espaciais das cartas (chave = id único do bloco ou index)
  const [positions, setPositions] = useState<Record<string, Point>>({});

  // Estado de Arrastar Carta
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fusionTargetId, setFusionTargetId] = useState<string | null>(null);

  // Estado de Puxar Fio de Energia (Wire Reorder)
  const [wireSourceIndex, setWireSourceIndex] = useState<number | null>(null);
  const [wireCurrentPos, setWireCurrentPos] = useState<Point | null>(null);
  const [wireTargetIndex, setWireTargetIndex] = useState<number | null>(null);

  // Canvas bounds ref
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Auto-alinhar ou regenerar posições
  const autoArrange = useCallback(
    (count = itemsCount, blockIds?: string[]) => {
      const w = viewportRef.current?.clientWidth || 1300;
      const h = viewportRef.current?.clientHeight || 800;
      const formation = generateTacticalFormation(count, w, h);

      setPositions(() => {
        const next: Record<string, Point> = {};
        for (let i = 0; i < count; i++) {
          const key = blockIds?.[i] ?? `slot:${i}`;
          next[key] = formation[i] ?? { x: 200 + i * 220, y: 220 };
        }
        return next;
      });
    },
    [itemsCount],
  );

  // Alternar Inclinação 3D da Mesa (0deg <-> 22deg)
  const toggleTilt = useCallback(() => {
    setCamera((prev) => ({
      ...prev,
      tilt: prev.tilt > 5 ? 0 : 22,
    }));
  }, []);

  // Zoom da Câmera
  const setZoom = useCallback((delta: number | ((curr: number) => number)) => {
    setCamera((prev) => {
      const nextZoom =
        typeof delta === "function" ? delta(prev.zoom) : prev.zoom + delta;
      const clamped = Math.max(0.6, Math.min(1.35, nextZoom));
      return { ...prev, zoom: Number(clamped.toFixed(2)) };
    });
  }, []);

  // Pan da Câmera
  const panBy = useCallback((dx: number, dy: number) => {
    setCamera((prev) => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }));
  }, []);

  // Reset de Câmera
  const resetCamera = useCallback(() => {
    setCamera({
      panX: 0,
      panY: 0,
      zoom: 0.95,
      tilt: 22,
    });
  }, []);

  // Atualizar posição de uma carta
  const updateCardPosition = useCallback(
    (id: string, newPos: Point, allIds: string[]) => {
      const next = { ...positions, [id]: newPos };
      let fusionFound: string | null = null;
      for (const otherId of allIds) {
        if (otherId === id) continue;
        const otherPos = next[otherId];
        if (otherPos && checkMagneticFusion(newPos, otherPos)) {
          fusionFound = otherId;
          break;
        }
      }
      setPositions(next);
      setFusionTargetId(fusionFound);
    },
    [positions],
  );

  // Iniciar puxada de linha de energia
  const startWirePull = useCallback((sourceIndex: number, startPos: Point) => {
    setWireSourceIndex(sourceIndex);
    setWireCurrentPos(startPos);
    setWireTargetIndex(null);
  }, []);

  const updateWirePos = useCallback(
    (pos: Point, hoveredIndex: number | null) => {
      setWireCurrentPos(pos);
      setWireTargetIndex(hoveredIndex);
    },
    [],
  );

  const endWirePull = useCallback(() => {
    const result = {
      fromIndex: wireSourceIndex,
      toIndex: wireTargetIndex,
    };
    setWireSourceIndex(null);
    setWireCurrentPos(null);
    setWireTargetIndex(null);
    return result;
  }, [wireSourceIndex, wireTargetIndex]);

  return {
    camera,
    setCamera,
    toggleTilt,
    setZoom,
    panBy,
    resetCamera,
    positions,
    setPositions,
    autoArrange,
    updateCardPosition,
    draggingId,
    setDraggingId,
    fusionTargetId,
    setFusionTargetId,
    wireSourceIndex,
    wireCurrentPos,
    wireTargetIndex,
    startWirePull,
    updateWirePos,
    endWirePull,
    viewportRef,
  };
}
