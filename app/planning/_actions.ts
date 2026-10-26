"use server";

import { revalidatePath } from "next/cache";
import {
  acceptWorkoutPrescription,
  activatePeriodization,
  activateWorkoutPlan,
  addWorkoutPlanToPeriodization,
  advancePeriodization,
  completePeriodization,
  createPeriodization,
  createWorkoutPlan,
  createWorkoutPlanInPeriodization,
  deactivatePeriodization,
  deactivateWorkoutPlan,
  declineWorkoutPrescription,
  deletePeriodization,
  deleteWorkoutPlan,
  duplicateWorkoutPlan,
  generateWorkoutPlanDraftWithAi,
  removeWorkoutPlanFromPeriodization,
  reorderPeriodizationPlans,
  updatePeriodization,
  updatePeriodizationPlan,
  type AddWorkoutPlanToPeriodization201,
  type AddWorkoutPlanToPeriodizationBody,
  type ActivatePeriodization200,
  type ActivateWorkoutPlan200,
  type AdvancePeriodization200,
  type CompletePeriodization200,
  type CreatePeriodization201,
  type CreatePeriodizationBody,
  type CreateWorkoutPlan201,
  type CreateWorkoutPlanBody,
  type CreateWorkoutPlanInPeriodization201,
  type CreateWorkoutPlanInPeriodizationBody,
  type GenerateWorkoutPlanDraftWithAi200,
  type DeletePeriodization200,
  type DeleteWorkoutPlan200,
  type DeactivatePeriodization200,
  type DeactivateWorkoutPlan200,
  type DuplicateWorkoutPlan201,
  type RemoveWorkoutPlanFromPeriodization200,
  type ReorderPeriodizationPlans200Item,
  type ReorderPeriodizationPlansBody,
  type UpdatePeriodization200,
  type UpdatePeriodizationBody,
  type UpdatePeriodizationPlan200,
  type UpdatePeriodizationPlanBody,
} from "@/app/_lib/api/fetch-generated";
import { getPlanningErrorMessage } from "./_lib/planning-errors";

export type PlanningActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

type ApiError = { error?: string; code?: string };

function invalidInput(message: string): PlanningActionResult<never> {
  return { success: false, error: message, code: "INVALID_INPUT" };
}

function apiError(data: unknown): PlanningActionResult<never> {
  const code = (data as ApiError | undefined)?.code;
  return {
    success: false,
    error: getPlanningErrorMessage(code),
    ...(code ? { code } : {}),
  };
}

function connectionError(error: unknown): PlanningActionResult<never> {
  console.error("Planning mutation failed:", error);
  return {
    success: false,
    error: "Não foi possível conectar ao servidor. Tente novamente.",
    code: "CONNECTION_ERROR",
  };
}

function revalidatePlanning(detailPath?: string) {
  revalidatePath("/planning");
  revalidatePath("/");
  if (detailPath) revalidatePath(detailPath);
}

function invalidDateRange(
  start?: string | null,
  end?: string | null,
): PlanningActionResult<never> | null {
  if (start && end && end < start) {
    return invalidInput("A data final não pode ser anterior à data inicial.");
  }
  return null;
}

