"use server";

import {
  confirmForgottenWorkoutRecovery,
  type ConfirmForgottenWorkoutRecovery200,
  type ConfirmForgottenWorkoutRecoveryBody,
  createForgottenWorkoutDraft,
  type CreateForgottenWorkoutDraft201,
  type CreateForgottenWorkoutDraftBody,
  discardForgottenWorkoutDraft,
  type DiscardForgottenWorkoutDraft200,
  getForgottenWorkoutDraft,
  type GetForgottenWorkoutDraft200,
  updateForgottenWorkoutDraft,
  type UpdateForgottenWorkoutDraft200,
  type UpdateForgottenWorkoutDraftBody,
} from "@/app/_lib/api/fetch-generated";

export type RecoveryActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; status?: number };

export async function getForgottenWorkoutDraftAction(
  draftId: string,
): Promise<RecoveryActionResult<GetForgottenWorkoutDraft200>> {
  try {
    const res = await getForgottenWorkoutDraft(draftId);
    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    const err = res.data as { error?: string; code?: string };
    return {
      success: false,
      error: err?.error || "Erro ao consultar rascunho de recuperação.",
      code: err?.code,
      status: res.status,
    };
  } catch (err) {
    console.error("Failed to get forgotten workout draft:", err);
    return {
      success: false,
      error: "Falha de comunicação ao buscar rascunho.",
    };
  }
}

export async function updateForgottenWorkoutDraftAction(
  draftId: string,
  body: UpdateForgottenWorkoutDraftBody,
): Promise<RecoveryActionResult<UpdateForgottenWorkoutDraft200>> {
  try {
    const res = await updateForgottenWorkoutDraft(draftId, body);
    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    const err = res.data as { error?: string; code?: string };
    return {
      success: false,
      error: err?.error || "Erro ao atualizar rascunho de recuperação.",
      code: err?.code,
      status: res.status,
    };
  } catch (err) {
    console.error("Failed to update forgotten workout draft:", err);
    return {
      success: false,
      error: "Falha de comunicação ao atualizar rascunho.",
    };
  }
}

export async function confirmForgottenWorkoutRecoveryAction(
  draftId: string,
  body: ConfirmForgottenWorkoutRecoveryBody,
): Promise<RecoveryActionResult<ConfirmForgottenWorkoutRecovery200>> {
  try {
    const res = await confirmForgottenWorkoutRecovery(draftId, body);
    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    const err = res.data as { error?: string; code?: string };
    return {
      success: false,
      error: err?.error || "Erro ao confirmar recuperação do treino.",
      code: err?.code,
      status: res.status,
    };
  } catch (err) {
    console.error("Failed to confirm forgotten workout recovery:", err);
    return {
      success: false,
      error: "Falha de comunicação ao confirmar recuperação.",
    };
  }
}

export async function discardForgottenWorkoutDraftAction(
  draftId: string,
  reason?: string,
): Promise<RecoveryActionResult<DiscardForgottenWorkoutDraft200>> {
  try {
    const res = await discardForgottenWorkoutDraft(draftId, {
      ...(reason ? { reason } : {}),
    });
    if (res.status === 200) {
      return { success: true, data: res.data };
    }
    const err = res.data as { error?: string; code?: string };
    return {
      success: false,
      error: err?.error || "Erro ao descartar rascunho.",
      code: err?.code,
      status: res.status,
    };
  } catch (err) {
    console.error("Failed to discard forgotten workout draft:", err);
    return {
      success: false,
      error: "Falha de comunicação ao descartar rascunho.",
    };
  }
}

export async function createForgottenWorkoutDraftAction(
  body: CreateForgottenWorkoutDraftBody,
): Promise<RecoveryActionResult<CreateForgottenWorkoutDraft201>> {
  try {
    const res = await createForgottenWorkoutDraft(body);
    if (res.status === 201) {
      return { success: true, data: res.data };
    }
    const err = res.data as { error?: string; code?: string };
    return {
      success: false,
      error: err?.error || "Erro ao criar rascunho de recuperação.",
      code: err?.code,
      status: res.status,
    };
  } catch (err) {
    console.error("Failed to create forgotten workout draft:", err);
    return {
      success: false,
      error: "Falha de comunicação ao criar rascunho.",
    };
  }
}
