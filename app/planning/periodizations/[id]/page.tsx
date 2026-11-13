import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import {
  getPeriodization,
  getPlanningOverview,
} from "@/app/_lib/api/fetch-generated";
import { BottomNav } from "@/app/_components/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { PeriodizationActions } from "../../_components/periodization-actions";
import { PeriodizationManagement } from "../../_components/periodization-management";
import { PeriodizationStructureEditor } from "../../_components/periodization-structure-editor";
import { Logo } from "@/app/_components/logo";

interface PeriodizationDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PeriodizationDetailPage({
  params,
}: PeriodizationDetailPageProps) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const { id } = await params;
  const [response, overviewResponse] = await Promise.all([
    getPeriodization(id).catch((err) => {
      console.error("Failed to fetch periodization:", err);
      return null;
    }),
    getPlanningOverview().catch((err) => {
      console.error("Failed to fetch planning overview:", err);
      return null;
    }),
  ]);

  if (!response || response.status !== 200 || !response.data) {
    redirect("/planning");
  }

  const periodization = response.data;
  const availablePlans =
    overviewResponse?.status === 200 ? overviewResponse.data.plans : [];
  const sortedPlans = [...periodization.plans].sort(
    (a, b) => a.order - b.order,
  );
  const totalBlocks = sortedPlans.length;
  const completedBlocks = sortedPlans.filter(
    (p) => p.completedAt !== null,
  ).length;
  const currentBlockIndex = sortedPlans.findIndex(
    (plan) => plan.activatedAt !== null && plan.completedAt === null,
  );
  const currentBlock =
    currentBlockIndex >= 0 ? sortedPlans[currentBlockIndex] : undefined;
  const nextBlock =
    currentBlockIndex >= 0 ? sortedPlans[currentBlockIndex + 1] : undefined;

  let statusLabel = "RASCUNHO";
  let statusVariant: "default" | "secondary" | "outline" = "secondary";

  if (periodization.status === "ACTIVE") {
    statusLabel = "ATIVA";
    statusVariant = "default";
  } else if (periodization.status === "PAUSED") {
    statusLabel = "PAUSADA";
    statusVariant = "secondary";
  } else if (periodization.status === "COMPLETED") {
    statusLabel = "CONCLUÍDA";
    statusVariant = "outline";
  }

  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Top bar with back button */}
      <header className="trainvy-page sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href="/planning"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar ao Planejamento</span>
        </Link>
        <Logo size="sm" asLink />
      </header>

      <main className="trainvy-page flex flex-col gap-6 p-5">
        {/* Info do Ciclo */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
                {periodization.name}
              </h1>
              {periodization.goal && (
                <p className="text-xs text-muted-foreground">
                  {periodization.goal}
                </p>
              )}
            </div>
            <Badge
              variant={statusVariant}
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
            >
              {statusLabel}
            </Badge>
          </div>

          {periodization.notes && (
            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              {periodization.notes}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-heading font-semibold text-foreground">
                {completedBlocks} de {totalBlocks} concluídos
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Status do Ciclo</span>
              <span className="font-heading font-semibold text-foreground">
                {statusLabel}
              </span>
            </div>
          </div>
        </section>

        <PeriodizationManagement
          id={periodization.id}
          status={periodization.status}
          name={periodization.name}
          goal={periodization.goal}
          notes={periodization.notes}
          plans={availablePlans}
        />

        <PeriodizationActions
          id={periodization.id}
          status={periodization.status}
          totalBlocks={totalBlocks}
          currentBlockName={currentBlock?.workoutPlan.name}
          nextBlockName={nextBlock?.workoutPlan.name}
          isLastBlock={
            currentBlockIndex >= 0 && currentBlockIndex === totalBlocks - 1
          }
        />

        <PeriodizationStructureEditor
          key={sortedPlans
            .map((plan) => `${plan.id}:${plan.order}:${plan.updatedAt}`)
            .join("|")}
          periodizationId={periodization.id}
          status={periodization.status}
          initialPlans={sortedPlans}
        />
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
