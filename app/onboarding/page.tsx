import { redirect } from "next/navigation";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import {
  getCommercialContext,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import { readReturnToCookie } from "@/app/_lib/auth-return-to";
import { OnboardingForm } from "./_components/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");
  await requireAccountSetup();

  // Personal Trainers (COACH) não fazem onboarding de aluno iniciante
  const commercialRes = await getCommercialContext({ cache: "no-store" }).catch(
    () => null,
  );
  if (
    commercialRes?.status === 200 &&
    commercialRes.data.accountType === "COACH"
  ) {
    redirect("/personal");
  }

  const returnTo = await readReturnToCookie();

  const trainData = await getUserTrainData({ cache: "no-store" });

  if (trainData.status === 200 && trainData.data) {
    if (returnTo) {
      redirect("/auth/return");
    }
    redirect("/");
  }

  if (trainData.status === 401) redirect("/auth");
  if (trainData.status !== 200 && trainData.status !== 404) {
    throw new Error("Não foi possível carregar seus dados. Tente novamente.");
  }

  return <OnboardingForm />;
}
