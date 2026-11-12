"use server";
import {
  completeCoachOnboarding,
  getCoachOnboarding,
} from "@/app/_lib/api/fetch-generated";

export async function loadToursAction() {
  const result = await getCoachOnboarding({ cache: "no-store" });
  return result.status === 200 ? result.data : null;
}
export async function completeTourAction(tour: "workspace" | "builder") {
  try {
    const result = await completeCoachOnboarding({ tour });
    return result.status === 200;
  } catch {
    return false;
  }
}
