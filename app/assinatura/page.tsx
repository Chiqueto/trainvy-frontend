import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { Logo } from "@/app/_components/logo";
import { NotificationHub } from "@/app/_components/notification-hub";
import {
  getCoachBillingOverview,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { SubscriptionManager } from "@/app/personal/assinatura/_components/subscription-manager";

export const dynamic = "force-dynamic";

export default async function AthleteSubscriptionPage({
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
  if (commercialRes.data.accountType === "COACH") {
    redirect("/personal/assinatura");
  }
  if (billingRes.status !== 200 || !billingRes.data) {
    throw new Error("Não foi possível carregar os dados de assinatura.");
  }

  return (
    <div className="flex min-h-svh min-w-0 flex-col bg-background pb-24">
      <header className="trainvy-page sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/profile"
            aria-label="Voltar para perfil"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Logo size="sm" asLink />
        </div>
        <NotificationHub variant="header" />
      </header>

      <main className="trainvy-page mx-auto w-full px-5 py-5 flex flex-col gap-5">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Minha Assinatura
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare o Atleta Grátis com o Atleta Pro e gerencie seu plano quando
            quiser.
          </p>
        </div>

        <SubscriptionManager
          initial={billingRes.data}
          checkoutReturned={resolvedParams.checkout === "success"}
          audience="ATHLETE"
        />
      </main>

      <BottomNav isCoach={false} activePage="profile" />
    </div>
  );
}
