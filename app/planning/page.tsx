import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Box,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import {
  getCommercialContext,
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

  const [overviewResponse, trainData, prescriptionsResponse, commercialRes] =
    await Promise.all([
      getPlanningOverview().catch((err) => {
        console.error("Failed to fetch planning overview:", err);
        return null;
      }),
      getUserTrainData({ cache: "no-store" }),
      listAthletePrescriptions().catch(() => null),
      getCommercialContext({ cache: "no-store" }).catch(() => null),
    ]);

  const isCoach =
    commercialRes?.status === 200 && commercialRes.data.accountType === "COACH";

  const needsOnboarding =
    !isCoach &&
    ((trainData.status === 200 && !trainData.data) || trainData.status === 404);
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

        <BottomNav isCoach={isCoach} activePage="planning" />
      </div>
    );
  }

  const { activeContext, plans, periodizations } = overviewResponse.data;

  const athletePrescriptions: AthletePrescriptionItem[] =
    prescriptionsResponse?.status === 200 &&
    Array.isArray(prescriptionsResponse.data)
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
            {isCoach ? "Meu planejamento" : "Rotinas de Treino"}
          </h1>
          <p className="font-heading text-xs text-muted-foreground">
            {isCoach
              ? "Organize seus próprios planos, divisões e ciclos. Para prescrever aos alunos, acesse Alunos ou Modelos."
              : "Gerencie seus planos, divisões e ciclos de treino"}
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-5">
        <ReceivedPrescriptionsCard prescriptions={athletePrescriptions} />

        {/* Banner Criar com IA ou Ficha PDF */}
        <Link
          href="/planning/plans/new?ai=true"
          className="group relative flex items-center justify-between gap-4 p-4 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/50 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold text-foreground">
                  Organizar com IA ou importar ficha
                </span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                  Novo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gere sua divisão completa por voz ou anexando o PDF/foto da sua
                ficha antiga
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Banner Catálogo & Modelagem 3D */}
        <Link
          href="/lab/exercises-3d"
          className="group relative flex items-center justify-between gap-4 p-4 rounded-3xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent hover:border-orange-500/40 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Box className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold text-foreground">
                  Catálogo & Modelagem 3D dos Exercícios
                </span>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase">
                  3D Interativo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Veja o agachamento e supino em 360°, cadência controlada e
                grupos musculares destacados
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-orange-500 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>

        <PlanningHub
          activeContext={activeContext}
          plans={plans}
          periodizations={periodizations}
        />
      </main>

      <BottomNav isCoach={isCoach} activePage="planning" />
    </div>
  );
}
