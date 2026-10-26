export type ExerciseAnimation = "squat" | "bench-press";

export interface ExerciseDefinition {
  name: string;
  equipment: string;
  id: string;
}

export const EXERCISE_ANIMATIONS = {
  squat: {
    name: "Agachamento livre",
    equipment: "Barra livre",
    id: "00000000-0000-4000-8000-000000000105",
  },
  "bench-press": {
    name: "Supino reto",
    equipment: "Banco reto e barra",
    id: "00000000-0000-4000-8000-000000000101",
  },
} satisfies Record<ExerciseAnimation, ExerciseDefinition>;

// Deliberately match canonical IDs only: an incline press or custom exercise
// with a similar name must never receive the wrong demonstration.
export function getExerciseAnimation(
  id?: string | null,
): ExerciseAnimation | null {
  if (id === EXERCISE_ANIMATIONS.squat.id) return "squat";
  if (
    id === EXERCISE_ANIMATIONS["bench-press"].id ||
    id === "00000000-0000-4000-8000-000000000102"
  )
    return "bench-press";
  return null;
}
