export type ExerciseAnimation =
  | "squat"
  | "bench-press"
  | "incline-dumbbell-press";

export interface ExerciseDefinition {
  name: string;
  equipment: string;
  id: string;
  muscles: { primary: readonly string[]; secondary: readonly string[] };
}

export const EXERCISE_ANIMATIONS = {
  squat: {
    name: "Agachamento livre",
    equipment: "Barra livre",
    id: "00000000-0000-4000-8000-000000000105",
    muscles: { primary: ["Quadríceps", "Glúteos"], secondary: ["Adutores"] },
  },
  "bench-press": {
    name: "Supino reto",
    equipment: "Banco reto e barra",
    id: "00000000-0000-4000-8000-000000000101",
    muscles: {
      primary: ["Peitoral maior"],
      secondary: ["Tríceps", "Deltoide anterior"],
    },
  },
  "incline-dumbbell-press": {
    name: "Supino inclinado com halteres",
    equipment: "Banco inclinado a 45° e dois halteres",
    id: "00000000-0000-4000-8000-000000000103",
    muscles: {
      primary: ["Peitoral maior — porção clavicular"],
      secondary: ["Tríceps", "Deltoide anterior"],
    },
  },
} satisfies Record<ExerciseAnimation, ExerciseDefinition>;

// Conhecidos IDs legados de exercícios antes do catálogo canônico global
const LEGACY_SQUAT_IDS = new Set([
  "f5ab1b54-2261-4817-80b2-304f4824135b",
  "caa95df0-cb8e-4bfd-ba76-e8b3008b27dc",
]);

const LEGACY_BENCH_IDS = new Set(["f5eff850-07da-4ae9-b7d1-df8ec8137a5e"]);

// Retorna animação correspondente por ID canônico ou nome normalizado do exercício.
// Variantes de banco e equipamento só recebem a própria animação explicitamente suportada.
export function getExerciseAnimation(
  id?: string | null,
  name?: string | null,
): ExerciseAnimation | null {
  if (id === EXERCISE_ANIMATIONS.squat.id) return "squat";
  if (id === EXERCISE_ANIMATIONS["incline-dumbbell-press"].id)
    return "incline-dumbbell-press";
  if (
    id === EXERCISE_ANIMATIONS["bench-press"].id ||
    id === "00000000-0000-4000-8000-000000000102"
  )
    return "bench-press";

  if (id && LEGACY_SQUAT_IDS.has(id)) return "squat";
  if (id && LEGACY_BENCH_IDS.has(id)) return "bench-press";

  if (name) {
    const normalized = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized === "supino inclinado com halteres")
      return "incline-dumbbell-press";

    if (
      normalized === "agachamento livre" ||
      normalized === "agachamento" ||
      normalized === "agachamento com barra"
    ) {
      return "squat";
    }

    if (
      normalized === "supino reto" ||
      normalized === "supino reto com barra" ||
      normalized === "supino reto barra" ||
      normalized === "supino com barra"
    ) {
      return "bench-press";
    }
  }

  return null;
}
