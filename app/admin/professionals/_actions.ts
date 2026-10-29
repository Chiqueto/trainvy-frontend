"use server";
import {
  reviewProfessionalRegistration,
  updateProfessionalVerificationPolicy,
  type UpdateProfessionalVerificationPolicyBody,
  type ReviewProfessionalRegistrationBody,
} from "@/app/_lib/api/fetch-generated";
export async function reviewProfessionalRegistrationAction(
  userId: string,
  body: ReviewProfessionalRegistrationBody,
) {
  const result = await reviewProfessionalRegistration(userId, body, {
    cache: "no-store",
  });
  return { status: result.status, data: result.data };
}
export async function updateProfessionalVerificationPolicyAction(
  body: UpdateProfessionalVerificationPolicyBody,
) {
  const result = await updateProfessionalVerificationPolicy(body, {
    cache: "no-store",
  });
  return { status: result.status, data: result.data };
}
