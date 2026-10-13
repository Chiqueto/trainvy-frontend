import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import {
  getStats,
  getUserMetricsHistory,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import dayjs from "dayjs";
import { CircleCheck, CirclePercent, Hourglass } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { StreakBanner } from "./_components/streak-banner";
import { StatsHeatmap } from "./_components/stats-heatmap";
import { StatCard } from "./_components/stat-card";
import { EvolutionDashboard } from "./_components/evolution-dashboard";
import { BodyMetricsEvolution } from "./_components/body-metrics-evolution";
import { Logo } from "@/app/_components/logo";

function formatTotalTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h${minutes.toString().padStart(2, "0")}m`;
}

export default async function StatsPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const today = dayjs();
  const from = today
    .subtract(2, "month")
    .startOf("month")
    .subtract(7, "day")
    .format("YYYY-MM-DD");
  const to = today.endOf("month").add(7, "day").format("YYYY-MM-DD");

  const [statsResponse, trainData, metricsHistoryResponse] = await Promise.all([
    getStats({ from, to, timezoneOffset: today.utcOffset() }),
    getUserTrainData(),
    getUserMetricsHistory().catch(() => null),
  ]);

  const needsOnboarding =
    (trainData.status === 200 && !trainData.data) || trainData.status === 404;
  if (needsOnboarding) redirect("/onboarding");

  const userTrainData = trainData.status === 200 ? trainData.data : null;

  if (statsResponse.status !== 200) {
    throw new Error("Failed to fetch stats");
  }

  const initialHistory =
    metricsHistoryResponse &&
    metricsHistoryResponse.status === 200 &&
    Array.isArray(metricsHistoryResponse.data)
      ? metricsHistoryResponse.data
      : undefined;

  const {
    workoutStreak,
    consistencyByDay,
    completedWorkoutsCount,
    conclusionRate,
    totalTimeInSeconds,
  } = statsResponse.data;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Header Mobile-First alinhado à esquerda como nas demais abas */}
      <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Logo size="md" asLink />
        </div>

        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Evolução
          </h1>
          <p className="font-heading text-xs text-muted-foreground">
            Acompanhe seu treino ao longo do tempo
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-5">
        <EvolutionDashboard />

        <BodyMetricsEvolution
          initialWeightInGrams={userTrainData?.weightInGrams}
          initialHeightInCm={userTrainData?.heightInCentimeters}
          initialAge={userTrainData?.age}
          initialBodyFat={userTrainData?.bodyFatPercentage}
          initialWeightDiffInGrams={userTrainData?.weightDiffInGrams}
          initialBodyFatDiff={userTrainData?.bodyFatDiff}
          initialHistory={initialHistory}
        />

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
      </main>

      <BottomNav activePage="stats" />
    </div>
  );
}
