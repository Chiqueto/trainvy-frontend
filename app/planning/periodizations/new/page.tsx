import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { PeriodizationForm } from "../../_components/periodization-form";

export default async function NewPeriodizationPage() {
  const [session, commercialRes] = await Promise.all([
    authClient.getSession({
      fetchOptions: { headers: await headers() },
    }),
    getCommercialContext({ cache: "no-store" }).catch(() => null),
  ]);
  if (!session.data?.user) redirect("/auth");

  const isCoach =
    commercialRes?.status === 200 && commercialRes.data.accountType === "COACH";
  const hasPeriodizations =
    isCoach ||
    (commercialRes?.status === 200 &&
      commercialRes.data.entitlements.some((e) => e.key === "PERIODIZATIONS"));

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
        {!hasPeriodizations ? (
          <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Crown className="size-5" />
              </span>
              <div>
                <h1 className="font-heading text-lg font-bold text-foreground">
                  Periodizações fazem parte do Atleta Pro
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize seus blocos de treino em ciclos progressivos com o
                  plano Atleta Pro (R$ 9,90/mês ou R$ 99,90/ano).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/assinatura"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm"
              >
                Assinar Atleta Pro
              </Link>
              <Link
                href="/planning"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 py-2 font-heading text-xs font-medium text-foreground"
              >
                Voltar ao planejamento
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                Nova periodização
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie o rascunho do ciclo. As etapas podem ser adicionadas
                depois.
              </p>
            </div>
            <PeriodizationForm />
          </>
        )}
      </main>
    </div>
  );
}
