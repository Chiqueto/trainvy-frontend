export const UPPER_EXERCISES = [
  "military-press",
  "dumbbell-shoulder-press",
  "lateral-raise",
  "barbell-curl",
  "legacy-barbell-curl",
  "hammer-curl",
] as const;
export type UpperExercise = (typeof UPPER_EXERCISES)[number];
export const isUpperExercise = (key: string): key is UpperExercise =>
  (UPPER_EXERCISES as readonly string[]).includes(key);
