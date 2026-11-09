"use server";
import {
  reviewProfessionalRegistration,
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
