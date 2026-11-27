import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Crown } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import {
  getCommercialContext,
  getPlanningOverview,
} from "@/app/_lib/api/fetch-generated";
import { WorkoutPlanBuilder } from "../../_components/workout-plan-builder";

interface NewStandalonePlanPageProps {
  searchParams?: Promise<{ ai?: string }>;
}

export default async function NewStandalonePlanPage({
  searchParams,
}: NewStandalonePlanPageProps) {
  const [session, commercialRes, overviewRes, resolvedParams] =
    await Promise.all([
      authClient.getSession({
        fetchOptions: { headers: await headers() },
      }),
      getCommercialContext({ cache: "no-store" }).catch(() => null),
      getPlanningOverview().catch(() => null),
      searchParams ?? Promise.resolve(undefined),
    ]);
  if (!session.data?.user) redirect("/auth");

  const initialOpenAi = resolvedParams?.ai === "true";

  const isCoach =
    commercialRes?.status === 200 && commercialRes.data.accountType === "COACH";
  const entitlements =
    commercialRes?.status === 200 ? commercialRes.data.entitlements : [];
  const planLimit = isCoach
    ? null
    : (entitlements.find((e) => e.key === "WORKOUT_PLAN_LIMIT")?.limitValue ??
      null);
  const maxTrainingDays = isCoach
    ? null
    : (entitlements.find((e) => e.key === "WORKOUT_DAY_LIMIT")?.limitValue ??
      null);

  const selfPlansCount =
    overviewRes?.status === 200 && overviewRes.data
      ? overviewRes.data.plans.filter((p) => !p.isPrescribedByCoach).length
      : 0;
  const reachedPlanLimit =
    !isCoach && planLimit !== null && selfPlansCount >= planLimit;

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="trainvy-page sticky top-0 z-30 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href="/planning"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao planejamento
        </Link>
      </header>
      <main className="trainvy-page mx-auto flex w-full flex-col gap-5 p-5">
        {reachedPlanLimit ? (
          <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Crown className="size-5" />
              </span>
              <div>
                <h1 className="font-heading text-lg font-bold text-foreground">
                  Limite do plano Atleta Grátis atingido
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No plano gratuito você pode manter 1 plano próprio com até{" "}
                  {maxTrainingDays ?? 5} treinos. Planos prescritos por personal
                  não contam no limite.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/assinatura"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm"
              >
                Conhecer Atleta Pro (R$ 9,90/mês)
              </Link>
              <Link
                href="/planning"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 py-2 font-heading text-xs font-medium text-foreground"
              >
                Gerenciar planos existentes
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div>
              <h1 className="font-heading text-2xl font-bold">Novo plano</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure a semana e escolha explicitamente se deseja ativar o
                plano.
              </p>
            </div>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando construtor...
                </div>
              }
            >
              <WorkoutPlanBuilder
                mode="standalone"
                initialOpenAi={initialOpenAi}
                maxTrainingDays={maxTrainingDays}
              />
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}
