import {
  ALL_MUSCLE_GROUPS,
  getMuscleGroupLabel,
  MUSCLE_GROUP_LABELS,
  type MuscleGroup,
  type MuscleRole,
} from "./muscle-labels";

export interface SessionMuscleVolume {
  muscleGroup: MuscleGroup;
  label: string;
  totalSets: number;
  workingSets: number;
  totalVolumeKg: number;
  intensity: number; // 0 to 1
  isPrimary: boolean;
}

export interface SessionMuscleSummary {
  muscles: Record<MuscleGroup, SessionMuscleVolume>;
  activeMusclesList: SessionMuscleVolume[]; // Sorted by totalSets desc
  topMuscleGroup: SessionMuscleVolume | null;
  maxSets: number;
  totalSessionSets: number;
}

export interface SessionExerciseInput {
  id: string;
  exerciseId?: string | null;
  exerciseNameSnapshot?: string | null;
  isUnilateral?: boolean;
  muscles?: Array<{
    muscleGroup: MuscleGroup | string;
    role: MuscleRole | string;
  }> | null;
  sets?: Array<{
    id?: string;
    type?: "WARMUP" | "WORKING" | string;
    completedAt?: string | null;
    weightInGrams?: number | null;
    reps?: number | null;
  }>;
}

export interface CatalogExerciseInput {
  id: string;
  name: string;
  muscles?: Array<{
    muscleGroup: MuscleGroup | string;
    role: MuscleRole | string;
  }>;
}

// Dicionário resiliente de termos para identificar grupos musculares por palavras-chave
const KEYWORD_MAP: Array<{
  keywords: string[];
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}> = [
  {
    keywords: [
      "supino",
      "bench press",
      "crucifixo",
      "chest fly",
      "peck deck",
      "voador",
      "crossover",
      "flexao",
      "flexão",
      "push up",
      "paralelas peito",
      "chest press",
      "peitoral",
    ],
    primary: ["CHEST"],
    secondary: ["TRICEPS", "SHOULDERS"],
  },
  {
    keywords: [
      "puxada",
      "pulldown",
      "remada",
      "row",
      "barra fixa",
      "pull up",
      "chin up",
      "lat pulldown",
      "pullover",
      "serrote",
      "cavalinho",
      "dorsal",
      "costas",
      "trapezio",
      "trapézio",
      "encolhimento",
    ],
    primary: ["BACK"],
    secondary: ["BICEPS", "FOREARMS"],
  },
  {
    keywords: [
      "desenvolvimento",
      "shoulder press",
      "overhead press",
      "elevacao lateral",
      "elevação lateral",
      "lateral raise",
      "elevacao frontal",
      "elevação frontal",
      "front raise",
      "crucifixo invertido",
      "face pull",
      "arnold",
      "deltoide",
      "ombro",
      "militar",
    ],
    primary: ["SHOULDERS"],
    secondary: ["TRICEPS"],
  },
  {
    keywords: [
      "rosca",
      "curl",
      "scott",
      "biceps",
      "bíceps",
      "martelo",
      "spider curl",
      "concentrada",
      "rosca direta",
    ],
    primary: ["BICEPS"],
    secondary: ["FOREARMS"],
  },
  {
    keywords: [
      "triceps",
      "tríceps",
      "testa",
      "skull crusher",
      "corda",
      "pulley triceps",
      "frances",
      "francês",
      "mergulho",
      "coice",
      "triceps banco",
      "coice triceps",
    ],
    primary: ["TRICEPS"],
    secondary: [],
  },
  {
    keywords: [
      "agachamento",
      "squat",
      "leg press",
      "extensora",
      "leg extension",
      "afundo",
      "lunge",
      "bulgaro",
      "búlgaro",
      "bulgarian",
      "hack",
      "sissy",
      "quadriceps",
      "quadríceps",
    ],
    primary: ["QUADRICEPS"],
    secondary: ["GLUTES"],
  },
  {
    keywords: [
      "stiff",
      "stiff leg",
      "flexora",
      "leg curl",
      "levantamento terra",
      "deadlift",
      "rdl",
      "romanian",
      "good morning",
      "bom dia",
      "isquiotibiais",
      "posterior",
    ],
    primary: ["HAMSTRINGS"],
    secondary: ["GLUTES", "BACK"],
  },
  {
    keywords: [
      "elevacao pelvica",
      "elevação pélvica",
      "hip thrust",
      "gluteo",
      "glúteo",
      "coice na polia",
      "quatro apoios",
      "glute bridge",
      "ponte",
    ],
    primary: ["GLUTES"],
    secondary: ["HAMSTRINGS"],
  },
  {
    keywords: [
      "adutora",
      "adutor",
      "adductor",
      "agachamento sumo",
      "agachamento sumô",
      "sumo squat",
    ],
    primary: ["ADDUCTORS"],
    secondary: ["QUADRICEPS"],
  },
  {
    keywords: [
      "abdutora",
      "abdutor",
      "abductor",
      "abducao de quadril",
      "abdução de quadril",
    ],
    primary: ["HIP_ABDUCTORS"],
    secondary: ["GLUTES"],
  },
  {
    keywords: [
      "panturrilha",
      "calf",
      "gemeos",
      "gêmeos",
      "soleo",
      "sóleo",
      "panturrilha sentado",
      "panturrilha em pe",
      "panturrilha em pé",
    ],
    primary: ["CALVES"],
    secondary: [],
  },
  {
    keywords: [
      "abdominal",
      "crunch",
      "prancha",
      "plank",
      "infra",
      "supra",
      "obliquo",
      "oblíquo",
      "russian twist",
      "roda abdominal",
      "core",
      "vacuum",
      "abdomem",
      "abdômen",
    ],
    primary: ["CORE"],
    secondary: [],
  },
  {
    keywords: [
      "antebraco",
      "antebraço",
      "forearm",
      "wrist curl",
      "rosca punho",
      "farmers walk",
      "pegada",
    ],
    primary: ["FOREARMS"],
    secondary: [],
  },
];

