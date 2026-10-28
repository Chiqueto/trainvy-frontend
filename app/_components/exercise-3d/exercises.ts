import { PEC_DECK_INSTRUCTIONS } from "./pec-deck-instructions";
import { SMITH_BENCH_INSTRUCTIONS } from "./smith-bench-instructions";

export type ExerciseAnimation =
  | "squat"
  | "bench-press"
  | "incline-dumbbell-press"
  | "flat-dumbbell-press"
  | "incline-bench-press"
  | "decline-bench-press"
  | "pec-deck"
  | "flat-dumbbell-fly"
  | "smith-bench-press";

export interface ExerciseDefinition {
  name: string;
  equipment: string;
  id: string;
  muscles: { primary: readonly string[]; secondary: readonly string[] };
  instructions?:
    | typeof PEC_DECK_INSTRUCTIONS
    | typeof SMITH_BENCH_INSTRUCTIONS;
}

export const EXERCISE_ANIMATIONS = {
  "flat-dumbbell-fly": {
    name: "Crucifixo reto com halteres", equipment: "Banco reto e dois halteres",
    id: "d555deb1-6eef-436d-8377-9427ac267697",
    instructions: { description: "Adução horizontal dos braços com halteres, com foco no peitoral maior.", setup: "Deite no banco reto com pés apoiados e segure os halteres acima do peito.", execution: "Abra os braços em arco, mantendo os cotovelos levemente flexionados; retorne suavemente pelo mesmo caminho.", tips: "Mantenha o tronco apoiado e use uma amplitude confortável. A pose é ilustrativa." },
    muscles: { primary: ["Peitoral maior"], secondary: ["Deltoide anterior", "Bíceps braquial"] },
  },
  "pec-deck": {
    name: "Crucifixo na Máquina (peck deck)",
    equipment: "Máquina peck deck com encosto e apoios de antebraço",
    id: "b9859cd9-6ed6-4e63-8fd0-500e8cf8d553",
    instructions: PEC_DECK_INSTRUCTIONS,
    muscles: {
      primary: ["Peitoral maior — porções clavicular e esternocostal"],
      secondary: ["Deltoide anterior"],
    },
  },
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
    equipment: "Banco inclinado a 30° e dois halteres",
    id: "00000000-0000-4000-8000-000000000103",
    muscles: {
      primary: ["Peitoral superior (porção clavicular)"],
      secondary: ["Peitoral médio/inferior", "Tríceps", "Deltoide anterior"],
    },
  },
  "flat-dumbbell-press": {
    name: "Supino reto com halteres",
    equipment: "Banco reto e dois halteres",
    id: "6ef90b25-cd99-4860-8933-ae29e4d1f3d8",
    muscles: {
      primary: ["Peitoral maior (porção esternocostal)"],
      secondary: [
        "Peitoral superior (porção clavicular)",
        "Tríceps",
        "Deltoide anterior",
      ],
    },
  },
  "incline-bench-press": {
    name: "Supino inclinado com barra",
    equipment: "Banco inclinado a 30° e barra",
    id: "00000000-0000-4000-8000-000000000104",
    muscles: {
      primary: ["Peitoral superior (porção clavicular)"],
      secondary: ["Peitoral médio/inferior", "Tríceps", "Deltoide anterior"],
    },
  },
  "decline-bench-press": {
    name: "Supino declinado com barra",
    equipment: "Banco declinado a -18° e barra",
    id: "eb910207-283c-414d-8d37-7c6b6d7de0d8",
    muscles: {
      primary: ["Peitoral maior (porção esternocostal e inferior)"],
      secondary: [
        "Peitoral superior (porção clavicular)",
        "Tríceps",
        "Deltoide anterior",
      ],
    },
  },
  "smith-bench-press": {
    name: "Supino Reto no Smith",
    equipment: "Máquina Smith com barra guiada e banco reto",
    id: "f5a99b5a-74d1-4622-880e-bcf24758dc31",
    instructions: SMITH_BENCH_INSTRUCTIONS,
    muscles: {
      primary: ["Peitoral maior (porções esternocostal e clavicular)"],
      secondary: ["Tríceps braquial", "Deltoide anterior"],
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
  if (id === EXERCISE_ANIMATIONS["flat-dumbbell-fly"].id) return "flat-dumbbell-fly";
  if (id === EXERCISE_ANIMATIONS["smith-bench-press"].id)
    return "smith-bench-press";
  if (id === EXERCISE_ANIMATIONS["pec-deck"].id) return "pec-deck";
  if (id === EXERCISE_ANIMATIONS.squat.id) return "squat";
  if (id === EXERCISE_ANIMATIONS["incline-dumbbell-press"].id)
    return "incline-dumbbell-press";
  if (id === EXERCISE_ANIMATIONS["flat-dumbbell-press"].id)
    return "flat-dumbbell-press";
  if (id === EXERCISE_ANIMATIONS["incline-bench-press"].id)
    return "incline-bench-press";
  if (id === EXERCISE_ANIMATIONS["decline-bench-press"].id)
    return "decline-bench-press";
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
    if (
      [
        "peck deck",
        "pec deck",
        "voador",
        "crucifixo na maquina",
        "crucifixo na maquina (peck deck)",
        "crucifixo na maquina — aliases: peck deck, pec deck, voador",
      ].includes(normalized)
    )
      return "pec-deck";

    if (normalized === "supino inclinado com halteres")
      return "incline-dumbbell-press";

    if (
      normalized === "supino inclinado com barra" ||
      normalized === "supino inclinado barra" ||
      normalized === "supino inclinado"
    ) {
      return "incline-bench-press";
    }

    if (
      normalized === "supino declinado com barra" ||
      normalized === "supino declinado barra" ||
      normalized === "supino declinado"
    ) {
      return "decline-bench-press";
    }

    if (
      normalized === "supino reto com halteres" ||
      normalized === "supino com halteres" ||
      normalized === "supino com halter" ||
      normalized === "supino reto halter" ||
      normalized === "supino reto halteres"
    ) {
      return "flat-dumbbell-press";
    }

    if (
      normalized === "agachamento livre" ||
      normalized === "agachamento" ||
      normalized === "agachamento com barra"
    ) {
      return "squat";
    }

    if (
      normalized === "supino reto no smith" ||
      normalized === "supino no smith" ||
      normalized === "supino smith" ||
      normalized === "supino reto smith"
    ) {
      return "smith-bench-press";
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
