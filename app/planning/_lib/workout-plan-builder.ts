import type {
  EditWorkoutPlanBody,
  GetEditableWorkoutPlan200,
} from "@/app/_lib/api/fetch-generated";

export const WEEK_DAYS = [
  { value: "MONDAY", label: "Segunda" },
  { value: "TUESDAY", label: "Terça" },
  { value: "WEDNESDAY", label: "Quarta" },
  { value: "THURSDAY", label: "Quinta" },
  { value: "FRIDAY", label: "Sexta" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
] as const;

export type WorkoutPlanDraftExercise = {
  repsMin?: number | null;
  repsMax?: number | null;
  targetRir?: number | null;
  targetLoadInGrams?: number | null;
  tempo?: string | null;
  id?: string;
  exerciseId?: string | null;
  alternative1ExerciseId?: string | null;
  alternative2ExerciseId?: string | null;
  name: string;
  warmupSets?: number;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
  alternative1Name?: string;
  alternative2Name?: string;
};

export type WorkoutPlanDraftDay = {
  id?: string;
  coverImageUrl?: string | null;
  weekDay?: (typeof WEEK_DAYS)[number]["value"];
  label?: string;
  isRest: boolean;
  name: string;
  estimatedDurationInMinutes: number;
  exercises: WorkoutPlanDraftExercise[];
};

export function createDraftExercise(): WorkoutPlanDraftExercise {
  return {
    name: "",
    warmupSets: 0,
    sets: 3,
    reps: 10,
    restTimeInSeconds: 60,
    alternative1Name: "",
    alternative2Name: "",
  };
}

export function createDraftWorkoutDay(letter: string): WorkoutPlanDraftDay {
  return {
    name: `Treino ${letter}`,
    isRest: false,
    estimatedDurationInMinutes: 60,
    exercises: [createDraftExercise()],
  };
}

export function createInitialWorkoutDays(): WorkoutPlanDraftDay[] {
  return [
    {
      name: "Treino A - Peito e Tríceps",
      isRest: false,
      estimatedDurationInMinutes: 60,
      exercises: [createDraftExercise()],
    },
    {
      name: "Treino B - Costas e Bíceps",
      isRest: false,
      estimatedDurationInMinutes: 60,
      exercises: [createDraftExercise()],
    },
    {
      name: "Treino C - Pernas e Ombros",
      isRest: false,
      estimatedDurationInMinutes: 60,
      exercises: [createDraftExercise()],
    },
  ];
}

export function validateWorkoutPlanDraft(
  name: string,
  days: WorkoutPlanDraftDay[],
  plannedStartDate?: string,
  plannedEndDate?: string,
): string | null {
  if (!name.trim()) return "Informe o nome do plano.";
  if (days.length === 0) return "Adicione pelo menos um treino à sua rotina.";
  if (plannedStartDate && plannedEndDate && plannedEndDate < plannedStartDate) {
    return "A data final não pode ser anterior à data inicial.";
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayLabel = day.name.trim() || `Treino ${i + 1}`;
    if (!day.name.trim()) return `Informe o nome do treino ${i + 1}.`;
    if (day.isRest) continue;
    if (
      !Number.isFinite(day.estimatedDurationInMinutes) ||
      day.estimatedDurationInMinutes < 1
    ) {
      return `Informe uma duração válida para ${dayLabel}.`;
    }
    if (day.exercises.length === 0) {
      return `Adicione ao menos um exercício em ${dayLabel}.`;
    }
    for (const exercise of day.exercises) {
      const min = exercise.repsMin ?? null,
        max = exercise.repsMax ?? null;
      if (
        (min === null) !== (max === null) ||
        (min !== null &&
          max !== null &&
          (!Number.isInteger(min) ||
            !Number.isInteger(max) ||
            min < 1 ||
            max < min))
      )
        return `Revise a faixa de repetições em ${dayLabel}.`;
      if (
        exercise.targetRir != null &&
        (!Number.isInteger(exercise.targetRir) ||
          exercise.targetRir < 0 ||
          exercise.targetRir > 10)
      )
        return `Informe um RIR alvo entre 0 e 10 em ${dayLabel}.`;
      if (
        exercise.targetLoadInGrams != null &&
        (!Number.isInteger(exercise.targetLoadInGrams) ||
          exercise.targetLoadInGrams < 0 ||
          exercise.targetLoadInGrams > 2000000)
      )
        return `Revise a carga alvo em ${dayLabel}.`;
      // Existing prescriptions may predate the catalog. Keep them editable;
      // new exercises (including AI drafts) must reference a catalog entry.
      if (!exercise.name.trim() || (!exercise.exerciseId && !exercise.id)) {
        return `Selecione todos os exercícios de ${dayLabel} no catálogo.`;
      }
      if (
        !exercise.id &&
        ((exercise.alternative1Name?.trim() &&
          !exercise.alternative1ExerciseId) ||
          (exercise.alternative2Name?.trim() &&
            !exercise.alternative2ExerciseId))
      ) {
        return `Selecione as alternativas de ${dayLabel} no catálogo.`;
      }
      if (
        (exercise.warmupSets !== undefined &&
          (exercise.warmupSets < 0 ||
            !Number.isInteger(exercise.warmupSets))) ||
        !Number.isInteger(exercise.sets) ||
        exercise.sets < 1 ||
        !Number.isInteger(exercise.reps) ||
        exercise.reps < 1 ||
        !Number.isInteger(exercise.restTimeInSeconds) ||
        exercise.restTimeInSeconds < 1
      ) {
        return `Revise aquecimento, séries, repetições e descanso em ${dayLabel}.`;
      }
    }
  }

  return null;
}

export function serializeWorkoutDays(
  days: WorkoutPlanDraftDay[],
): EditWorkoutPlanBody["workoutDays"] {
  return days.map((day, index) => ({
    ...(day.id ? { id: day.id } : {}),
    order: index,
    name: day.name.trim(),
    weekDay: day.weekDay ?? WEEK_DAYS[index % 7].value,
    isRest: day.isRest ?? false,
    estimatedDurationInSeconds: day.isRest
      ? 0
      : Math.round(day.estimatedDurationInMinutes * 60),
    coverImageUrl: day.coverImageUrl ?? null,
    exercises: day.isRest
      ? []
      : day.exercises.map((exercise, order) => ({
          ...(exercise.id ? { id: exercise.id } : {}),
          exerciseId: exercise.exerciseId,
          alternative1ExerciseId: exercise.alternative1ExerciseId,
          alternative2ExerciseId: exercise.alternative2ExerciseId,
          order,
          name: exercise.name.trim(),
          warmupSets: exercise.warmupSets ?? 0,
          sets: exercise.sets,
          reps: exercise.reps,
          ...serializeAdvancedPrescription(exercise),
          restTimeInSeconds: exercise.restTimeInSeconds,
          alternative1Name: exercise.alternative1Name?.trim() || null,
          alternative2Name: exercise.alternative2Name?.trim() || null,
        })),
  }));
}

export function deserializeWorkoutDays(
  plan: GetEditableWorkoutPlan200,
): WorkoutPlanDraftDay[] {
  return plan.workoutDays.map((day) => ({
    id: day.id,
    name: day.name,
    weekDay: day.weekDay,
    isRest: day.isRest,
    coverImageUrl: day.coverImageUrl,
    estimatedDurationInMinutes: day.estimatedDurationInSeconds / 60,
    exercises: day.exercises.map((e) => ({
      ...e,
      alternative1Name: e.alternative1Name ?? "",
      alternative2Name: e.alternative2Name ?? "",
    })),
  }));
}

export function serializeAdvancedPrescription(
  exercise: Pick<
    WorkoutPlanDraftExercise,
    "repsMin" | "repsMax" | "targetRir" | "targetLoadInGrams" | "tempo"
  >,
) {
  return {
    repsMin: exercise.repsMin ?? null,
    repsMax: exercise.repsMax ?? null,
    targetRir: exercise.targetRir ?? null,
    targetLoadInGrams: exercise.targetLoadInGrams ?? null,
    tempo: exercise.tempo?.trim() || null,
  };
}
