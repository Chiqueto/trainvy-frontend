import type { ListAdminExercises200Item } from "@/app/_lib/api/fetch-generated";
import {
  compareImplementationPriority,
  coverage,
  muscleLabels,
  trainingGroupLabels,
} from "./exercise-coverage";

export const catalogColumns = {
  priority: "Prioridade / fila",
  name: "Exercício",
  family: "Família",
  groups: "Grupo de exercícios",
  primary: "Músculos principais",
  secondary: "Músculos secundários",
  animation: "Animação 3D",
  images: "Imagens",
  instructions: "Instruções",
  updatedAt: "Atualização",
  details: "Detalhes",
} as const;
export type CatalogColumn = keyof typeof catalogColumns;
export const defaultColumns = Object.keys(catalogColumns) as CatalogColumn[];
export const defaultHidden: CatalogColumn[] = ["instructions", "updatedAt"];
export type CatalogSort = {
  column: Exclude<CatalogColumn, "details">;
  direction: "asc" | "desc";
};

export function muscleNames(
  e: ListAdminExercises200Item,
  role: "PRIMARY" | "SECONDARY",
) {
  return e.muscles
    .filter((m) => m.role === role)
    .map((m) => muscleLabels[m.muscleGroup] ?? m.muscleGroup)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .join(", ");
}
export function groupNames(e: ListAdminExercises200Item) {
  return (e.groups ?? [])
    .map((g) => trainingGroupLabels[g])
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .join(", ");
}
export function compareCatalogRows(
  a: ListAdminExercises200Item,
  b: ListAdminExercises200Item,
  sort: CatalogSort,
) {
  let result = 0;
  if (sort.column === "priority") result = compareImplementationPriority(a, b);
  else if (["animation", "images", "instructions"].includes(sort.column)) {
    const key = sort.column as "animation" | "images" | "instructions";
    result = Number(!!coverage(a)[key]) - Number(!!coverage(b)[key]);
  } else if (sort.column === "updatedAt")
    result = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  else {
    const value = (e: ListAdminExercises200Item) =>
      sort.column === "primary"
        ? muscleNames(e, "PRIMARY")
        : sort.column === "secondary"
          ? muscleNames(e, "SECONDARY")
          : sort.column === "groups"
            ? groupNames(e)
            : sort.column === "family"
              ? (e.family ?? "")
              : e.name;
    result = value(a).localeCompare(value(b), "pt-BR");
  }
  return (
    (sort.direction === "desc" ? -result : result) ||
    a.name.localeCompare(b.name, "pt-BR") ||
    a.id.localeCompare(b.id)
  );
}
