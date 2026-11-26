import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import dayjs from "dayjs";
import { CircleCheck, CirclePercent, Hourglass } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import {
  getCommercialContext,
  getStats,
  getUserMetricsHistory,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import { BottomNav } from "@/app/_components/bottom-nav";
import { Logo } from "@/app/_components/logo";
import { NotificationHub } from "@/app/_components/notification-hub";
import { WeeklySummary } from "./_components/weekly-summary";
import { EvolutionExplorer } from "./_components/evolution-explorer";
import { BodyMetricsEvolution } from "./_components/body-metrics-evolution";
import { StreakBanner } from "./_components/streak-banner";
import { StatsHeatmap } from "./_components/stats-heatmap";
import { StatCard } from "./_components/stat-card";

export const dynamic = "force-dynamic";
const formatTotalTime = (seconds: number) =>
  `${Math.floor(seconds / 3600)}h${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
function BlockSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      aria-busy="true"
      className="h-32 animate-pulse rounded-2xl bg-muted"
    />
  );
}
function Unavailable({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-border p-4 text-sm text-muted-foreground"
    >
      {label} indisponíveis no momento. Recarregue a página para tentar
      novamente.
    </div>
  );
}
async function MetricsSection() {
  const responses = await Promise.allSettled([
    getUserTrainData({ cache: "no-store" }),
    getUserMetricsHistory(),
  ]);
  const trainData =
    responses[0].status === "fulfilled" ? responses[0].value : null;
  const metricsHistoryResponse =
    responses[1].status === "fulfilled" ? responses[1].value : null;
  if (
    trainData?.status === 404 ||
    (trainData?.status === 200 && !trainData.data)
  ) {
    const commercial = await getCommercialContext({ cache: "no-store" }).catch(
      () => null,
    );
    if (commercial?.status !== 200 || commercial.data.accountType !== "COACH")
      redirect("/onboarding");
  }
  if (!trainData || trainData.status !== 200)
    return <Unavailable label="Medidas" />;
  const userTrainData = trainData.data;
  const initialHistory =
    metricsHistoryResponse?.status === 200 &&
    Array.isArray(metricsHistoryResponse.data)
      ? metricsHistoryResponse.data
      : undefined;
  return (
    <BodyMetricsEvolution
      initialBirthDate={userTrainData?.birthDate}
      initialWeightInGrams={userTrainData?.weightInGrams}
      initialHeightInCm={userTrainData?.heightInCentimeters}
      initialAge={userTrainData?.age}
      initialBodyFat={userTrainData?.bodyFatPercentage}
      initialWeightDiffInGrams={userTrainData?.weightDiffInGrams}
      initialBodyFatDiff={userTrainData?.bodyFatDiff}
      initialHistory={initialHistory}
    />
  );
}
async function ConsistencySection() {
  const today = dayjs();
  const from = today
    .subtract(2, "month")
    .startOf("month")
    .subtract(7, "day")
    .format("YYYY-MM-DD");
  const to = today.endOf("month").add(7, "day").format("YYYY-MM-DD");
  const response = await getStats({
    from,
    to,
    timezoneOffset: today.utcOffset(),
  }).catch(() => null);
  if (response?.status !== 200)
    return <Unavailable label="Dados de consistência" />;
  const {
    workoutStreak,
    consistencyByDay,
    completedWorkoutsCount,
    conclusionRate,
    totalTimeInSeconds,
  } = response.data;
  return (
    <section aria-labelledby="consistency-title" className="mt-8">
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">Visão complementar</p>
        <h2
          id="consistency-title"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Consistência
        </h2>
      </div>

      <StreakBanner workoutStreak={workoutStreak} />

      <div className="mt-3 flex flex-col gap-3">
        <StatsHeatmap consistencyByDay={consistencyByDay} today={today} />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={CircleCheck}
            value={String(completedWorkoutsCount)}
            label="Treinos Feitos"
          />
          <StatCard
            icon={CirclePercent}
            value={`${Math.round(conclusionRate * 100)}%`}
            label="Taxa de conclusão"
          />
        </div>

        <StatCard
          icon={Hourglass}
          value={formatTotalTime(totalTimeInSeconds)}
          label="Tempo Total"
        />
      </div>
    </section>
  );
}
async function Navigation() {
  const commercial = await getCommercialContext({ cache: "no-store" }).catch(
    () => null,
  );
  return (
    <BottomNav
      isCoach={
        commercial?.status === 200 && commercial.data.accountType === "COACH"
      }
      activePage="stats"
    />
  );
}
export default async function StatsPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");
  return (
    <div className="min-h-svh bg-background pb-28">
      <header className="trainvy-page border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <Logo size="md" asLink />
          <NotificationHub variant="header" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-bold tracking-tight">
          Evolução
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Sua semana em foco. Seu histórico sempre por perto.
        </p>
      </header>
      <main className="trainvy-page flex flex-col gap-6 p-5">
        <WeeklySummary />
        <EvolutionExplorer />
        <Suspense fallback={<BlockSkeleton label="Carregando medidas" />}>
          <MetricsSection />
        </Suspense>
        <Suspense fallback={<BlockSkeleton label="Carregando consistência" />}>
          <ConsistencySection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Navigation />
      </Suspense>
    </div>
  );
}
