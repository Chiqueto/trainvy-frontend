"use server";
import { listExercises } from "@/app/_lib/api/fetch-generated";
import { biomechanicalAlternatives } from "../../_lib/tactical";
export async function loadSwapAlternatives(exerciseId: string) {
  const result = await listExercises();
  if (result.status !== 200) throw new Error("Catálogo indisponível");
  const entry = result.data.find((e) => e.id === exerciseId);
  return entry ? biomechanicalAlternatives(entry, result.data) : [];
}
