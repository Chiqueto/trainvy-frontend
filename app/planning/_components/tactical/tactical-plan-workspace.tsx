"use client";
import { useState } from "react";
import { TacticalBuilderArena } from "./tactical-builder-arena";
import {
  createDraftWorkoutDay,
  duplicateDraftWorkoutDay,
  type WorkoutPlanDraftDay,
} from "../../_lib/workout-plan-builder";
import { Input } from "@/components/ui/input";

export function TacticalPlanWorkspace({
  days,
  onChange,
  disabled,
  activeIndex,
  onActiveChange,
}: {
  days: WorkoutPlanDraftDay[];
  onChange: (days: WorkoutPlanDraftDay[]) => void;
  disabled?: boolean;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
}) {
  const [localActive, setLocalActive] = useState(0);
  const active = activeIndex ?? localActive;
  const setActive = (index: number) => {
    setLocalActive(index);
    onActiveChange?.(index);
  };
  const index = Math.min(active, Math.max(0, days.length - 1));
  const day = days[index];
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="sr-only">Divisões do plano</legend>
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Treinos do plano"
      >
        {days.map((d, i) => (
          <button
            type="button"
            key={d.clientId ?? d.id ?? i}
            role="tab"
            aria-selected={i === index}
            aria-controls="tactical-workout-panel"
            onClick={() => setActive(i)}
            className={`min-h-11 shrink-0 rounded-xl border px-4 text-xs ${i === index ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-600 dark:text-cyan-200" : "border-border text-muted-foreground"}`}
          >
            {d.name || `Treino ${String.fromCharCode(65 + i)}`}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onChange([
            ...days,
            {
              ...createDraftWorkoutDay(
                String.fromCharCode(65 + (days.length % 26)),
              ),
              exercises: [],
            },
          ]);
          setActive(days.length);
        }}
        className="min-h-11 rounded-xl border border-dashed border-border px-4 text-xs"
      >
        + Novo Treino
      </button>
      {day && (
        <div
          id="tactical-workout-panel"
          role="tabpanel"
          aria-label={day.name}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="min-w-40 flex-1 text-xs">
              Nome do treino
              <Input
                value={day.name}
                onChange={(e) =>
                  onChange(
                    days.map((d, i) =>
                      i === index ? { ...d, name: e.target.value } : d,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="min-h-11 px-3 text-xs"
              onClick={() => {
                const copy = duplicateDraftWorkoutDay(day);
                onChange([
                  ...days.slice(0, index + 1),
                  copy,
                  ...days.slice(index + 1),
                ]);
                setActive(index + 1);
              }}
            >
              Duplicar
            </button>
            <button
              type="button"
              disabled={index === 0}
              className="min-h-11 px-3 text-xs disabled:opacity-30"
              aria-label="Mover treino para cima"
              onClick={() => {
                const next = [...days];
                [next[index], next[index - 1]] = [next[index - 1], next[index]];
                onChange(next);
                setActive(index - 1);
              }}
            >
              ←
            </button>
            <button
              type="button"
              disabled={index === days.length - 1}
              className="min-h-11 px-3 text-xs disabled:opacity-30"
              aria-label="Mover treino para baixo"
              onClick={() => {
                const next = [...days];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                onChange(next);
                setActive(index + 1);
              }}
            >
              →
            </button>
            <button
              type="button"
              disabled={days.length <= 1}
              onClick={() => onChange(days.filter((_, i) => i !== index))}
              className="min-h-11 px-3 text-xs text-destructive disabled:opacity-30"
            >
              Excluir treino
            </button>
          </div>
          <TacticalBuilderArena
            key={day.clientId ?? day.id ?? index}
            day={day}
            disabled={disabled}
            onChange={(patch) =>
              onChange(
                days.map((d, i) => (i === index ? { ...d, ...patch } : d)),
              )
            }
          />
        </div>
      )}
    </fieldset>
  );
}
