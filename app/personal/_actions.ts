"use server";

import { revalidatePath } from "next/cache";
import {
  cancelCoachInvitation,
  cancelWorkoutPrescription,
  createCoachInvitation,
  createWorkoutPrescriptionDraft,
  generateCoachPrescriptionDraftWithAi,
  revokeCoachAthleteLink,
  sendWorkoutPrescription,
  updateWorkoutPrescriptionDraft,
  listCoachWorkoutPlanTemplates,
  getCoachWorkoutPlanTemplate,
  createCoachWorkoutPlanTemplate,
  updateCoachWorkoutPlanTemplate,
  deleteCoachWorkoutPlanTemplate,
  allocateCoachWorkoutPlanTemplate,
  createCoachWorkoutPlanTemplateFromPlan,
  listExercises,
  createExercise,
  updateCustomExercise,
  deleteCustomExercise,
  type CreateWorkoutPrescriptionDraftBody,
  type UpdateWorkoutPrescriptionDraftBody,
  type CreateCoachWorkoutPlanTemplateBody,
  type UpdateCoachWorkoutPlanTemplateBody,
  type AllocateCoachWorkoutPlanTemplateBody,
  type CreateCoachWorkoutPlanTemplateFromPlanBody,
  type CreateExerciseBody,
  type UpdateCustomExerciseBody,
} from "@/app/_lib/api/fetch-generated";

function getActionError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const result = data as { error?: unknown; message?: unknown };
  // Fastify validation responses contain both a generic error and a useful message.
  if (typeof result.message === "string" && result.message.trim())
    return result.message;
  if (typeof result.error === "string" && result.error !== "Bad Request")
    return result.error;
  return fallback;
}

