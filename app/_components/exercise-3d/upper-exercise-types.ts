export const BENCH_VARIANTS = [
  "skull-crusher",
  "decline-dumbbell-press",
  "incline-smith-press",
  "decline-smith-press",
] as const;

export type BenchVariant = (typeof BENCH_VARIANTS)[number];

export function isBenchVariant(key: string): key is BenchVariant {
  return (BENCH_VARIANTS as readonly string[]).includes(key);
}

export function isAngledSmithPress(key: string) {
  return key === "incline-smith-press" || key === "decline-smith-press";
}

export const UPPER_EXERCISES = [
  "military-press",
  "dumbbell-shoulder-press",
  "lateral-raise",
  "barbell-curl",
  "legacy-barbell-curl",
  "hammer-curl",
  "preacher-curl",
  "rope-pushdown",
  "straight-bar-pushdown",
  ...BENCH_VARIANTS,
] as const;
export type UpperExercise = (typeof UPPER_EXERCISES)[number];
export const isUpperExercise = (key: string): key is UpperExercise =>
  (UPPER_EXERCISES as readonly string[]).includes(key);
