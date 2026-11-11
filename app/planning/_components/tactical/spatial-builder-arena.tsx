"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  type Rune,
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
  distance,
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
}: SpatialBuilderArenaProps) {
  const { exercises: catalog } = useExerciseCatalog();
  const [summons, setSummons] = useState<SummonEvent[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Estado Espacial (Câmera, Posições e Fios de Energia)
  const spatial = useSpatialState(day.exercises.length);

  // Telemetria do Treino (Duração, SNC, Músculos, Atributos)
  const telemetryData = useMemo(
    () => telemetry(day.exercises, catalog),
    [day.exercises, catalog],
  );

  // Inicializar formação tática das cartas se ainda não estiverem posicionadas
  useEffect(() => {
    const ids = day.exercises.map((e, i) => e.id ?? `slot:${i}`);
    spatial.autoArrange(day.exercises.length, ids);
  }, [day.clientId ?? day.id ?? activeDayIndex]);

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
  function updateExercise(index: number, patch: Partial<WorkoutPlanDraftExercise>) {
    commit(
      day.exercises.map((e, i) => (i === index ? patchExercise(e, patch) : e)),
    );
  }

  // Invocar (Summon) uma carta do Deck para a Mesa Espacial
  function summonExercise(
    entry: ListExercises200Item,
    clientX?: number,
    clientY?: number,
  ) {
    if (disabled) return;

    const newExercise: WorkoutPlanDraftExercise = {
      ...createDraftExercise(),
      name: entry.name,
      exerciseId: entry.id,
      restTimeInSeconds: 75,
    };

    // Posição no espaço da mesa
    const targetIndex = day.exercises.length;
    const blockId = `slot:${targetIndex}`;

    // Determinar ponto de invocação
    const w = spatial.viewportRef.current?.clientWidth || 1200;
    const h = spatial.viewportRef.current?.clientHeight || 800;
    const spawnX = Math.round(w / 2 - CARD_WIDTH / 2 + (targetIndex % 3) * 40 - 40);
    const spawnY = Math.round(220 + (targetIndex % 4) * 50);

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
    spatial.setPositions((prev) => ({
      ...prev,
      [blockId]: { x: spawnX, y: spawnY },
    }));

    commit([...day.exercises, newExercise]);
    haptic(30);
  }

  // Reordenar sequência após puxar linha de energia (OUT -> IN)
  function handleEndWirePull(targetHoverIndex: number | null) {
    const { fromIndex } = spatial.endWirePull();
    if (
      fromIndex !== null &&
      targetHoverIndex !== null &&
      fromIndex !== targetHoverIndex
    ) {
      commit(reorderExercises(day.exercises, fromIndex, targetHoverIndex));
      haptic(20);
    }
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

  // Conexões de energia Bezier entre os blocos (01 -> 02 -> 03...)
  const connections: EnergyConnection[] = useMemo(() => {
    const conns: EnergyConnection[] = [];
    if (day.exercises.length < 2) return conns;

    for (let i = 0; i < day.exercises.length - 1; i++) {
      const fromId = day.exercises[i].id ?? `slot:${i}`;
      const toId = day.exercises[i + 1].id ?? `slot:${i + 1}`;

      const fromPos = spatial.positions[fromId] ?? { x: 200 + i * 240, y: 220 };
      const toPos = spatial.positions[toId] ?? { x: 200 + (i + 1) * 240, y: 220 };

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
  }, [day.exercises, spatial.positions]);

  return (
    <div
      ref={spatial.viewportRef}
      className="relative size-full overflow-hidden bg-[#04070d] text-white"
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
          const ids = day.exercises.map((e, i) => e.id ?? `slot:${i}`);
          spatial.autoArrange(day.exercises.length, ids);
          haptic(20);
        }}
        onSave={onSave}
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
                    spatial.positions[`slot:${spatial.wireSourceIndex}`]?.x ?? 200,
                    spatial.positions[`slot:${spatial.wireSourceIndex}`]?.y ?? 200,
                  ).output,
                  currentPoint: spatial.wireCurrentPos,
                }
              : null
          }
          onInvertOrder={(from, to) => {
            commit(reorderExercises(day.exercises, from, to));
            haptic(15);
          }}
          onDisconnect={(from, to) => {
            // Remove o segundo exercício do fluxo ou reposiciona
            haptic(10);
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
            const second = slot.members[1];
            const posKey = first.item.id ?? `slot:${first.index}`;
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
                className="relative flex items-center gap-3 rounded-3xl border-2 border-purple-500/70 bg-purple-950/20 p-2.5 shadow-[0_0_40px_rgba(168,85,247,0.25)] backdrop-blur-md"
              >
                {/* Badge do Campo de Força Bi-Set */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-purple-400 bg-slate-950 px-2.5 py-0.5 font-mono text-[9px] font-black tracking-wider text-purple-300 shadow-[0_0_12px_#a855f7]">
                  <Zap size={10} className="text-purple-400 animate-pulse" />
                  SYNCHRO BI-SET #{String(slotIdx + 1).padStart(2, "0")}A ⚡{" "}
                  {String(slotIdx + 1).padStart(2, "0")}B
                </div>

                {slot.members.map(({ item, index }, mIdx) => {
                  const entry = catalog.find((e) => e.id === item.exerciseId);
                  const meta = entry ? tacticalMetadata(entry) : null;

                  return (
                    <div key={`${item.id ?? item.exerciseId}-${index}`} className="relative">
                      <HoloExerciseCard
                        item={item}
                        index={index}
                        orderLabel={`${String(slotIdx + 1).padStart(2, "0")}${mIdx === 0 ? "A" : "B"}`}
                        x={0}
                        y={0}
                        demand={meta?.cnsDemand ?? "medium"}
                        muscle={
                          meta?.primaryMuscles.map(getMuscleGroupLabel).join(" · ") ??
                          ""
                        }
                        isBiSet={true}
                        onPositionChange={(newPos) => {
                          spatial.updateCardPosition(
                            posKey,
                            newPos,
                            day.exercises.map((_, i) => `slot:${i}`),
                          );
                        }}
                        onChange={(patch) => updateExercise(index, patch)}
                        onRemove={() =>
                          commit(day.exercises.filter((_, n) => n !== index))
                        }
                        onStartWirePull={(idx, pt) =>
                          spatial.startWirePull(idx, pt)
                        }
                        onSeparateBiSet={() => {
                          if (slot.groupId) {
                            commit(unmergeExercises(day.exercises, slot.groupId));
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
          const posKey = item.id ?? `slot:${index}`;
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
              onPositionChange={(newPos) => {
                const allKeys = day.exercises.map((_, i) => `slot:${i}`);
                spatial.updateCardPosition(posKey, newPos, allKeys);

                // Se soltar em cima de outro card na zona magnética, funde em bi-set
                if (spatial.fusionTargetId && spatial.fusionTargetId !== posKey) {
                  const targetIdx = Number(
                    spatial.fusionTargetId.replace("slot:", ""),
                  );
                  if (!isNaN(targetIdx) && targetIdx !== index) {
                    commit(mergeExercises(day.exercises, index, targetIdx));
                    spatial.setFusionTargetId(null);
                    haptic(25);
                  }
                }
              }}
              onChange={(patch) => updateExercise(index, patch)}
              onRemove={() =>
                commit(day.exercises.filter((_, n) => n !== index))
              }
              onStartWirePull={(idx, pt) => spatial.startWirePull(idx, pt)}
            />
          );
        })}
      </SpatialCanvas>

      {/* 3. A MÃO DO JOGADOR (DECK EM LEQUE NA BASE) */}
      <PlayerHand
        catalog={catalog}
        onSummonExercise={summonExercise}
        onApplyRuneToActive={(rune: Rune) => {
          if (day.exercises.length > 0) {
            const lastIdx = day.exercises.length - 1;
            const currentItem = day.exercises[lastIdx];
            const runes = currentItem.runes ?? [];
            const nextRunes = runes.includes(rune)
              ? runes.filter((r) => r !== rune)
              : [...runes, rune];
            updateExercise(lastIdx, { runes: nextRunes });
            haptic(15);
          }
        }}
      />

      {/* Sheet de Configurações do Treino */}
      <TacticalSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configurações do Treino"
        description="Ajuste nome, divisão e parâmetros gerais do plano."
      >
        <div className="space-y-3">
          <label className="block text-xs">
            Nome do Treino
            <input
              value={day.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white"
            />
          </label>
          {settingsNode}
        </div>
      </TacticalSheet>
    </div>
  );
}

