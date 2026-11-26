import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCoachBillingOverview,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { PersonalHeader } from "../_components/personal-header";
import { SubscriptionManager } from "./_components/subscription-manager";

export const dynamic = "force-dynamic";

export default async function PersonalSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  await requireAccountSetup();

  const [commercialRes, billingRes, resolvedParams] = await Promise.all([
    getCommercialContext({ cache: "no-store" }),
    getCoachBillingOverview({ cache: "no-store" }),
    searchParams,
  ]);

  if (commercialRes.status === 401 || billingRes.status === 401) {
    redirect("/auth");
  }
  if (commercialRes.status !== 200 || !commercialRes.data) {
    throw new Error("Não foi possível carregar os dados da conta.");
  }
  if (commercialRes.data.accountType !== "COACH") {
    redirect("/profile");
  }
  if (billingRes.status !== 200 || !billingRes.data) {
    throw new Error("Não foi possível carregar os dados de assinatura.");
  }

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8">
      <main className="trainvy-page mx-auto w-full px-5 py-4 flex flex-col gap-5">
        <PersonalHeader
          title="Assinatura Profissional"
          description="Gerencie seu plano, pagamentos via Asaas, upgrades, downgrades e histórico financeiro."
          activeTab="subscription"
        />
        <SubscriptionManager
          initial={billingRes.data}
          checkoutReturned={resolvedParams.checkout === "success"}
        />
      </main>
      <BottomNav isCoach={true} activePage="athletes" />
    </div>
  );
}
