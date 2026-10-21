"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addExerciseToWorkoutSession,
  cancelWorkoutSession,
  completeWorkoutSession,
  confirmWorkoutSetProposal,
  createExercise,
  createWorkoutSet,
  deleteWorkoutSet,
  discardWorkoutSetProposal,
  getAiConsent,
  listExercises,
  listWorkoutSetProposals,
  patchAiConsent,
  removeExerciseFromWorkoutSession,
  startFreeWorkoutSession,
  substituteSessionExercise,
  updateExerciseMuscles,
  updateWorkoutSet,
  type AddExerciseToWorkoutSession201,
  type CancelWorkoutSession200,
  type CompleteWorkoutSession200,
  type ConfirmWorkoutSetProposal200,
  type ConfirmWorkoutSetProposalBody,
  type CreateExercise201,
  type CreateExerciseBodyPrimaryMuscleGroupsItem,
  type CreateExerciseBodySecondaryMuscleGroupsItem,
  type CreateWorkoutSet201,
  type CreateWorkoutSetBody,
  type DiscardWorkoutSetProposal200,
  type DiscardWorkoutSetProposalBody,
  type GetAiConsent200,
  type ListExercises200Item,
  type ListWorkoutSetProposals200,
  type PatchAiConsent200,
  type PatchAiConsentBody,
  type RemoveExerciseFromWorkoutSession200,
  type SubstituteSessionExercise200,
  type UpdateExerciseMuscles200,
  type UpdateExerciseMusclesBodyPrimaryMuscleGroupsItem,
  type UpdateExerciseMusclesBodySecondaryMuscleGroupsItem,
  type UpdateWorkoutSet200,
  type UpdateWorkoutSetBody,
} from "@/app/_lib/api/fetch-generated";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Cria uma nova série para o SessionExercise especificado.
 */
export async function createWorkoutSetAction(
  sessionId: string,
  sessionExerciseId: string,
  body: CreateWorkoutSetBody = {},
): Promise<ActionResult<CreateWorkoutSet201>> {
  try {
    const response = await createWorkoutSet(sessionExerciseId, body);
    if (response.status !== 201) {
      const errorMsg =
        (response.data as { error?: string })?.error || "Erro ao criar série";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao criar série",
    };
  }
}

/**
 * Atualiza os valores parciais de uma série existente.
 */
export async function updateWorkoutSetAction(
  sessionId: string,
  setId: string,
  body: UpdateWorkoutSetBody,
): Promise<ActionResult<UpdateWorkoutSet200>> {
  try {
    const response = await updateWorkoutSet(setId, body);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao atualizar série";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao atualizar série",
    };
  }
}

/**
 * Remove uma série da sessão aberta.
 */
export async function deleteWorkoutSetAction(
  sessionId: string,
  setId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const response = await deleteWorkoutSet(setId);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error || "Erro ao remover série";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao remover série",
    };
  }
}

/**
 * Conclui a sessão de treino ativa.
 */
export async function completeWorkoutSessionAction(
  sessionId: string,
  body?: { forceComplete?: boolean },
): Promise<ActionResult<CompleteWorkoutSession200>> {
  try {
    const response = await completeWorkoutSession(sessionId, body ?? {});
    if (response.status !== 200) {
      const errorData = response.data as { error?: string; code?: string } | undefined;
      const errorMsg =
        errorData?.error || "Erro ao finalizar treino";
      const code = errorData?.code;
      return { success: false, error: errorMsg, code };
    }

    revalidatePath(`/workout-sessions/${sessionId}`);
    revalidatePath("/");
    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao finalizar treino",
    };
  }
}

/**
 * Inicia uma sessão de treino avulsa e redireciona para a tela do tracker.
 */
export async function startFreeWorkoutAction(): Promise<void> {
  const response = await startFreeWorkoutSession();
  if (response.status !== 201) {
    const errorData = response.data as { error?: string };
    throw new Error(errorData?.error || "Erro ao iniciar treino avulso");
  }

  const sessionId = response.data.userWorkoutSessionId;
  revalidatePath("/");
  redirect(`/workout-sessions/${sessionId}`);
}

/**
 * Lista exercícios globais e próprios com filtro opcional.
 */
export async function listExercisesAction(
  query?: string,
): Promise<ActionResult<ListExercises200Item[]>> {
  try {
    const response = await listExercises(query ? { q: query } : undefined);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao listar exercícios";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao listar exercícios",
    };
  }
}

/**
 * Cria um exercício personalizado para o usuário logado com suporte a grupos musculares.
 */
export async function createExerciseAction(
  input:
    | string
    | {
        name: string;
        isUnilateral?: boolean;
        primaryMuscleGroups?: CreateExerciseBodyPrimaryMuscleGroupsItem[];
        secondaryMuscleGroups?: CreateExerciseBodySecondaryMuscleGroupsItem[];
      },
): Promise<ActionResult<CreateExercise201>> {
  try {
    const name = typeof input === "string" ? input : input.name;
    const trimmed = name?.trim();
    if (!trimmed) {
      return { success: false, error: "Nome do exercício é obrigatório" };
    }

    const isUnilateral =
      typeof input === "object" ? input.isUnilateral : undefined;
    const primaryMuscleGroups =
      typeof input === "object" ? input.primaryMuscleGroups : undefined;
    const secondaryMuscleGroups =
      typeof input === "object" ? input.secondaryMuscleGroups : undefined;

    const response = await createExercise({
      name: trimmed,
      isUnilateral,
      primaryMuscleGroups,
      secondaryMuscleGroups,
    });
    if (response.status !== 201) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao criar exercício";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao criar exercício",
    };
  }
}

