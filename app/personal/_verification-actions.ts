"use server";
import {
  getCommercialContext,
  submitProfessionalRegistration,
  type SubmitProfessionalRegistrationBody,
} from "@/app/_lib/api/fetch-generated";
export async function submitProfessionalRegistrationAction(
  body: SubmitProfessionalRegistrationBody,
) {
  const result = await submitProfessionalRegistration(body, {
    cache: "no-store",
  });
  return { status: result.status, data: result.data };
}
export async function getProfessionalChatModeAction() {
  const result = await getCommercialContext({ cache: "no-store" });
  if (result.status !== 200) return false;
  return result.data.professionalAccessGranted;
}
