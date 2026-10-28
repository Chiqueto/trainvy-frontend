import type { ListExercises200Item } from "./api/fetch-generated";
export type ExerciseAnatomy = NonNullable<ListExercises200Item["anatomy"]>;

export function anatomySearchTerms(anatomy?: ExerciseAnatomy | null): string[] {
  return anatomy
    ? [
        ...anatomy.aliases,
        ...anatomy.participants.flatMap((p) => [
          p.label,
          ...p.aliases,
          ...p.regions.flatMap((r) => [r.label, ...r.aliases]),
        ]),
      ]
    : [];
}
export function anatomyMuscleNames(
  anatomy: ExerciseAnatomy | null | undefined,
  role: "PRIMARY" | "SECONDARY",
): string[] {
  return (
    anatomy?.participants
      .filter((p) => p.role === role)
      .map((p) =>
        p.regions.length
          ? `${p.label} (${p.regions.map((r) => r.label.toLocaleLowerCase("pt-BR")).join(", ")})`
          : p.label,
      ) ?? []
  );
}
