import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import type { WorkoutPlanDraftExercise } from "./workout-plan-builder";

export type Rune =
  | "DROP_SET"
  | "REST_PAUSE"
  | "ISOMETRIC_HOLD"
  | "CLUSTER_SET"
  | "TEMPO_CONTROL";
export type Zone = "strength" | "hypertrophy" | "endurance";
export type RuneConfig = {
  DROP_SET?: number;
  REST_PAUSE?: 10 | 15 | 20;
  ISOMETRIC_HOLD?: "peak2" | "peak3" | "base2";
  CLUSTER_SET?: 2 | 3 | 4;
  TEMPO_CONTROL?: "3-0-1-0" | "4-0-1-0" | "3-1-1-0";
};
export const RUNE_COLORS: Record<Rune, string> = {
  DROP_SET: "#fb923c",
  REST_PAUSE: "#fde047",
  ISOMETRIC_HOLD: "#7dd3fc",
  CLUSTER_SET: "#c084fc",
  TEMPO_CONTROL: "#6ee7b7",
};
const RUNE_OPTIONS = {
  DROP_SET: [1, 2, 3],
  REST_PAUSE: [10, 15, 20],
  ISOMETRIC_HOLD: ["peak2", "peak3", "base2"],
  CLUSTER_SET: [2, 3, 4],
  TEMPO_CONTROL: ["3-0-1-0", "4-0-1-0", "3-1-1-0"],
} as const;
export function cycleRune(
  item: WorkoutPlanDraftExercise,
  rune: Rune,
): Partial<WorkoutPlanDraftExercise> {
  const options: readonly (string | number)[] = RUNE_OPTIONS[rune];
  const current = item.runeConfig?.[rune] ?? options[0];
  const value = options[(options.indexOf(current) + 1) % options.length];
  return {
    runeConfig: { ...item.runeConfig, [rune]: value },
    ...(rune === "TEMPO_CONTROL" ? { tempo: String(value) } : {}),
  };
}
export function runeLabel(item: WorkoutPlanDraftExercise, rune: Rune) {
  const value = item.runeConfig?.[rune] ?? RUNE_OPTIONS[rune][0];
  switch (rune) {
    case "DROP_SET":
      return `🔥 Drop-set ${value}x`;
    case "REST_PAUSE":
      return `⚡ Rest-pause ${value}s`;
    case "ISOMETRIC_HOLD":
      return value === "base2"
        ? "❄ Base 2s"
        : value === "peak3"
          ? "❄ Pico 3s"
          : "❄ Pico 2s";
    case "CLUSTER_SET":
      return `⛓ Cluster ${value} blocos`;
    case "TEMPO_CONTROL":
      return `◷ ${item.tempo || value}`;
  }
}
export function toggleRune(
  item: WorkoutPlanDraftExercise,
  rune: Rune,
): Partial<WorkoutPlanDraftExercise> {
  const active = item.runes?.includes(rune);
  const config = { ...item.runeConfig };
  if (active) delete config[rune];
  return {
    runes: active
      ? item.runes?.filter((r) => r !== rune)
      : [...(item.runes ?? []), rune],
    runeConfig: config,
  };
}
export type TacticalSet = {
  reps: number;
  zone: Zone;
  restSeconds: number;
  load?: number;
};
export const RUNES: Record<Rune, string> = {
  DROP_SET: "🔥 Drop-set",
  REST_PAUSE: "⚡ Rest-pause",
  ISOMETRIC_HOLD: "❄ Isometria 2s",
  CLUSTER_SET: "⛓ Cluster set",
  TEMPO_CONTROL: "◷ Controle de tempo",
};
export const ZONES = {
  strength: { label: "Força", reps: 5, rest: 120 },
  hypertrophy: { label: "Hipertrofia", reps: 10, rest: 75 },
  endurance: { label: "Resistência", reps: 15, rest: 45 },
} as const;
export function zoneFor(reps: number): Zone {
  return reps <= 5 ? "strength" : reps >= 15 ? "endurance" : "hypertrophy";
}
export function prescriptionSets(e: WorkoutPlanDraftExercise): TacticalSet[] {
  if (e.setPrescription?.length) return e.setPrescription;
  return Array.from({ length: e.sets }, () => ({
    reps: e.reps,
    zone: zoneFor(e.reps),
    restSeconds: e.restTimeInSeconds,
    ...(e.targetLoadInGrams == null
      ? {}
      : { load: e.targetLoadInGrams / 1000 }),
  }));
}
// Summary controls deliberately apply only their changed field to individual sets.
export function patchExercise(
  e: WorkoutPlanDraftExercise,
  patch: Partial<WorkoutPlanDraftExercise>,
): WorkoutPlanDraftExercise {
  const next = { ...e, ...patch };
  if (
    !patch.setPrescription &&
    e.setPrescription?.length &&
    ["sets", "reps", "restTimeInSeconds", "targetLoadInGrams"].some(
      (k) => k in patch,
    )
  ) {
    const source = prescriptionSets(e);
    next.setPrescription = Array.from({ length: next.sets }, (_, i) => {
      const set = { ...(source[i] ?? source[source.length - 1]) };
      if (patch.reps !== undefined) {
        set.reps = next.reps;
        set.zone = zoneFor(next.reps);
      }
      if (patch.restTimeInSeconds !== undefined)
        set.restSeconds = next.restTimeInSeconds;
      if (patch.targetLoadInGrams !== undefined) {
        if (next.targetLoadInGrams == null) delete set.load;
        else set.load = next.targetLoadInGrams / 1000;
      }
      return set;
    });
  }
  return next;
}
export function mergeExercises(
  items: WorkoutPlanDraftExercise[],
  source: number,
  target: number,
) {
  if (source === target || !items[source] || !items[target]) return items;
  const group =
    items[target].supersetGroupId ||
    items[source].supersetGroupId ||
    crypto.randomUUID();
  const members = new Set([source, target]);
  for (let i = 0; i < items.length; i++)
    if (
      (items[source].supersetGroupId &&
        items[i].supersetGroupId === items[source].supersetGroupId) ||
      (items[target].supersetGroupId &&
        items[i].supersetGroupId === items[target].supersetGroupId)
    )
      members.add(i);
  const grouped = items
    .filter((_, i) => members.has(i))
    .map((e) => ({ ...e, supersetGroupId: group }));
  const remaining = items.filter((_, i) => !members.has(i));
  const position = items
    .slice(0, target)
    .filter((_, i) => !members.has(i)).length;
  return [
    ...remaining.slice(0, position),
    ...grouped,
    ...remaining.slice(position),
  ];
}
export function unmergeExercises(
  items: WorkoutPlanDraftExercise[],
  group: string,
) {
  return items.map((e) =>
    e.supersetGroupId === group ? { ...e, supersetGroupId: null } : e,
  );
}
export function normalizeGroups(items: WorkoutPlanDraftExercise[]) {
  return items.map((e) =>
    e.supersetGroupId &&
    items.filter((x) => x.supersetGroupId === e.supersetGroupId).length < 2
      ? { ...e, supersetGroupId: null }
      : e,
  );
}
export function reorderExercises(
  items: WorkoutPlanDraftExercise[],
  from: number,
  to: number,
) {
  const source = items[from],
    target = items[to];
  if (!source || !target || from === to) return items;
  if (
    source.supersetGroupId &&
    source.supersetGroupId === target.supersetGroupId
  ) {
    const result = [...items];
    result.splice(to, 0, ...result.splice(from, 1));
    return result;
  }
  const moving = items.filter((e, i) =>
    source.supersetGroupId
      ? e.supersetGroupId === source.supersetGroupId
      : i === from,
  );
  const remaining = items.filter((e) => !moving.includes(e));
  const targetIndices = remaining.flatMap((e, i) =>
    (
      target.supersetGroupId
        ? e.supersetGroupId === target.supersetGroupId
        : e === target
    )
      ? [i]
      : [],
  );
  const insertion =
    from < to ? Math.max(...targetIndices) + 1 : Math.min(...targetIndices);
  return [
    ...remaining.slice(0, insertion),
    ...moving,
    ...remaining.slice(insertion),
  ];
}
export function haptic(duration = 10) {
  if (typeof navigator !== "undefined") navigator.vibrate?.(duration);
}

