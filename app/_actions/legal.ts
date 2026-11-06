"use server";
import { headers } from "next/headers";
import {
  acceptLegalDocument,
  approveAiWorkoutPlan,
  declareProfessionalCredentials,
  eraseMyAccount,
  exportMyData,
  getMyLegalDocuments,
  revokeHealthConsent,
  type AcceptLegalDocumentBody,
  type ApproveAiWorkoutPlanBody,
  type DeclareProfessionalCredentialsBody,
  type EraseMyAccountBody,
} from "@/app/_lib/api/fetch-generated";

function serializable<T extends { status: number; data: unknown }>(result: T) {
  return { status: result.status, data: result.data } as T extends unknown
    ? Pick<T, "status" | "data">
    : never;
}

async function evidenceOptions() {
  return {
    headers: { "user-agent": (await headers()).get("user-agent") ?? "" },
  };
}
export async function getMyLegalDocumentsAction() {
  return serializable(await getMyLegalDocuments({ cache: "no-store" }));
}
export async function acceptLegalDocumentAction(
  slug: string,
  body: AcceptLegalDocumentBody,
) {
  return serializable(
    await acceptLegalDocument(slug, body, await evidenceOptions()),
  );
}
export async function declareProfessionalCredentialsAction(
  body: DeclareProfessionalCredentialsBody,
) {
  return serializable(
    await declareProfessionalCredentials(body, await evidenceOptions()),
  );
}
export async function approveAiWorkoutPlanAction(
  id: string,
  body: ApproveAiWorkoutPlanBody,
) {
  return serializable(await approveAiWorkoutPlan(id, body));
}
export async function exportMyDataAction() {
  return serializable(await exportMyData({ cache: "no-store" }));
}
export async function revokeHealthConsentAction() {
  return serializable(await revokeHealthConsent());
}
export async function eraseMyAccountAction(body: EraseMyAccountBody) {
  return serializable(await eraseMyAccount(body));
}
