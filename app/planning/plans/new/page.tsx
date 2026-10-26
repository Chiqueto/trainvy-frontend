import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import { WorkoutPlanBuilder } from "../../_components/workout-plan-builder";

interface NewStandalonePlanPageProps {
  searchParams?: Promise<{ ai?: string }>;
}

export default async function NewStandalonePlanPage({
  searchParams,
}: NewStandalonePlanPageProps) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialOpenAi = resolvedParams?.ai === "true";

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href="/planning"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao planejamento
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">Novo plano</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a semana e escolha explicitamente se deseja ativar o
            plano.
          </p>
        </div>
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-muted-foreground">Carregando construtor...</div>}>
          <WorkoutPlanBuilder mode="standalone" initialOpenAi={initialOpenAi} />
        </Suspense>
      </main>
    </div>
  );
}
