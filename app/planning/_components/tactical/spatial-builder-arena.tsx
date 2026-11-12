"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import {
  createDraftExercise,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "../../_lib/workout-plan-builder";
import {
  haptic,
  mergeExercises,
  normalizeGroups,
  patchExercise,
  reorderExercises,
  tacticalMetadata,
  telemetry,
  unmergeExercises,
} from "../../_lib/tactical";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import { SpatialCanvas } from "./spatial-canvas";
import { useSpatialState } from "./use-spatial-state";
import { HoloExerciseCard } from "./holo-exercise-card";
import { EnergyLinksSvg, type EnergyConnection } from "./energy-links-svg";
import { PlayerHand } from "./player-hand";
import { HoloHud } from "./holo-hud";
import { SummonManager, type SummonEvent } from "./summon-effect";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  getCardConnectors,
  screenToBoard,
  generateTacticalFormation,
  type Point,
} from "./spatial-utils";
import { TacticalSheet } from "./tactical-sheet";
import { Zap } from "lucide-react";

export interface SpatialBuilderArenaProps {
  day: WorkoutPlanDraftDay;
  days: WorkoutPlanDraftDay[];
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  onAddDay: () => void;
  onChange: (patch: Partial<WorkoutPlanDraftDay>) => void;
  disabled?: boolean;
  onSave?: () => void;
  onClassicView?: () => void;
  settingsNode?: ReactNode;
  onListView?: () => void;
  onReview?: () => void;
  reviewLabel?: string;
  planName?: string;
  error?: string | null;
  syncError?: boolean;
}

