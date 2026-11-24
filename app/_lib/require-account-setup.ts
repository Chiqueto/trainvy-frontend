import { redirect } from "next/navigation";
import { getCommercialContext } from "./api/fetch-generated";

// Setup guard, not an entitlement/paywall guard. Existing accounts pass after migration.
export async function requireAccountSetup() {
  const result = await getCommercialContext({ cache: "no-store" });
  if (result.status === 401) redirect("/auth");
  if (result.status !== 200)
    throw new Error("Não foi possível verificar sua conta.");
  if (!result.data.accountSetupCompletedAt) redirect("/auth/complete");
  if (
    result.data.accountType === "COACH" &&
    !result.data.professionalAccessGranted
  ) {
    redirect("/personal/verification");
  }
}
