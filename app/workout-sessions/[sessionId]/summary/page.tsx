import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Hash,
  Repeat,
  Trophy,
} from "lucide-react";

import {
  getHomeData,
  getUserTrainData,
  getWorkoutSession,
} from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";
import { gramsToKg } from "@/app/_lib/weight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SummaryFeedbackWidget } from "./_components/summary-feedback-widget";
import { ThematicCelebrationCard } from "./_components/thematic-celebration-card";

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  const { sessionId } = await params;
  const today = dayjs();

  const [sessionRes, homeDataRes, trainDataRes] = await Promise.all([
    getWorkoutSession(sessionId).catch(() => null),
    getHomeData(today.format("YYYY-MM-DD"), {
      timezoneOffset: today.utcOffset(),
    }).catch(() => null),
    getUserTrainData().catch(() => null),
  ]);

  if (!sessionRes || sessionRes.status !== 200) {
    redirect("/");
  }

  const workoutSession = sessionRes.data;
  const homeData = homeDataRes?.status === 200 ? homeDataRes.data : null;
  const userTheme =
    (trainDataRes?.status === 200 && trainDataRes.data?.gamificationTheme) ||
    homeData?.gamificationTheme ||
    "ALL";


  // Cálculos de métricas da sessão
  const startedAt = dayjs(workoutSession.startedAt);
  const completedAt = workoutSession.completedAt
    ? dayjs(workoutSession.completedAt)
    : dayjs();

  const durationInMinutes = Math.max(
    1,
    Math.round(completedAt.diff(startedAt, "minute")),
  );

  let totalReps = 0;
  let totalWorkingSets = 0;
  let totalSetsCompleted = 0;
  let totalVolumeGrams = 0;

  const exerciseBreakdowns = workoutSession.sessionExercises.map((exercise) => {
    let completedSetsCount = 0;
    let maxWeightGrams = 0;
    let exerciseReps = 0;

    for (const set of exercise.sets) {
      if (set.completedAt) {
        totalSetsCompleted++;
        completedSetsCount++;
        if (set.type === "WORKING") {
          totalWorkingSets++;
        }
        if (set.reps) {
          totalReps += set.reps;
          exerciseReps += set.reps;
        }
        if (set.weightInGrams) {
          if (set.weightInGrams > maxWeightGrams) {
            maxWeightGrams = set.weightInGrams;
          }
          if (set.reps) {
            const sideMultiplier = exercise.isUnilateral ? 2 : 1;
            totalVolumeGrams += set.weightInGrams * set.reps * sideMultiplier;
          }
        }
      }
    }

    return {
      id: exercise.id,
      name: exercise.exerciseNameSnapshot,
      order: exercise.order,
      isUnilateral: exercise.isUnilateral,
      completedSetsCount,
      exerciseReps,
      maxWeightKg: gramsToKg(maxWeightGrams),
    };
  });

  const totalVolumeKg = Math.round(totalVolumeGrams / 1000);
  const workoutTitle =
    workoutSession.workoutDayNameSnapshot ||
    (workoutSession.workoutDayId ? "Treino Prescrito" : "Treino Avulso");

  const nextWorkout = homeData?.todayWorkoutDay;
  const workoutStreak = homeData?.workoutStreak ?? 0;
  const rotationIndex = homeData?.rotationIndex;
  const totalWorkoutsInRotation = homeData?.totalWorkoutsInRotation;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar ao início</span>
        </Link>
        <span className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo do Treino
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-5">
        {/* Celebration Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/15 via-card to-card p-6 text-center shadow-lg">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 size-48 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-8 ring-primary/10">
              <Trophy className="size-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-primary">
              <CheckCircle2 className="size-3.5" />
              Treino Concluído com Sucesso!
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {workoutTitle}
            </h1>

            <p className="font-heading text-xs text-muted-foreground">
              Finalizado em {completedAt.format("DD/MM/YYYY [às] HH:mm")}
            </p>
          </div>
        </div>

        {/* Elogio Temático e Equivalência de Carga (Gamificação) */}
        <ThematicCelebrationCard
          totalVolumeKg={totalVolumeKg}
          initialTheme={userTheme}
          sessionId={sessionId}
        />

        {/* 4 High-Impact Metrics Grid */}

        <section
          aria-labelledby="metrics-title"
          className="grid grid-cols-2 gap-3"
        >
          <h2 id="metrics-title" className="sr-only">
            Métricas de Desempenho
          </h2>

          {/* Duração */}
          <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider">
                Duração
              </span>
              <Clock className="size-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {durationInMinutes} <span className="text-xs font-medium text-muted-foreground">min</span>
            </p>
            <span className="text-[11px] text-muted-foreground">Tempo decorrido</span>
          </div>

          {/* Volume Total */}
          <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider">
                Volume
              </span>
              <Dumbbell className="size-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {totalVolumeKg.toLocaleString("pt-BR")}{" "}
              <span className="text-xs font-medium text-muted-foreground">kg</span>
            </p>
            <span className="text-[11px] text-muted-foreground">Carga total levantada</span>
          </div>

          {/* Séries Feitas */}
          <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider">
                Séries
              </span>
              <Hash className="size-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {totalSetsCompleted}{" "}
              <span className="text-xs font-medium text-muted-foreground">séries</span>
            </p>
            <span className="text-[11px] text-muted-foreground">
              {totalWorkingSets} de trabalho válidas
            </span>
          </div>

          {/* Total Repetições */}
          <div className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider">
                Repetições
              </span>
              <Repeat className="size-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {totalReps}{" "}
              <span className="text-xs font-medium text-muted-foreground">reps</span>
            </p>
            <span className="text-[11px] text-muted-foreground">Acumuladas na sessão</span>
          </div>
        </section>

        {/* Card Sequencial: O que vem a seguir na rotação */}
        {nextWorkout && (
          <section className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Próximo na Rotação
                </Badge>
                {rotationIndex && totalWorkoutsInRotation && (
                  <span className="font-heading text-xs text-muted-foreground">
                    Treino {rotationIndex} de {totalWorkoutsInRotation}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-primary">
                Sequência ativa
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {nextWorkout.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Ontem você fez {workoutTitle}. O próximo passo da sua divisão é {nextWorkout.name}!
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>⏱️ ~{Math.round(nextWorkout.estimatedDurationInSeconds / 60)} min</span>
                <span>🏋️ {nextWorkout.exercisesCount} exercícios</span>
              </div>
              <Link
                href={`/workout-plans/${nextWorkout.workoutPlanId}/days/${nextWorkout.id}`}
                className="inline-flex items-center gap-1 font-heading text-xs font-semibold text-primary transition hover:underline"
              >
                <span>Ver treino</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Streak & Consistência */}
        <section className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-streak text-streak-foreground shadow-sm">
              <Flame className="size-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-semibold text-foreground">
                Sequência Mantida!
              </span>
              <span className="text-xs text-muted-foreground">
                {workoutStreak === 1
                  ? "1 dia de treino consecutivo"
                  : `${workoutStreak} dias consecutivos treinando`}
              </span>
            </div>
          </div>
          <CheckCircle2 className="size-5 text-emerald-500" />
        </section>

        {/* Resumo dos Exercícios */}
        {exerciseBreakdowns.length > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Exercícios Realizados ({exerciseBreakdowns.length})
            </h3>

            <div className="flex flex-col divide-y divide-border/60">
              {exerciseBreakdowns.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="font-heading text-xs font-semibold text-foreground">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.completedSetsCount > 0
                        ? `${item.completedSetsCount} ${item.completedSetsCount === 1 ? "série" : "séries"}${item.exerciseReps > 0 ? ` • ${item.exerciseReps} reps` : ""}`
                        : item.exerciseReps > 0
                          ? `${item.exerciseReps} repetições totais`
                          : "Série completada"}
                    </span>
                  </div>

                  {item.maxWeightKg !== null && item.maxWeightKg > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-right">
                      <span className="text-[10px] text-muted-foreground">Carga máx:</span>
                      <span className="font-heading text-xs font-bold text-foreground">
                        {item.maxWeightKg} kg
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feedback da Sessão — telinha preparada para planos futuros */}
        <SummaryFeedbackWidget />

        {/* Ações de Navegação */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            asChild
            className="h-12 w-full rounded-full font-heading text-sm font-bold shadow-md"
          >
            <Link href="/">
              <span>Voltar para a Página Inicial</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 w-full rounded-full font-heading text-xs font-semibold"
          >
            <Link href="/history">
              <span>Ver Histórico Completo</span>
            </Link>
          </Button>

          <div className="text-center">
            <Link
              href={`/workout-sessions/${sessionId}`}
              className="text-xs text-muted-foreground transition hover:text-foreground hover:underline"
            >
              Rever anotações e séries desta sessão
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