export function tacticalMetadata(e: ListExercises200Item) {
  const text = e.name.toLowerCase();
  const primaryMuscles = e.muscles
    .filter((m) => m.role === "PRIMARY")
    .map((m) => m.muscleGroup);
  const secondaryMuscles = e.muscles
    .filter((m) => m.role === "SECONDARY")
    .map((m) => m.muscleGroup);
  const power = /salto|pliom|clean|snatch|arremesso/.test(text);
  const compound =
    /supino|agachamento|remada|terra|desenvolvimento|barra fixa|leg press|afundo/.test(
      text,
    );
  const machine =
    /máquina|maquina|polia|cabo|smith|press/.test(text) &&
    !/supino|militar/.test(text);
  const cnsDemand =
    power || (compound && !machine) ? "high" : compound ? "medium" : "low";
  return {
    id: e.id,
    name: e.name,
    category: power
      ? "Potência"
      : compound
        ? "Multiarticular"
        : "Isolador / acessório",
    equipment: /halter/.test(text)
      ? "Halteres"
      : /barra/.test(text)
        ? "Barra"
        : machine
          ? "Máquina / cabo"
          : "Não informado",
    primaryMuscles,
    secondaryMuscles,
    cnsDemand,
    attributeWeights: {
      strength: compound ? 8 : 4,
      hypertrophy: power ? 4 : 8,
      power: power ? 10 : 2,
      metabolic: power ? 7 : 4,
      stability: machine ? 3 : 7,
    },
  } as const;
}
// Match movement families and primary groups, rather than suggesting any exercise
// for the same muscle. Unknown families intentionally have no automatic swaps.
export function biomechanicalAlternatives(
  entry: ListExercises200Item,
  catalog: ListExercises200Item[],
) {
  const families = [
    /supino/i,
    /agachamento/i,
    /remada/i,
    /puxada|barra fixa/i,
    /rosca(?!.*punho)/i,
    /eleva[çc][aã]o lateral/i,
    /extens[aã]o.*tr[ií]ceps|tr[ií]ceps.*polia/i,
    /flexora|flex[aã]o de joelho/i,
    /extensora|extens[aã]o de joelho/i,
    /panturrilha/i,
    /prancha/i,
  ];
  const family = families.find((f) => f.test(entry.name));
  if (!family) return [];
  const muscles = tacticalMetadata(entry).primaryMuscles;
  if (!muscles.length) return [];
  return catalog
    .filter(
      (e) =>
        e.id !== entry.id &&
        family.test(e.name) &&
        e.muscles.some(
          (m) => m.role === "PRIMARY" && muscles.includes(m.muscleGroup),
        ),
    )
    .slice(0, 4);
}
export function telemetry(
  items: WorkoutPlanDraftExercise[],
  catalog: ListExercises200Item[],
) {
  const muscles: Record<string, number> = {};
  const attributes = {
    strength: 0,
    power: 0,
    hypertrophy: 0,
    metabolic: 0,
    stability: 0,
  };
  let seconds = 0,
    neural = 0,
    count = 0;
  items
    .filter((e) => e.name.trim())
    .forEach((e) => {
      const entry = catalog.find((x) => x.id === e.exerciseId);
      const meta = entry ? tacticalMetadata(entry) : null;
      const sets = prescriptionSets(e);
      const multiplier = 1 + (e.runes?.length ?? 0) * 0.15;
      seconds +=
        sets.reduce((sum, s) => sum + s.reps * 3 + s.restSeconds, 0) *
          multiplier +
        (e.warmupSets ?? 0) * 60 +
        30;
      neural +=
        (meta ? { low: 2, medium: 4, high: 7 }[meta.cnsDemand] : 3) *
        sets.length *
        multiplier;
      meta?.primaryMuscles.forEach((m) => {
        muscles[m] = (muscles[m] ?? 0) + sets.length;
      });
      meta?.secondaryMuscles.forEach((m) => {
        muscles[m] = (muscles[m] ?? 0) + sets.length * 0.5;
      });
      sets.forEach((s) => {
        count++;
        for (const key of Object.keys(
          attributes,
        ) as (keyof typeof attributes)[])
          attributes[key] +=
            (meta?.attributeWeights[key] ?? 4) *
            ((s.zone === "strength" && key === "strength") ||
            (s.zone === "endurance" && key === "metabolic") ||
            (s.zone === "hypertrophy" && key === "hypertrophy")
              ? 1.2
              : 1);
      });
    });
  for (const key of Object.keys(attributes) as (keyof typeof attributes)[])
    attributes[key] = Math.min(10, attributes[key] / Math.max(1, count));
  return {
    minutes: Math.ceil(seconds / 60),
    neural: Math.round(neural),
    muscles,
    attributes,
    sets: count,
  };
}