function normalizeStr(text?: string | null): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Identifica grupos musculares primários e secundários para um exercício
 */
export function resolveExerciseMuscles(
  exercise: SessionExerciseInput,
  catalog?: CatalogExerciseInput[]
): { primary: MuscleGroup[]; secondary: MuscleGroup[] } {
  // 1. Se o próprio exercício da sessão já traz músculos
  if (exercise.muscles && exercise.muscles.length > 0) {
    const primary: MuscleGroup[] = [];
    const secondary: MuscleGroup[] = [];
    for (const m of exercise.muscles) {
      const g = m.muscleGroup as MuscleGroup;
      if (ALL_MUSCLE_GROUPS.some((item) => item.value === g)) {
        if (m.role === "PRIMARY") primary.push(g);
        else secondary.push(g);
      }
    }
    if (primary.length > 0 || secondary.length > 0) {
      return { primary, secondary };
    }
  }

  // 2. Procura no catálogo por ID
  if (catalog && exercise.exerciseId) {
    const found = catalog.find((c) => c.id === exercise.exerciseId);
    if (found?.muscles && found.muscles.length > 0) {
      const primary: MuscleGroup[] = [];
      const secondary: MuscleGroup[] = [];
      for (const m of found.muscles) {
        const g = m.muscleGroup as MuscleGroup;
        if (ALL_MUSCLE_GROUPS.some((item) => item.value === g)) {
          if (m.role === "PRIMARY") primary.push(g);
          else secondary.push(g);
        }
      }
      if (primary.length > 0 || secondary.length > 0) {
        return { primary, secondary };
      }
    }
  }

  // 3. Procura no catálogo por Nome normalizado
  const nameNorm = normalizeStr(exercise.exerciseNameSnapshot);
  if (catalog && nameNorm) {
    const foundByName = catalog.find(
      (c) => normalizeStr(c.name) === nameNorm
    );
    if (foundByName?.muscles && foundByName.muscles.length > 0) {
      const primary: MuscleGroup[] = [];
      const secondary: MuscleGroup[] = [];
      for (const m of foundByName.muscles) {
        const g = m.muscleGroup as MuscleGroup;
        if (ALL_MUSCLE_GROUPS.some((item) => item.value === g)) {
          if (m.role === "PRIMARY") primary.push(g);
          else secondary.push(g);
        }
      }
      if (primary.length > 0 || secondary.length > 0) {
        return { primary, secondary };
      }
    }
  }

  // 4. Fallback pelo dicionário de palavras-chave
  for (const entry of KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (nameNorm.includes(normalizeStr(kw))) {
        return {
          primary: entry.primary,
          secondary: entry.secondary,
        };
      }
    }
  }

  return { primary: [], secondary: [] };
}

/**
 * Calcula o volume de séries e carga para cada um dos 13 grupos musculares.
 * A intensidade é calculada proporcionalmente ao maior grupo do treino (0 a 1).
 */
