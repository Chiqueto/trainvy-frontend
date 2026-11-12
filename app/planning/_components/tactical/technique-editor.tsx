"use client";
import { useState } from "react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import { toggleRune, isCadence, type Rune } from "../../_lib/tactical";
import { TechniqueIcon } from "./technique-icon";

export const TECHNIQUE_NAMES: Record<Rune, string> = {
  DROP_SET: "Drop-set",
  REST_PAUSE: "Rest-pause",
  ISOMETRIC_HOLD: "Isometria",
  CLUSTER_SET: "Cluster set",
  TEMPO_CONTROL: "Cadência",
};
const descriptions: Record<Rune, string> = {
  DROP_SET: "Número de reduções de carga dentro da série.",
  REST_PAUSE: "Duração da pausa curta dentro da série, em segundos.",
  ISOMETRIC_HOLD: "Posição e duração da sustentação.",
  CLUSTER_SET: "Número de blocos em que a série será dividida.",
  TEMPO_CONTROL:
    "Segundos de cada fase da repetição. Zero significa sem pausa.",
};
const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white";
export function TechniqueEditor({
  item,
  onChange,
  disabled,
}: {
  item: WorkoutPlanDraftExercise;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  disabled?: boolean;
}) {
  function config(rune: Rune, value: string | number) {
    onChange({
      runeConfig: { ...item.runeConfig, [rune]: value },
      ...(rune === "TEMPO_CONTROL" ? { tempo: String(value) } : {}),
    });
  }
  const iso = /^(peak|base)(\d+)$/.exec(
    item.runeConfig?.ISOMETRIC_HOLD ?? "peak2",
  );
  const tempo = (
    isCadence(item.tempo)
      ? item.tempo
      : isCadence(item.runeConfig?.TEMPO_CONTROL)
        ? item.runeConfig.TEMPO_CONTROL
        : "3-0-1-0"
  ).split("-");
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="mb-2 text-sm font-semibold">
        Técnicas do exercício
      </legend>
      {(Object.keys(TECHNIQUE_NAMES) as Rune[]).map((rune) => {
        const active = item.runes?.includes(rune) ?? false;
        return (
          <section
            key={rune}
            className={`rounded-xl border p-3 ${active ? "border-cyan-300/25 bg-cyan-300/5" : "border-white/10"}`}
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={active}
                onChange={() => onChange(toggleRune(item, rune))}
                className="size-4 accent-cyan-300"
              />
              <TechniqueIcon rune={rune} />
              {TECHNIQUE_NAMES[rune]}
            </label>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {descriptions[rune]}
            </p>
            {active && (
              <div className="mt-3">
                {rune === "ISOMETRIC_HOLD" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs">
                      Posição da isometria
                      <select
                        aria-label="Posição da isometria"
                        value={iso?.[1] ?? "peak"}
                        onChange={(e) =>
                          config(rune, `${e.target.value}${iso?.[2] ?? 2}`)
                        }
                        className={inputClass}
                      >
                        <option value="peak">Pico do movimento</option>
                        <option value="base">Base do movimento</option>
                      </select>
                    </label>
                    <label className="text-xs">
                      Isometria (s)
                      <TechniqueNumber
                        min={1}
                        max={600}
                        value={Number(iso?.[2] ?? 2)}
                        onChange={(n) =>
                          config(rune, `${iso?.[1] ?? "peak"}${n}`)
                        }
                      />
                    </label>
                  </div>
                ) : rune === "TEMPO_CONTROL" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      "Descida (s)",
                      "Pausa baixa (s)",
                      "Subida (s)",
                      "Pausa alta (s)",
                    ].map((label, i) => (
                      <label key={label} className="text-xs">
                        {label}
                        <TechniqueNumber
                          min={0}
                          max={60}
                          value={Number(tempo[i]) || 0}
                          onChange={(n) => {
                            const next = [...tempo];
                            next[i] = String(n);
                            config(rune, next.join("-"));
                          }}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <label className="block text-xs">
                    {rune === "REST_PAUSE"
                      ? "Pausa interna (s)"
                      : rune === "DROP_SET"
                        ? "Reduções de carga"
                        : "Blocos por série"}
                    <TechniqueNumber
                      min={rune === "CLUSTER_SET" ? 2 : 1}
                      max={
                        rune === "REST_PAUSE"
                          ? 600
                          : rune === "DROP_SET"
                            ? 10
                            : 20
                      }
                      value={
                        item.runeConfig?.[rune] ??
                        (rune === "REST_PAUSE"
                          ? 10
                          : rune === "DROP_SET"
                            ? 1
                            : 2)
                      }
                      onChange={(n) => config(rune, n)}
                    />
                  </label>
                )}
              </div>
            )}
          </section>
        );
      })}
    </fieldset>
  );
}

function TechniqueNumber({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={editing ?? value}
      onFocus={() => setEditing(String(value))}
      onChange={(event) => {
        const text = event.target.value;
        setEditing(text);
        const next = Number(text);
        if (text !== "" && Number.isInteger(next) && next >= min && next <= max)
          onChange(next);
      }}
      onBlur={() => setEditing(null)}
      className={inputClass}
    />
  );
}
