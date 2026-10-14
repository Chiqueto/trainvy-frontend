import { redirect } from "next/navigation";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import { getUserTrainData } from "@/app/_lib/api/fetch-generated";
import {
  clearReturnToCookie,
  getReturnToCookie,
} from "@/app/_lib/auth-return-to";
import { Chat } from "@/app/_components/chat";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");
  await requireAccountSetup();

  const returnTo = await getReturnToCookie(false);

  const trainData = await getUserTrainData();

  if (trainData.status === 200 && trainData.data) {
    if (returnTo) {
      await clearReturnToCookie();
      redirect(returnTo);
    }
    redirect("/");
  }

  return (
    <Chat embedded initialMessage="Quero começar a melhorar minha saúde!" />
  );
}
