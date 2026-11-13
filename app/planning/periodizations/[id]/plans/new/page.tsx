import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import { getPeriodization } from "@/app/_lib/api/fetch-generated";
import { WorkoutPlanBuilder } from "../../../../_components/workout-plan-builder";

interface NewPeriodizationPlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewPeriodizationPlanPage({
  params,
}: NewPeriodizationPlanPageProps) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  const { id } = await params;
  const response = await getPeriodization(id);
  if (response.status !== 200 || response.data.status === "COMPLETED") {
    redirect(`/planning/periodizations/${id}`);
  }

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="trainvy-page sticky top-0 z-30 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href={`/planning/periodizations/${id}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar à periodização
        </Link>
      </header>
      <main className="trainvy-page mx-auto flex w-full flex-col gap-5 p-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Novo plano da periodização
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A nova etapa será adicionada a {response.data.name} e nascerá
            inativa.
          </p>
        </div>
        <WorkoutPlanBuilder mode="periodization" periodizationId={id} />
      </main>
    </div>
  );
}