export function SpatialBuilderArena({
  day,
  days,
  activeDayIndex,
  onSelectDay,
  onAddDay,
  onChange,
  disabled = false,
  onSave,
  onClassicView,
  settingsNode,
  onListView,
  onReview,
  reviewLabel,
  planName,
  error,
  syncError,
}: SpatialBuilderArenaProps) {
  const { exercises: catalog, isSyncing } = useExerciseCatalog();
  const [summons, setSummons] = useState<SummonEvent[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardDragging, setBoardDragging] = useState(false);
  const [catalogDrag, setCatalogDrag] = useState<{
    entry: ListExercises200Item;
    point: Point;
  } | null>(null);
  const pendingPositions = useRef<Record<string, Point>>({});
  const initialized = useRef(false);

  // Estado Espacial (Câmera, Posições e Fios de Energia)
  const spatial = useSpatialState(day.exercises.length);

  // Telemetria do Treino (Duração, SNC, Músculos, Atributos)
  const telemetryData = useMemo(
    () => telemetry(day.exercises, catalog),
    [day.exercises, catalog],
  );

  const exerciseKeys = JSON.stringify(
    day.exercises.map((e, i) => e.id ?? e.clientId ?? `slot:${i}`),
  );
  const { autoArrange, viewportRef, setPositions } = spatial;
  useEffect(() => {
    const ids: string[] = JSON.parse(exerciseKeys);
    const arrange = () => autoArrange(ids.length, ids);
    if (!initialized.current) {
      arrange();
      initialized.current = true;
    }
    const pending = pendingPositions.current;
    pendingPositions.current = {};
    setPositions((prev) => {
      const formation = generateTacticalFormation(
        ids.length,
        viewportRef.current?.clientWidth || 1300,
        viewportRef.current?.clientHeight || 800,
      );
      return Object.fromEntries(
        ids.map((id, i) => [id, pending[id] ?? prev[id] ?? formation[i]]),
      );
    });
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    let width = viewport.clientWidth;
    const observer = new ResizeObserver(() => {
      if (viewport.clientWidth !== width) {
        width = viewport.clientWidth;
        arrange();
      }
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [exerciseKeys, autoArrange, viewportRef, setPositions]);

  const fusionRef = useRef(spatial.fusionTargetId);
  useEffect(() => {
    fusionRef.current = spatial.fusionTargetId;
  }, [spatial.fusionTargetId]);

  function toBoardPoint(point: Point): Point {
    const rect = spatial.viewportRef.current?.getBoundingClientRect();
    return rect ? screenToBoard(point, rect, spatial.camera) : point;
  }

  useEffect(() => {
    if (spatial.wireSourceIndex === null || disabled) return;
    const source = spatial.wireSourceIndex;
    const move = (event: PointerEvent) =>
      spatial.updateWirePos(
        toBoardPoint({ x: event.clientX, y: event.clientY }),
        null,
      );
    const end = (event: PointerEvent) => {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-wire-input]");
      const index = target
        ? Number(target.getAttribute("data-wire-input"))
        : null;
      spatial.endWirePull();
      if (index !== null && source !== index)
        commit(reorderExercises(day.exercises, source, index));
    };
    const cancel = () => spatial.endWirePull();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
    };
    // Pointer listeners keep the camera and prescription from the start of a connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spatial.wireSourceIndex, disabled]);

  // Salvar alterações na lista de exercícios do treino
  function commit(items: WorkoutPlanDraftExercise[]) {
    if (disabled) return;
    const normalized = normalizeGroups(items);
    onChange({
      exercises: normalized,
      estimatedDurationInMinutes: Math.max(
        1,
        telemetry(normalized, catalog).minutes,
      ),
    });
  }

  // Atualizar um exercício específico
  function updateExercise(
    index: number,
    patch: Partial<WorkoutPlanDraftExercise>,
  ) {
    commit(
      day.exercises.map((e, i) => (i === index ? patchExercise(e, patch) : e)),
    );
  }

  // Invocar (Summon) uma carta do Deck para a Mesa Espacial
  function summonExercise(
    entry: ListExercises200Item,
    patch?: Partial<WorkoutPlanDraftExercise>,
    clientPoint?: Point,
  ) {
    if (disabled) return;

    const newExercise: WorkoutPlanDraftExercise = {
      ...createDraftExercise(),
      ...patch,
      clientId: `spatial-${crypto.randomUUID()}`,
      id: undefined,
      name: entry.name,
      exerciseId: entry.id,
      restTimeInSeconds: patch?.restTimeInSeconds ?? 75,
    };

    // Posição no espaço da mesa
    const existingExercises = day.exercises.filter(
      (e) => e.name || e.exerciseId,
    );
    const targetIndex = existingExercises.length;
    const blockId = newExercise.clientId!;

    // Determinar ponto de invocação
    const w = spatial.viewportRef.current?.clientWidth || 1200;

    const formation = generateTacticalFormation(
      targetIndex + 1,
      w,
      spatial.viewportRef.current?.clientHeight || 800,
    );
    const dropPoint = clientPoint ? toBoardPoint(clientPoint) : null;
    const { x: spawnX, y: spawnY } = dropPoint
      ? { x: dropPoint.x - CARD_WIDTH / 2, y: dropPoint.y - CARD_HEIGHT / 2 }
      : formation[targetIndex];
    pendingPositions.current[blockId] = { x: spawnX, y: spawnY };

    // Disparar animação de invocação (Summon Effect)
    const summonId = `summon-${Date.now()}`;
    setSummons((prev) => [
      ...prev,
      {
        id: summonId,
        x: spawnX + CARD_WIDTH / 2,
        y: spawnY + CARD_HEIGHT / 2,
        label: entry.name,
      },
    ]);

    // Atualizar posição do card
    if (!clientPoint) spatial.resetCamera();

    commit([...existingExercises, newExercise]);
    haptic(30);
  }

  function isOverDeck(point: Point) {
    const rect = viewportRef.current
      ?.querySelector("[data-deck-drop-zone]")
      ?.getBoundingClientRect();
    return (
      !!rect &&
      point.y >= rect.top &&
      point.y <= rect.bottom &&
      point.x >= rect.left &&
      point.x <= rect.right
    );
  }
  function dropCatalogExercise(entry: ListExercises200Item, point: Point) {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (
      rect &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top + 180 &&
      point.y < rect.bottom &&
      !isOverDeck(point)
    )
      summonExercise(entry, undefined, point);
  }

  // Agrupamento de Bi-Sets / Super-Sets
  const groupedSlots = useMemo(() => {
    const slots: {
      groupId?: string | null;
      members: { item: WorkoutPlanDraftExercise; index: number }[];
    }[] = [];

    day.exercises.forEach((item, index) => {
      if (!item.name && !item.exerciseId) return;
      if (item.supersetGroupId) {
        const existing = slots.find((s) => s.groupId === item.supersetGroupId);
        if (existing) {
          existing.members.push({ item, index });
          return;
        }
      }
      slots.push({
        groupId: item.supersetGroupId,
        members: [{ item, index }],
      });
    });

    return slots;
  }, [day.exercises]);

  const renderedPositions = useMemo(() => {
    const positions = { ...spatial.positions };
    for (const slot of groupedSlots) {
      if (slot.members.length < 2) continue;
      const first = slot.members[0];
      const anchor =
        spatial.positions[
          first.item.id ?? first.item.clientId ?? `slot:${first.index}`
        ];
      if (!anchor) continue;
      slot.members.forEach(({ item, index }, i) => {
        positions[item.id ?? item.clientId ?? `slot:${index}`] = {
          x: anchor.x + 11 + i * (CARD_WIDTH + 128),
          y: anchor.y + 11,
        };
      });
    }
    return positions;
  }, [groupedSlots, spatial.positions]);

  // Conexões de energia Bezier entre os blocos (01 -> 02 -> 03...)
  const connections: EnergyConnection[] = useMemo(() => {
    const conns: EnergyConnection[] = [];
    if (day.exercises.length < 2) return conns;

    for (let i = 0; i < day.exercises.length - 1; i++) {
      const fromId =
        day.exercises[i].id ?? day.exercises[i].clientId ?? `slot:${i}`;
      const toId =
        day.exercises[i + 1].id ??
        day.exercises[i + 1].clientId ??
        `slot:${i + 1}`;

      const fromPos = renderedPositions[fromId] ?? { x: 200 + i * 240, y: 220 };
      const toPos = renderedPositions[toId] ?? {
        x: 200 + (i + 1) * 240,
        y: 220,
      };

      const fromConn = getCardConnectors(fromPos.x, fromPos.y);
      const toConn = getCardConnectors(toPos.x, toPos.y);

      conns.push({
        fromIndex: i,
        toIndex: i + 1,
        fromPoint: fromConn.output,
        toPoint: toConn.input,
        restTimeSeconds: day.exercises[i + 1].restTimeInSeconds || 60,
      });
    }

    return conns;
  }, [day.exercises, renderedPositions]);

  return (
    <div
      ref={spatial.viewportRef}
      className="spatial-studio relative size-full overflow-hidden bg-[#070c14] text-white"
    >
      {/* 1. HUD HOLOGRÁFICO JARVIS (BORDAS E CANTOS) */}
      <HoloHud
        days={days}
        activeDayIndex={activeDayIndex}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
        telemetryData={telemetryData}
        tilt={spatial.camera.tilt}
        zoom={spatial.camera.zoom}
        onToggleTilt={spatial.toggleTilt}
        onZoomIn={() => spatial.setZoom(0.08)}
        onZoomOut={() => spatial.setZoom(-0.08)}
        onResetCamera={spatial.resetCamera}
        onAutoArrange={() => {
          const ids = day.exercises.map(
            (e, i) => e.id ?? e.clientId ?? `slot:${i}`,
          );
          spatial.autoArrange(day.exercises.length, ids);
          haptic(20);
        }}
        onSave={onSave}
        onListView={onListView}
        onReview={onReview}
        reviewLabel={reviewLabel}
        planName={planName}
        onClassicView={onClassicView}
        onOpenSettings={() => setSettingsOpen(true)}
        disabled={disabled}
      />

      {/* 2. TABULEIRO ESPACIAL 3D (SPATIAL CANVAS) */}
      <SpatialCanvas
        camera={spatial.camera}
        onPan={spatial.panBy}
        onZoom={spatial.setZoom}
      >
        {/* Camada SVG dos Feixes de Energia Bezier Animados */}
        <EnergyLinksSvg
          connections={connections}
          activeWire={
            spatial.wireSourceIndex !== null && spatial.wireCurrentPos
              ? {
                  fromPoint: getCardConnectors(
                    renderedPositions[
                      day.exercises[spatial.wireSourceIndex]?.id ??
                        day.exercises[spatial.wireSourceIndex]?.clientId ??
                        `slot:${spatial.wireSourceIndex}`
                    ]?.x ?? 200,
                    renderedPositions[
                      day.exercises[spatial.wireSourceIndex]?.id ??
                        day.exercises[spatial.wireSourceIndex]?.clientId ??
                        `slot:${spatial.wireSourceIndex}`
                    ]?.y ?? 200,
                  ).output,
                  currentPoint: spatial.wireCurrentPos,
                }
              : null
          }
          onInvertOrder={(from, to) => {
            commit(reorderExercises(day.exercises, from, to));
            haptic(15);
          }}
        />

        {/* Efeitos de Invocação Holográfica */}
        <SummonManager
          summons={summons}
          onDismiss={(id) =>
            setSummons((prev) => prev.filter((s) => s.id !== id))
          }
        />

        {/* RENDERIZAÇÃO DAS CARTAS HOLOGRÁFICAS NA MESA */}
        {groupedSlots.map((slot, slotIdx) => {
          const isBiSet = slot.members.length > 1;

          // Se for Bi-Set, renderiza o Campo de Força Holográfico (Pedestal Compartilhado)
          if (isBiSet) {
            const first = slot.members[0];
            const posKey =
              first.item.id ?? first.item.clientId ?? `slot:${first.index}`;
            const pos = spatial.positions[posKey] ?? {
              x: 180 + slotIdx * 380,
              y: 220,
            };

            return (
              <div
                key={`biset-${slot.groupId ?? slotIdx}`}
                style={{
                  position: "absolute",
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  zIndex: 25,
                }}
                className="relative flex items-center gap-32 rounded-3xl border border-violet-400/30 bg-violet-950/20 p-2.5 shadow-[0_0_40px_rgba(168,85,247,0.08)]"
              >
                {/* Badge do Campo de Força Bi-Set */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-purple-400 bg-slate-950 px-2.5 py-0.5 font-mono text-[9px] font-black tracking-wider text-purple-300 shadow-[0_0_12px_#a855f7]">
                  <Zap size={10} className="text-purple-400 animate-pulse" />
                  BI-SET #{String(slotIdx + 1).padStart(2, "0")}A ⚡{" "}
                  {String(slotIdx + 1).padStart(2, "0")}B
                </div>

                {slot.members.map(({ item, index }, mIdx) => {
                  const entry = catalog.find((e) => e.id === item.exerciseId);
                  const meta = entry ? tacticalMetadata(entry) : null;

                  return (
                    <div
                      key={`${item.id ?? item.exerciseId}-${index}`}
                      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                      className="relative"
                    >
                      <HoloExerciseCard
                        item={item}
                        index={index}
                        orderLabel={`${String(slotIdx + 1).padStart(2, "0")}${String.fromCharCode(65 + mIdx)}`}
                        x={0}
                        y={0}
                        demand={meta?.cnsDemand ?? "medium"}
                        muscle={
                          meta?.primaryMuscles
                            .map(getMuscleGroupLabel)
                            .join(" · ") ?? ""
                        }
                        isBiSet={true}
                        disabled={disabled}
                        toBoardPoint={toBoardPoint}
                        onDragStateChange={setBoardDragging}
                        onDragEnd={(point) => {
                          if (isOverDeck(point))
                            commit(day.exercises.filter((_, n) => n !== index));
                        }}
                        onPositionChange={(newPos) => {
                          spatial.updateCardPosition(
                            posKey,
                            { x: pos.x + newPos.x, y: pos.y + newPos.y },
                            day.exercises.map(
                              (e, i) => e.id ?? e.clientId ?? `slot:${i}`,
                            ),
                          );
                        }}
                        onChange={(patch) => updateExercise(index, patch)}
                        onRemove={() =>
                          commit(day.exercises.filter((_, n) => n !== index))
                        }
                        onStartWirePull={(idx) => {
                          const point =
                            renderedPositions[
                              day.exercises[idx].id ??
                                day.exercises[idx].clientId ??
                                `slot:${idx}`
                            ];
                          spatial.startWirePull(
                            idx,
                            getCardConnectors(point.x, point.y).output,
                          );
                        }}
                        onSeparateBiSet={() => {
                          if (slot.groupId) {
                            commit(
                              unmergeExercises(day.exercises, slot.groupId),
                            );
                            haptic(15);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          }

          // Carta Individual
          const { item, index } = slot.members[0];
          const posKey = item.id ?? item.clientId ?? `slot:${index}`;
          const pos = spatial.positions[posKey] ?? {
            x: 180 + slotIdx * 250,
            y: 220,
          };
          const entry = catalog.find((e) => e.id === item.exerciseId);
          const meta = entry ? tacticalMetadata(entry) : null;
          const isTargetOfFusion = spatial.fusionTargetId === posKey;

          return (
            <HoloExerciseCard
              key={`${item.id ?? item.exerciseId}-${index}`}
              item={item}
              index={index}
              orderLabel={String(slotIdx + 1).padStart(2, "0")}
              x={pos.x}
              y={pos.y}
              demand={meta?.cnsDemand ?? "medium"}
              muscle={
                meta?.primaryMuscles.map(getMuscleGroupLabel).join(" · ") ?? ""
              }
              isDragTarget={isTargetOfFusion}
              disabled={disabled}
              toBoardPoint={toBoardPoint}
              onPositionChange={(newPos) => {
                const allKeys = day.exercises.map(
                  (e, i) => e.id ?? e.clientId ?? `slot:${i}`,
                );
                spatial.updateCardPosition(posKey, newPos, allKeys);
              }}
              onDragEnd={(point) => {
                if (isOverDeck(point)) {
                  commit(day.exercises.filter((_, n) => n !== index));
                  spatial.setFusionTargetId(null);
                  return;
                }
                const targetKey = fusionRef.current;
                const targetIdx = day.exercises.findIndex(
                  (e, i) => (e.id ?? e.clientId ?? `slot:${i}`) === targetKey,
                );
                if (targetIdx >= 0 && targetIdx !== index)
                  commit(mergeExercises(day.exercises, index, targetIdx));
                spatial.setFusionTargetId(null);
              }}
              onChange={(patch) => updateExercise(index, patch)}
              onRemove={() =>
                commit(day.exercises.filter((_, n) => n !== index))
              }
              onStartWirePull={(idx) => {
                const point =
                  renderedPositions[
                    day.exercises[idx].id ??
                      day.exercises[idx].clientId ??
                      `slot:${idx}`
                  ];
                spatial.startWirePull(
                  idx,
                  getCardConnectors(point.x, point.y).output,
                );
              }}
            />
          );
        })}
      </SpatialCanvas>

      {day.exercises.every((e) => !e.name && !e.exerciseId) && (
        <div className="pointer-events-none absolute inset-x-6 top-[36%] text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5">
            <Zap size={24} strokeWidth={1.2} className="text-cyan-200" />
          </div>
          <p className="text-xl font-medium tracking-tight text-slate-100">
            O treino começa com uma carta.
          </p>
          <p className="mx-auto mt-2 max-w-64 text-xs leading-relaxed text-slate-500">
            Escolha um exercício no deck abaixo e monte sua sequência.
          </p>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="absolute inset-x-3 top-32 z-50 mx-auto max-w-lg rounded-xl border border-rose-400/30 bg-rose-950/95 p-3 text-xs text-rose-200"
        >
          {error}
        </p>
      )}
      {syncError && (
        <p className="pointer-events-none absolute right-6 top-32 text-[10px] text-amber-200">
          Preferência local · sincronização indisponível
        </p>
      )}
      {/* 3. A MÃO DO JOGADOR (DECK EM LEQUE NA BASE) */}
      <PlayerHand
        catalog={catalog}
        disabled={disabled}
        isLoading={isSyncing}
        onSummonExercise={summonExercise}
        isDropTarget={boardDragging}
        onCatalogDrag={(entry, point) =>
          setCatalogDrag(entry && point ? { entry, point } : null)
        }
        onCatalogDrop={dropCatalogExercise}
      />

      {catalogDrag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[130] w-44 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-cyan-300/50 bg-slate-950/95 p-4 text-xs text-cyan-100 shadow-2xl"
          style={{ left: catalogDrag.point.x, top: catalogDrag.point.y }}
        >
          {catalogDrag.entry.name}
          <span className="mt-2 block text-[10px] text-slate-500">
            Solte na mesa para adicionar
          </span>
        </div>
      )}
      {/* Sheet de Configurações do Treino */}
      <TacticalSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configurações do Treino"
        description="Ajuste nome, divisão e parâmetros gerais do plano."
      >
        <fieldset disabled={disabled} className="space-y-3">
          <label className="block text-xs">
            Nome do Treino
            <input
              value={day.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white"
            />
          </label>
          {settingsNode}
        </fieldset>
      </TacticalSheet>
    </div>
  );
}
