"use server";

import {
  getExerciseMedia,
  type GetExerciseMedia200,
} from "@/app/_lib/api/fetch-generated";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server Action para consultar a mídia de demonstração e instruções de um exercício.
 * Client Component -> Server Action -> Orval -> Fastify
 */
export async function getExerciseMediaAction(
  exerciseId: string,
): Promise<ActionResult<GetExerciseMedia200>> {
  try {
    const response = await getExerciseMedia(exerciseId);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Não foi possível carregar a demonstração do exercício";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message ||
        "Erro de conexão ao buscar demonstração do exercício",
    };
  }
}
