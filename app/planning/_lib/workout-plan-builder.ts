import type { CreateWorkoutPlanBody } from "@/app/_lib/api/fetch-generated";

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
  name: string;
  warmupSets?: number;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
  alternative1Name?: string;
  alternative2Name?: string;
};

export type WorkoutPlanDraftDay = {
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
    if (day.isRest) continue;
    const dayLabel = day.name.trim() || `Treino ${i + 1}`;
    if (!day.name.trim()) return `Informe o nome do treino ${i + 1}.`;
    if (day.estimatedDurationInMinutes < 1) {
      return `Informe uma duração válida para ${dayLabel}.`;
    }
    if (day.exercises.length === 0) {
      return `Adicione ao menos um exercício em ${dayLabel}.`;
    }
    for (const exercise of day.exercises) {
      if (!exercise.name.trim()) {
        return `Informe o nome de todos os exercícios de ${dayLabel}.`;
      }
      if (
        (exercise.warmupSets !== undefined &&
          (exercise.warmupSets < 0 || !Number.isInteger(exercise.warmupSets))) ||
        exercise.sets < 1 ||
        exercise.reps < 1 ||
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
): CreateWorkoutPlanBody["workoutDays"] {
  return days.map((day, index) => ({
    order: index,
    name: day.name.trim(),
    weekDay: day.weekDay ?? WEEK_DAYS[index % 7].value,
    isRest: day.isRest ?? false,
    estimatedDurationInSeconds: day.isRest
      ? 0
      : Math.round(day.estimatedDurationInMinutes * 60),
    coverImageUrl: null,
    exercises: day.isRest
      ? []
      : day.exercises.map((exercise, order) => ({
          order,
          name: exercise.name.trim(),
          warmupSets: exercise.warmupSets ?? 0,
          sets: exercise.sets,
          reps: exercise.reps,
          restTimeInSeconds: exercise.restTimeInSeconds,
          alternative1Name: exercise.alternative1Name?.trim() || null,
          alternative2Name: exercise.alternative2Name?.trim() || null,
        })),
  }));
}