export function calculateSessionMuscleStats(
  sessionExercises: SessionExerciseInput[],
  catalogExercises?: CatalogExerciseInput[]
): SessionMuscleSummary {
  const musclesMap: Record<MuscleGroup, SessionMuscleVolume> = {} as Record<
    MuscleGroup,
    SessionMuscleVolume
  >;

  // Inicializa os 13 grupos musculares com zero
  for (const groupItem of ALL_MUSCLE_GROUPS) {
    musclesMap[groupItem.value] = {
      muscleGroup: groupItem.value,
      label: groupItem.label,
      totalSets: 0,
      workingSets: 0,
      totalVolumeKg: 0,
      intensity: 0,
      isPrimary: false,
    };
  }

  let totalSessionSets = 0;

  for (const ex of sessionExercises) {
    // Apenas séries concluídas
    const completedSets = (ex.sets || []).filter((s) => Boolean(s.completedAt));
    if (completedSets.length === 0) continue;

    const workingSets = completedSets.filter((s) => s.type === "WORKING");
    const countCompleted = completedSets.length;
    const countWorking = workingSets.length || countCompleted;

    totalSessionSets += countCompleted;

    // Volume em kg do exercício
    let exKg = 0;
    const sideMultiplier = ex.isUnilateral ? 2 : 1;
    for (const s of completedSets) {
      if (s.weightInGrams && s.reps) {
        exKg += (s.weightInGrams / 1000) * s.reps * sideMultiplier;
      }
    }

    const { primary, secondary } = resolveExerciseMuscles(
      ex,
      catalogExercises
    );

    // Músculos primários recebem 100% das séries e volume
    for (const p of primary) {
      const entry = musclesMap[p];
      if (entry) {
        entry.totalSets += countCompleted;
        entry.workingSets += countWorking;
        entry.totalVolumeKg += Math.round(exKg);
        entry.isPrimary = true;
      }
    }

    // Músculos secundários recebem 50% das séries estimadas
    for (const s of secondary) {
      // Se já for primário no mesmo exercício, não duplica
      if (primary.includes(s)) continue;
      const entry = musclesMap[s];
      if (entry) {
        entry.totalSets += Math.max(1, Math.round(countCompleted * 0.5));
        entry.workingSets += Math.max(1, Math.round(countWorking * 0.5));
        entry.totalVolumeKg += Math.round(exKg * 0.5);
      }
    }
  }

  // Descobre o volume máximo de séries entre os grupos trabalhados
  let maxSets = 0;
  for (const item of Object.values(musclesMap)) {
    if (item.totalSets > maxSets) {
      maxSets = item.totalSets;
    }
  }

  // Calcula a intensidade normalizada (0 a 1)
  const activeMusclesList: SessionMuscleVolume[] = [];
  for (const key of Object.keys(musclesMap) as MuscleGroup[]) {
    const entry = musclesMap[key];
    if (entry.totalSets > 0 && maxSets > 0) {
      // Normalização suave: de 0.35 (mínimo visível) até 1.0 (pico do treino)
      const ratio = entry.totalSets / maxSets;
      entry.intensity = Number((0.35 + ratio * 0.65).toFixed(2));
      activeMusclesList.push(entry);
    } else {
      entry.intensity = 0;
    }
  }

  // Ordena por maior volume de séries
  activeMusclesList.sort((a, b) => b.totalSets - a.totalSets);

  const topMuscleGroup = activeMusclesList[0] || null;

  return {
    muscles: musclesMap,
    activeMusclesList,
    topMuscleGroup,
    maxSets,
    totalSessionSets,
  };
}

/**
 * Retorna a cor em tons de vermelho/neon de acordo com a intensidade do músculo.
 * Se intensidade === 0, retorna cor neutra suave para o bonequinho.
 */
export function getMuscleFillColor(
  intensity: number,
  options?: {
    isTransparentBg?: boolean;
    neutralColor?: string;
  }
): string {
  if (intensity <= 0) {
    return options?.neutralColor || (options?.isTransparentBg ? "rgba(255, 255, 255, 0.12)" : "#27272a");
  }

  // Gradiente de vermelho por intensidade (de 0.35 até 1.0)
  if (intensity < 0.5) {
    // Vermelho suave / suporte secundário
    return "#f87171"; // Tailwind red-400
  }
  if (intensity < 0.8) {
    // Vermelho médio vibrante
    return "#ef4444"; // Tailwind red-500
  }
  // Vermelho intenso neon de alto volume
  return "#ff1f3d";
}
