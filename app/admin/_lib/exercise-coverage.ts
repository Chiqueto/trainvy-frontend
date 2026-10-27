import type { ListAdminExercises200Item } from "@/app/_lib/api/fetch-generated";
import { getExerciseAnimation } from "@/app/_components/exercise-3d/exercises";

export const muscleLabels: Record<string, string> = {
  CHEST: "Peito",
  BACK: "Costas",
  SHOULDERS: "Ombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  FOREARMS: "Antebraços",
  QUADRICEPS: "Quadríceps",
  HAMSTRINGS: "Posteriores de coxa",
  GLUTES: "Glúteos",
  ADDUCTORS: "Adutores",
  HIP_ABDUCTORS: "Abdutores",
  CALVES: "Panturrilhas",
  CORE: "Core",
};
export function coverage(e: ListAdminExercises200Item) {
  return {
    animation: getExerciseAnimation(e.id, e.name),
    images: e.media.some((m) => m.hasImages),
    motion: e.media.some((m) => m.hasMotion),
    instructions: e.media.some((m) => m.hasInstructions),
    classified: e.muscles.some((m) => m.role === "PRIMARY"),
  };
}
export function normalizeCatalogSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
