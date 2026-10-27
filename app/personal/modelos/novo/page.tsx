import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { CoachTemplateBuilder } from "../_components/coach-template-builder";

export const metadata = {
  title: "Novo Modelo de Treino | Trainvy Pro",
  description: "Crie um novo modelo pré-definido de treino reutilizável.",
};

export default async function NewTemplatePage() {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    redirect("/profile");
  }

  const { accountType, entitlements } = commercialRes.data;

  if (accountType !== "COACH") {
    redirect("/profile");
  }

  const hasManageAthletes = entitlements.some(
    (e) => e.key === "MANAGE_ATHLETES",
  );

  if (!hasManageAthletes) {
    redirect("/personal");
  }

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-28 lg:pb-8">
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <CoachTemplateBuilder />
      </main>
      <BottomNav isCoach={true} activePage="templates" />
    </div>
  );
}