export async function createInvitationAction(expiresInDays: number = 7) {
  try {
    const res = await createCoachInvitation(
      { expiresInDays },
      { cache: "no-store" },
    );

    if (res.status === 201) {
      return {
        success: true as const,
        data: res.data,
      };
    }

    const errorMsg = getActionError(res.data, "Erro ao gerar convite.");

    return {
      success: false as const,
      error: errorMsg,
    };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function cancelInvitationAction(invitationId: string) {
  try {
    const res = await cancelCoachInvitation(invitationId, {
      cache: "no-store",
    });

    if (res.status === 200) {
      revalidatePath("/personal");
      return { success: true as const };
    }

    const errorMsg = getActionError(res.data, "Erro ao cancelar convite.");

    return {
      success: false as const,
      error: errorMsg,
    };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function revokeStudentAction(linkId: string) {
  try {
    const res = await revokeCoachAthleteLink(linkId, { cache: "no-store" });

    if (res.status === 200) {
      revalidatePath("/personal");
      return { success: true as const };
    }

    const errorMsg = getActionError(
      res.data,
      "Erro ao encerrar vínculo com o aluno.",
    );

    return {
      success: false as const,
      error: errorMsg,
    };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function createPrescriptionDraftAction(
  body: CreateWorkoutPrescriptionDraftBody,
) {
  try {
    const res = await createWorkoutPrescriptionDraft(body, {
      cache: "no-store",
    });

    if (res.status === 201) {
      revalidatePath(`/personal/alunos/${body.athleteId}`);
      return { success: true as const, data: res.data };
    }

    const errorMsg = getActionError(
      res.data,
      "Erro ao criar rascunho de prescrição.",
    );

    return { success: false as const, error: errorMsg };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function updatePrescriptionDraftAction({
  id,
  athleteId,
  body,
}: {
  id: string;
  athleteId: string;
  body: UpdateWorkoutPrescriptionDraftBody;
}) {
  try {
    const res = await updateWorkoutPrescriptionDraft(id, body, {
      cache: "no-store",
    });

    if (res.status === 200) {
      revalidatePath(`/personal/alunos/${athleteId}`);
      return { success: true as const, data: res.data };
    }

    const errorMsg = getActionError(
      res.data,
      "Erro ao atualizar rascunho de prescrição.",
    );

    return { success: false as const, error: errorMsg };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function sendPrescriptionAction({
  id,
  athleteId,
}: {
  id: string;
  athleteId: string;
}) {
  try {
    const res = await sendWorkoutPrescription(id, { cache: "no-store" });

    if (res.status === 200) {
      revalidatePath(`/personal/alunos/${athleteId}`);
      return { success: true as const, data: res.data };
    }

    const errorMsg = getActionError(
      res.data,
      "Erro ao enviar prescrição ao aluno.",
    );

    return { success: false as const, error: errorMsg };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function cancelPrescriptionAction({
  id,
  athleteId,
}: {
  id: string;
  athleteId: string;
}) {
  try {
    const res = await cancelWorkoutPrescription(id, { cache: "no-store" });

    if (res.status === 200) {
      revalidatePath(`/personal/alunos/${athleteId}`);
      return { success: true as const, data: res.data };
    }

    const errorMsg = getActionError(res.data, "Erro ao cancelar prescrição.");

    return { success: false as const, error: errorMsg };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function generateCoachPrescriptionWithAiAction(body: {
  athleteId: string;
  prompt: string;
  fileUrl?: string;
  mediaType?: string;
  filename?: string;
}) {
  try {
    const res = await generateCoachPrescriptionDraftWithAi(body, {
      cache: "no-store",
    });

    if (res.status === 200) {
      return { success: true as const, data: res.data };
    }

    const errorMsg = getActionError(
      res.data,
      "Erro ao gerar rascunho de prescrição com IA.",
    );

    return { success: false as const, error: errorMsg };
  } catch (error) {
    console.error("generateCoachPrescriptionWithAiAction error:", error);
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

// ==========================================
// AÇÕES DE MODELOS PRÉ-DEFINIDOS (TEMPLATES)
// ==========================================

export async function listTemplatesAction() {
  try {
    const res = await listCoachWorkoutPlanTemplates({ cache: "no-store" });
    if (res.status === 200) {
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao listar modelos de treino.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function getTemplateDetailsAction(id: string) {
  try {
    const res = await getCoachWorkoutPlanTemplate(id, { cache: "no-store" });
    if (res.status === 200) {
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao carregar detalhes do modelo.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function createTemplateAction(body: CreateCoachWorkoutPlanTemplateBody) {
  try {
    const res = await createCoachWorkoutPlanTemplate(body, { cache: "no-store" });
    if (res.status === 201) {
      revalidatePath("/personal/modelos");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao criar modelo de treino.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function updateTemplateAction(
  id: string,
  body: UpdateCoachWorkoutPlanTemplateBody,
) {
  try {
    const res = await updateCoachWorkoutPlanTemplate(id, body, { cache: "no-store" });
    if (res.status === 200) {
      revalidatePath("/personal/modelos");
      revalidatePath(`/personal/modelos/${id}`);
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao atualizar modelo de treino.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    const res = await deleteCoachWorkoutPlanTemplate(id, { cache: "no-store" });
    if (res.status === 200) {
      revalidatePath("/personal/modelos");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao excluir modelo de treino.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function allocateTemplateAction(
  id: string,
  body: AllocateCoachWorkoutPlanTemplateBody,
) {
  try {
    const res = await allocateCoachWorkoutPlanTemplate(id, body, { cache: "no-store" });
    if (res.status === 200) {
      revalidatePath("/personal/modelos");
      revalidatePath(`/personal/alunos/${body.athleteId}`);
      revalidatePath("/personal");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao alocar modelo para o aluno.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function createTemplateFromPlanAction(
  planId: string,
  body: CreateCoachWorkoutPlanTemplateFromPlanBody,
) {
  try {
    const res = await createCoachWorkoutPlanTemplateFromPlan(planId, body, {
      cache: "no-store",
    });
    if (res.status === 201) {
      revalidatePath("/personal/modelos");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao salvar plano como modelo.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

// ==========================================
// AÇÕES DE EXERCÍCIOS PERSONALIZADOS
// ==========================================

export async function listCustomExercisesAction() {
  try {
    const res = await listExercises({ onlyCustom: "true" }, { cache: "no-store" });
    if (res.status === 200) {
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao listar exercícios personalizados.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function createCustomExerciseAction(body: CreateExerciseBody) {
  try {
    const res = await createExercise(body, { cache: "no-store" });
    if (res.status === 201) {
      revalidatePath("/personal/exercicios");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao cadastrar exercício personalizado.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function updateCustomExerciseAction(
  id: string,
  body: UpdateCustomExerciseBody,
) {
  try {
    const res = await updateCustomExercise(id, body, { cache: "no-store" });
    if (res.status === 200) {
      revalidatePath("/personal/exercicios");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao atualizar exercício personalizado.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

export async function deleteCustomExerciseAction(id: string) {
  try {
    const res = await deleteCustomExercise(id, { cache: "no-store" });
    if (res.status === 200) {
      revalidatePath("/personal/exercicios");
      return { success: true as const, data: res.data };
    }
    const errorMsg = getActionError(res.data, "Erro ao excluir exercício personalizado.");
    return { success: false as const, error: errorMsg };
  } catch {
    return { success: false as const, error: "Falha na comunicação com o servidor." };
  }
}

