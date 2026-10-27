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

export const priorityLabels: Record<number, string> = {
  1: "P1 · Básicos essenciais",
  2: "P2 · Musculação e core",
  3: "P3 · Funcional e landmine",
  4: "P4 · Potência, saltos e LPO",
  5: "P5 · Habilidades avançadas",
};

export function compareImplementationPriority(
  a: ListAdminExercises200Item,
  b: ListAdminExercises200Item,
) {
  // Completed exercises stay out of the production queue, even with a high planned priority.
  const completed =
    Number(!!coverage(a).animation) - Number(!!coverage(b).animation);
  if (completed) return completed;
  return (
    (a.priority3d?.tier ?? 6) - (b.priority3d?.tier ?? 6) ||
    (a.priority3d?.order ?? Infinity) - (b.priority3d?.order ?? Infinity) ||
    a.name.localeCompare(b.name, "pt-BR") ||
    a.id.localeCompare(b.id)
  );
}

export function implementationQueue(exercises: ListAdminExercises200Item[]) {
  return new Map(
    exercises
      .filter((e) => !coverage(e).animation && e.priority3d)
      .sort(compareImplementationPriority)
      .map((e, index) => [e.id, index + 1]),
  );
}
