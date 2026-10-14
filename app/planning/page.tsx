import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import {
  getPlanningOverview,
  getUserTrainData,
  listAthletePrescriptions,
} from "@/app/_lib/api/fetch-generated";
import { BottomNav } from "@/app/_components/bottom-nav";
import { PlanningCreateMenu } from "./_components/planning-create-menu";
import { PlanningHub } from "./_components/planning-hub";
import {
  ReceivedPrescriptionsCard,
  type AthletePrescriptionItem,
} from "./_components/received-prescriptions-card";
import { Logo } from "@/app/_components/logo";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const [overviewResponse, trainData, prescriptionsResponse] =
    await Promise.all([
      getPlanningOverview().catch((err) => {
        console.error("Failed to fetch planning overview:", err);
        return null;
      }),
      getUserTrainData(),
      listAthletePrescriptions().catch(() => null),
    ]);

  const needsOnboarding =
    (trainData.status === 200 && !trainData.data) || trainData.status === 404;
  if (needsOnboarding) redirect("/onboarding");

  // Tratamento amigável para erro de visão geral ou INCONSISTENT_PLANNING_STATE
  if (
    !overviewResponse ||
    overviewResponse.status !== 200 ||
    !overviewResponse.data
  ) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <div className="flex h-14 items-center justify-between border-b border-border/40 px-5">
          <Logo size="md" asLink />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Não foi possível carregar seu planejamento.
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Ocorreu uma instabilidade ao recuperar suas periodizações e planos.
            Tente novamente em instantes.
          </p>
          <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
            <Link
              href="/planning"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-heading text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <RotateCcw className="size-3.5" />
              <span>Tentar novamente</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 font-heading text-xs font-medium text-muted-foreground transition hover:bg-accent"
            >
              <span>Voltar ao início</span>
            </Link>
          </div>
        </div>

        <BottomNav activePage="planning" />
      </div>
    );
  }

  const { activeContext, plans, periodizations } = overviewResponse.data;

  const athletePrescriptions: AthletePrescriptionItem[] =
    prescriptionsResponse?.status === 200 && Array.isArray(prescriptionsResponse.data)
      ? (prescriptionsResponse.data as unknown as AthletePrescriptionItem[])
      : [];

  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Header Mobile-First */}
      <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Logo size="md" asLink />
          <PlanningCreateMenu />
        </div>

        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Rotinas de Treino
          </h1>
          <p className="font-heading text-xs text-muted-foreground">
            Gerencie seus planos, divisões e ciclos de treino
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-5">
        <ReceivedPrescriptionsCard prescriptions={athletePrescriptions} />

        <PlanningHub
          activeContext={activeContext}
          plans={plans}
          periodizations={periodizations}
        />
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