/**
 * Atualiza a classificação de grupos musculares de um exercício personalizado.
 */
export async function updateExerciseMusclesAction(
  exerciseId: string,
  input: {
    primaryMuscleGroups: UpdateExerciseMusclesBodyPrimaryMuscleGroupsItem[];
    secondaryMuscleGroups?: UpdateExerciseMusclesBodySecondaryMuscleGroupsItem[];
  },
): Promise<ActionResult<UpdateExerciseMuscles200>> {
  try {
    const response = await updateExerciseMuscles(exerciseId, input);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao atualizar classificação muscular";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message ||
        "Erro de conexão ao atualizar classificação muscular",
    };
  }
}

/**
 * Adiciona um exercício do catálogo a uma sessão avulsa aberta.
 */
export async function addExerciseToWorkoutSessionAction(
  sessionId: string,
  exerciseId: string,
): Promise<ActionResult<AddExerciseToWorkoutSession201>> {
  try {
    const response = await addExerciseToWorkoutSession(sessionId, {
      exerciseId,
    });
    if (response.status !== 201) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao adicionar exercício";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao adicionar exercício",
    };
  }
}

/**
 * Remove um exercício de uma sessão avulsa aberta.
 */
export async function removeExerciseFromWorkoutSessionAction(
  sessionId: string,
  sessionExerciseId: string,
): Promise<ActionResult<RemoveExerciseFromWorkoutSession200>> {
  try {
    const response = await removeExerciseFromWorkoutSession(sessionExerciseId);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao remover exercício";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao remover exercício",
    };
  }
}

/**
 * Cancela e descarta a sessão de treino ativa.
 */
export async function cancelWorkoutSessionAction(
  sessionId: string,
): Promise<ActionResult<CancelWorkoutSession200>> {
  try {
    const response = await cancelWorkoutSession(sessionId);

    if (response.status !== 200) {
      const errorMsg = response.data.error || "Erro ao cancelar treino";
      return { success: false, error: errorMsg };
    }

    revalidatePath("/");
    return {
      success: true,
      data: response.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao cancelar treino",
    };
  }
}

/**
 * Substitui o exercício de um SessionExercise por outro durante a sessão ativa.
 */
export async function substituteSessionExerciseAction(
  sessionId: string,
  sessionExerciseId: string,
  newExerciseId: string,
): Promise<ActionResult<SubstituteSessionExercise200>> {
  try {
    const response = await substituteSessionExercise(
      sessionId,
      sessionExerciseId,
      { newExerciseId },
    );

    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao substituir exercício";
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao substituir exercício",
    };
  }
}

/**
 * Lista propostas de séries ativas/históricas da sessão de treino.
 */
export async function listWorkoutSetProposalsAction(
  sessionId: string,
): Promise<ActionResult<ListWorkoutSetProposals200>> {
  try {
    const response = await listWorkoutSetProposals(sessionId);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao listar propostas de séries";
      const code = (response.data as { code?: string })?.code;
      return { success: false, error: errorMsg, code };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao listar propostas de séries",
    };
  }
}

/**
 * Confirma proposta de séries gerada pela IA, persistindo WorkoutSets reais no banco.
 */
export async function confirmWorkoutSetProposalAction(
  sessionId: string,
  proposalId: string,
  body: ConfirmWorkoutSetProposalBody,
): Promise<ActionResult<ConfirmWorkoutSetProposal200>> {
  try {
    const response = await confirmWorkoutSetProposal(
      sessionId,
      proposalId,
      body,
    );

    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao confirmar proposta de séries";
      const code = (response.data as { code?: string })?.code;
      return { success: false, error: errorMsg, code };
    }

    revalidatePath(`/workout-sessions/${sessionId}`);
    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao confirmar proposta",
    };
  }
}

/**
 * Descarta proposta de séries gerada pela IA.
 */
export async function discardWorkoutSetProposalAction(
  sessionId: string,
  proposalId: string,
  body: DiscardWorkoutSetProposalBody = {},
): Promise<ActionResult<DiscardWorkoutSetProposal200>> {
  try {
    const response = await discardWorkoutSetProposal(
      sessionId,
      proposalId,
      body,
    );

    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao descartar proposta de séries";
      const code = (response.data as { code?: string })?.code;
      return { success: false, error: errorMsg, code };
    }

    revalidatePath(`/workout-sessions/${sessionId}`);
    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao descartar proposta",
    };
  }
}

/**
 * Consulta status de consentimento LGPD para uso do histórico de treinos pela IA.
 */
export async function getAiConsentAction(): Promise<ActionResult<GetAiConsent200>> {
  try {
    const response = await getAiConsent();
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao consultar consentimento de IA";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao consultar consentimento",
    };
  }
}

/**
 * Atualiza status de consentimento LGPD para uso do histórico de treinos pela IA.
 */
export async function updateAiConsentAction(
  body: PatchAiConsentBody,
): Promise<ActionResult<PatchAiConsent200>> {
  try {
    const response = await patchAiConsent(body);
    if (response.status !== 200) {
      const errorMsg =
        (response.data as { error?: string })?.error ||
        "Erro ao atualizar consentimento de IA";
      return { success: false, error: errorMsg };
    }

    return { success: true, data: response.data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message || "Erro de conexão ao atualizar consentimento",
    };
  }
}