function validId(id: string): string | null {
  if (typeof id !== "string") return null;
  const normalized = id.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function activateWorkoutPlanAction(
  id: string,
): Promise<PlanningActionResult<ActivateWorkoutPlan200>> {
  const planId = validId(id);
  if (!planId) return invalidInput("Plano inválido.");

  try {
    const response = await activateWorkoutPlan(planId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/workout-plans/${planId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function deactivateWorkoutPlanAction(
  id: string,
): Promise<PlanningActionResult<DeactivateWorkoutPlan200>> {
  const planId = validId(id);
  if (!planId) return invalidInput("Plano inválido.");

  try {
    const response = await deactivateWorkoutPlan(planId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/workout-plans/${planId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function duplicateWorkoutPlanAction(
  id: string,
  name: string,
): Promise<PlanningActionResult<DuplicateWorkoutPlan201>> {
  const planId = validId(id);
  const copyName = typeof name === "string" ? name.trim() : "";
  if (!planId) return invalidInput("Plano inválido.");
  if (!copyName) return invalidInput("Informe o nome da cópia.");

  try {
    const response = await duplicateWorkoutPlan(planId, { name: copyName });
    if (response.status !== 201) return apiError(response.data);

    revalidatePlanning(`/workout-plans/${planId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function deleteWorkoutPlanAction(
  id: string,
): Promise<PlanningActionResult<DeleteWorkoutPlan200>> {
  const planId = validId(id);
  if (!planId) return invalidInput("Plano inválido.");

  try {
    const response = await deleteWorkoutPlan(planId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/workout-plans/${planId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function activatePeriodizationAction(
  id: string,
): Promise<PlanningActionResult<ActivatePeriodization200>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");

  try {
    const response = await activatePeriodization(periodizationId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function deactivatePeriodizationAction(
  id: string,
): Promise<PlanningActionResult<DeactivatePeriodization200>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");

  try {
    const response = await deactivatePeriodization(periodizationId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function advancePeriodizationAction(
  id: string,
): Promise<PlanningActionResult<AdvancePeriodization200>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");

  try {
    const response = await advancePeriodization(periodizationId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function completePeriodizationAction(
  id: string,
): Promise<PlanningActionResult<CompletePeriodization200>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");

  try {
    const response = await completePeriodization(periodizationId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function createPeriodizationAction(
  body: CreatePeriodizationBody,
): Promise<PlanningActionResult<CreatePeriodization201>> {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return invalidInput("Informe o nome da periodização.");

  try {
    const response = await createPeriodization({
      name,
      goal: body.goal?.trim() || null,
      notes: body.notes?.trim() || null,
    });
    if (response.status !== 201) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${response.data.id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function updatePeriodizationAction(
  id: string,
  body: UpdatePeriodizationBody,
): Promise<PlanningActionResult<UpdatePeriodization200>> {
  const periodizationId = validId(id);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!periodizationId) return invalidInput("Periodização inválida.");
  if (!name) return invalidInput("Informe o nome da periodização.");

  try {
    const response = await updatePeriodization(periodizationId, {
      name,
      goal: body.goal?.trim() || null,
      notes: body.notes?.trim() || null,
    });
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function deletePeriodizationAction(
  id: string,
): Promise<PlanningActionResult<DeletePeriodization200>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");

  try {
    const response = await deletePeriodization(periodizationId);
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning();
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function addWorkoutPlanToPeriodizationAction(
  id: string,
  body: AddWorkoutPlanToPeriodizationBody,
): Promise<PlanningActionResult<AddWorkoutPlanToPeriodization201>> {
  const periodizationId = validId(id);
  const workoutPlanId = validId(body.workoutPlanId);
  if (!periodizationId || !workoutPlanId) {
    return invalidInput("Selecione um plano válido.");
  }
  const dateError = invalidDateRange(
    body.plannedStartDate,
    body.plannedEndDate,
  );
  if (dateError) return dateError;

  try {
    const response = await addWorkoutPlanToPeriodization(periodizationId, {
      workoutPlanId,
      plannedStartDate: body.plannedStartDate || null,
      plannedEndDate: body.plannedEndDate || null,
      notes: body.notes?.trim() || null,
    });
    if (response.status !== 201) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function createWorkoutPlanInPeriodizationAction(
  id: string,
  body: CreateWorkoutPlanInPeriodizationBody,
): Promise<PlanningActionResult<CreateWorkoutPlanInPeriodization201>> {
  const periodizationId = validId(id);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!periodizationId) return invalidInput("Periodização inválida.");
  if (!name) return invalidInput("Informe o nome do plano.");
  if (!Array.isArray(body.workoutDays) || body.workoutDays.length === 0) {
    return invalidInput("Configure ao menos um dia no plano.");
  }
  const dateError = invalidDateRange(
    body.plannedStartDate,
    body.plannedEndDate,
  );
  if (dateError) return dateError;

  try {
    const response = await createWorkoutPlanInPeriodization(periodizationId, {
      ...body,
      name,
      plannedStartDate: body.plannedStartDate || null,
      plannedEndDate: body.plannedEndDate || null,
      notes: body.notes?.trim() || null,
    });
    if (response.status !== 201) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function updatePeriodizationPlanAction(
  periodizationIdValue: string,
  periodizationPlanIdValue: string,
  body: UpdatePeriodizationPlanBody,
): Promise<PlanningActionResult<UpdatePeriodizationPlan200>> {
  const periodizationId = validId(periodizationIdValue);
  const periodizationPlanId = validId(periodizationPlanIdValue);
  if (!periodizationId || !periodizationPlanId) {
    return invalidInput("Etapa inválida.");
  }
  const dateError = invalidDateRange(
    body.plannedStartDate,
    body.plannedEndDate,
  );
  if (dateError) return dateError;

  try {
    const response = await updatePeriodizationPlan(
      periodizationId,
      periodizationPlanId,
      {
        plannedStartDate: body.plannedStartDate || null,
        plannedEndDate: body.plannedEndDate || null,
        notes: body.notes?.trim() || null,
      },
    );
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function removeWorkoutPlanFromPeriodizationAction(
  periodizationIdValue: string,
  periodizationPlanIdValue: string,
): Promise<PlanningActionResult<RemoveWorkoutPlanFromPeriodization200>> {
  const periodizationId = validId(periodizationIdValue);
  const periodizationPlanId = validId(periodizationPlanIdValue);
  if (!periodizationId || !periodizationPlanId) {
    return invalidInput("Etapa inválida.");
  }

  try {
    const response = await removeWorkoutPlanFromPeriodization(
      periodizationId,
      periodizationPlanId,
    );
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function reorderPeriodizationPlansAction(
  id: string,
  body: ReorderPeriodizationPlansBody,
): Promise<PlanningActionResult<ReorderPeriodizationPlans200Item[]>> {
  const periodizationId = validId(id);
  if (!periodizationId) return invalidInput("Periodização inválida.");
  const ids = Array.isArray(body.periodizationPlanIds)
    ? body.periodizationPlanIds.map((item) => validId(item)).filter(Boolean)
    : [];
  if (ids.length === 0 || ids.length !== body.periodizationPlanIds.length) {
    return invalidInput("A ordem das etapas é inválida.");
  }
  if (new Set(ids).size !== ids.length) {
    return invalidInput("A ordem contém etapas duplicadas.");
  }

  try {
    const response = await reorderPeriodizationPlans(periodizationId, {
      periodizationPlanIds: ids as string[],
    });
    if (response.status !== 200) return apiError(response.data);

    revalidatePlanning(`/planning/periodizations/${periodizationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function createStandaloneWorkoutPlanAction(
  body: CreateWorkoutPlanBody,
): Promise<PlanningActionResult<CreateWorkoutPlan201>> {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return invalidInput("Informe o nome do plano.");
  if (!Array.isArray(body.workoutDays) || body.workoutDays.length === 0) {
    return invalidInput("Configure ao menos um dia no plano.");
  }

  try {
    const response = await createWorkoutPlan({
      name,
      workoutDays: body.workoutDays,
      activate: body.activate === true,
    });
    if (response.status !== 201) return apiError(response.data);

    revalidatePlanning(`/workout-plans/${response.data.id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return connectionError(error);
  }
}

export async function acceptPrescriptionAction(
  prescriptionId: string,
): Promise<PlanningActionResult<{ workoutPlanId: string; workoutPlanName: string }>> {
  const id = validId(prescriptionId);
  if (!id) return invalidInput("ID da prescrição inválido.");

  try {
    const res = await acceptWorkoutPrescription(id, { cache: "no-store" });
    if (res.status !== 200) {
      const err = (res.data as { error?: string })?.error ?? "Erro ao aceitar prescrição.";
      return { success: false, error: err };
    }

    revalidatePlanning(`/workout-plans/${res.data.workoutPlanId}`);
    return {
      success: true,
      data: {
        workoutPlanId: res.data.workoutPlanId,
        workoutPlanName: res.data.workoutPlanName,
      },
    };
  } catch (error) {
    return connectionError(error);
  }
}

export async function declinePrescriptionAction(
  prescriptionId: string,
): Promise<PlanningActionResult<{ success: boolean }>> {
  const id = validId(prescriptionId);
  if (!id) return invalidInput("ID da prescrição inválido.");

  try {
    const res = await declineWorkoutPrescription(id, { cache: "no-store" });
    if (res.status !== 200) {
      const err = (res.data as { error?: string })?.error ?? "Erro ao recusar prescrição.";
      return { success: false, error: err };
    }

    revalidatePlanning();
    return { success: true, data: { success: true } };
  } catch (error) {
    return connectionError(error);
  }
}

export async function generateWorkoutPlanWithAiAction(body: {
  prompt: string;
  fileUrl?: string;
  mediaType?: string;
  filename?: string;
}): Promise<PlanningActionResult<GenerateWorkoutPlanDraftWithAi200>> {
  try {
    const res = await generateWorkoutPlanDraftWithAi(body, {
      cache: "no-store",
    });

    if (res.status === 200) {
      return { success: true, data: res.data };
    }

    const err =
      (res.data as { error?: string })?.error ??
      "Erro ao gerar plano de treino com IA.";
    return { success: false, error: err };
  } catch (error) {
    return connectionError(error);
  }
}

