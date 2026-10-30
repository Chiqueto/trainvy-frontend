import { FLAT_DUMBBELL_FLY_INSTRUCTIONS } from "./flat-dumbbell-fly-instructions";
import { MACHINE_CHEST_PRESS_INSTRUCTIONS } from "./machine-chest-press-instructions";
import { PEC_DECK_INSTRUCTIONS } from "./pec-deck-instructions";
import { SMITH_BENCH_INSTRUCTIONS } from "./smith-bench-instructions";
import { SMITH_SQUAT_INSTRUCTIONS } from "./smith-squat-instructions";
import { LEG_EXTENSION_INSTRUCTIONS } from "./leg-extension-instructions";
import { SEATED_LEG_CURL_INSTRUCTIONS } from "./seated-leg-curl-instructions";

export type ExerciseAnimation =
  | "squat"
  | "bench-press"
  | "incline-dumbbell-press"
  | "flat-dumbbell-press"
  | "incline-bench-press"
  | "decline-bench-press"
  | "pec-deck"
  | "machine-fly"
  | "flat-dumbbell-fly"
  | "smith-bench-press"
  | "machine-chest-press"
  | "smith-squat"
  | "leg-extension"
  | "seated-leg-curl";

export interface ExerciseDefinition {
  name: string;
  equipment: string;
  id: string;
  muscles: { primary: readonly string[]; secondary: readonly string[] };
  instructions?:
    | typeof PEC_DECK_INSTRUCTIONS
    | typeof SMITH_BENCH_INSTRUCTIONS
    | typeof MACHINE_CHEST_PRESS_INSTRUCTIONS
    | typeof SMITH_SQUAT_INSTRUCTIONS;
}

export const EXERCISE_ANIMATIONS = {
  "seated-leg-curl": {
    name: "Cadeira Flexora",
    equipment: "Máquina flexora sentada com apoio de coxas e rolo posterior às pernas",
    id: "00000000-0000-4000-8000-000000000111",
    instructions: SEATED_LEG_CURL_INSTRUCTIONS,
    muscles: {
      primary: ["Isquiotibiais — bíceps femoral, semitendíneo e semimembranáceo"],
      secondary: ["Gastrocnêmio", "Sartório", "Grácil"],
    },
  },
  "leg-extension": {
    name: "Cadeira Extensora",
    equipment: "Máquina extensora com encosto, alças laterais e rolo anterior às pernas",
    id: "00000000-0000-4000-8000-000000000110",
    instructions: LEG_EXTENSION_INSTRUCTIONS,
    muscles: {
      primary: ["Quadríceps — reto femoral e vastos lateral, medial e intermédio"],
      secondary: ["Bíceps femoral — coativação estabilizadora"],
    },
  },
  "flat-dumbbell-fly": {
    name: "Crucifixo reto com halteres", equipment: "Banco reto e dois halteres",
    id: "d555deb1-6eef-436d-8377-9427ac267697",
    instructions: FLAT_DUMBBELL_FLY_INSTRUCTIONS,
    muscles: { primary: ["Peitoral maior"], secondary: ["Deltoide anterior", "Bíceps braquial"] },
  },
  "machine-chest-press": {
    name: "Supino Reto na Máquina",
    equipment: "Máquina de supino articulada com encosto e pegadores",
    id: "f3e5e1cf-d232-4a80-87b3-9f35650a1b5e",
    instructions: MACHINE_CHEST_PRESS_INSTRUCTIONS,
    muscles: {
      primary: ["Peitoral maior (porções esternocostal e clavicular)"],
      secondary: ["Tríceps braquial", "Deltoide anterior"],
    },
  },
  "machine-fly": {
    name: "Crucifixo na Máquina",
    equipment: "Máquina de crucifixo com pegadores e encosto, sem apoio de antebraços",
    id: "6ca42bbc-3724-45ec-98ed-36fb53af260a",
    instructions: {
      description: "Adução horizontal na máquina com pegadores, sem apoio de antebraços.",
      setup: "Sente com costas no encosto e pés apoiados. Segure os pegadores à altura do peito, com cotovelos levemente flexionados.",
      execution: "Aproxime os pegadores em arco à frente do peito mantendo a flexão dos cotovelos. Reabra de forma controlada até uma amplitude confortável.",
      tips: "Mantenha o tronco apoiado. Esta variação usa pegadores; o Peck Deck usa apoios de antebraço. Participação muscular ilustrativa.",
    },
    muscles: { primary: ["Peitoral maior"], secondary: ["Deltoide anterior", "Bíceps braquial"] },
  },
  "pec-deck": {
    name: "Peck Deck",
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
  "smith-squat": {
    name: "Agachamento no Smith",
    equipment: "Máquina Smith com barra guiada vertical e travas de segurança",
    id: "d3b3f492-65fa-4038-851f-6f46b69e9fb4",
    instructions: SMITH_SQUAT_INSTRUCTIONS,
    muscles: {
      primary: ["Quadríceps", "Glúteos (ênfase no máximo)"],
      secondary: ["Adutores"],
    },
  },
  "bench-press": {
    name: "Supino Reto com Barra",
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
  if (id === EXERCISE_ANIMATIONS["seated-leg-curl"].id) return "seated-leg-curl";
  if (id === EXERCISE_ANIMATIONS["leg-extension"].id) return "leg-extension";
  if (id === EXERCISE_ANIMATIONS["flat-dumbbell-fly"].id) return "flat-dumbbell-fly";
  if (id === EXERCISE_ANIMATIONS["smith-bench-press"].id)
    return "smith-bench-press";
  if (id === EXERCISE_ANIMATIONS["machine-chest-press"].id)
    return "machine-chest-press";
  if (id === EXERCISE_ANIMATIONS["pec-deck"].id) return "pec-deck";
  if (id === EXERCISE_ANIMATIONS["smith-squat"].id) return "smith-squat";
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

  if (id === EXERCISE_ANIMATIONS["machine-fly"].id) return "machine-fly";
  if (name) {
    const normalized = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (["cadeira flexora", "flexora sentada", "flexao de joelhos na maquina sentada", "seated leg curl"].includes(normalized)) return "seated-leg-curl";
    if (["cadeira extensora", "extensora", "leg extension", "seated leg extension", "extensao de joelhos na maquina"].includes(normalized)) return "leg-extension";

    if (
      [
        "supino reto na maquina",
        "supino reto maquina",
        "supino na maquina",
        "supino maquina",
        "supino sentado na maquina",
        "supino maquina sentado",
        "supino articulado",
        "machine chest press",
        "chest press machine",
      ].includes(normalized)
    ) {
      return "machine-chest-press";
    }

    if (["crucifixo na maquina", "crucifixo maquina"].includes(normalized)) return "machine-fly";
    if (normalized === "crucifixo reto com halteres") return "flat-dumbbell-fly";
    if (
      [
        "peck deck",
        "pec deck",
        "voador",
        "crucifixo na maquina (peck deck)",
        "crucifixo na maquina — aliases: peck deck, pec deck, voador",
      ].includes(normalized)
    )
      return "pec-deck";

    if (
      [
        "agachamento no smith",
        "agachamento smith",
        "smith squat",
        "agachamento na maquina smith",
        "agachamento maquina smith",
      ].includes(normalized)
    ) {
      return "smith-squat";
    }

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
