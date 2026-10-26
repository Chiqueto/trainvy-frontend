import { redirect } from "next/navigation";
import { requireAccountSetup } from "./_lib/require-account-setup";
import { readReturnToCookie } from "./_lib/auth-return-to";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import {
  getActiveWorkoutSession,
  getCommercialContext,
  getHomeData,
  GetHomeData200TodayWorkoutDay,
  getUserTrainData,
} from "./_lib/api/fetch-generated";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Play } from "lucide-react";
import { BottomNav } from "./_components/bottom-nav";
import { ConsistencyTracker } from "./_components/consistency-tracker";
import { StartFreeWorkoutButton } from "./_components/start-free-workout-button";
import { WorkoutDayCard } from "./_components/workout-day-card";
import { Logo } from "./_components/logo";
import { HomeBodyMetricsCard } from "./_components/home-body-metrics-card";

export default async function Home() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");
  await requireAccountSetup();

  const returnTo = await readReturnToCookie();
  if (returnTo) {
    redirect("/auth/return");
  }

  const today = dayjs();
  const [homeData, trainData, activeSessionResponse] = await Promise.all([
    getHomeData(today.format("YYYY-MM-DD"), {
      timezoneOffset: today.utcOffset(),
    }),
    getUserTrainData(),
    getActiveWorkoutSession().catch(() => null),
  ]);

  const activeSession =
    activeSessionResponse?.status === 200 ? activeSessionResponse.data : null;

  const needsOnboarding =
    (trainData.status === 200 && !trainData.data) || trainData.status === 404;
  if (needsOnboarding) {
    const commercialRes = await getCommercialContext({ cache: "no-store" }).catch(() => null);
    if (commercialRes?.status === 200 && commercialRes.data.accountType === "COACH") {
      redirect("/personal");
    }
    redirect("/onboarding");
  }

  const userTrainData = trainData.status === 200 ? trainData.data : null;

  let activeWorkoutPlanId: string | null = null;
  let todayWorkoutDay: GetHomeData200TodayWorkoutDay | undefined = undefined;
  let lastCompletedWorkoutDay:
    | { id: string; name: string; completedAt: string }
    | undefined = undefined;
  let isLastWorkoutCompletedToday = false;
  let rotationIndex: number | undefined = undefined;
  let totalWorkoutsInRotation: number | undefined = undefined;
  let workoutStreak = 0;
  let consistencyByDay: Record<
    string,
    { workoutDayCompleted: boolean; workoutDayStarted: boolean }
  > = {};

  if (homeData.status === 200) {
    activeWorkoutPlanId = homeData.data.activeWorkoutPlanId;
    todayWorkoutDay = homeData.data.todayWorkoutDay;
    lastCompletedWorkoutDay = homeData.data.lastCompletedWorkoutDay;
    isLastWorkoutCompletedToday = !!homeData.data.isLastWorkoutCompletedToday;
    rotationIndex = homeData.data.rotationIndex;
    totalWorkoutsInRotation = homeData.data.totalWorkoutsInRotation;
    workoutStreak = homeData.data.workoutStreak;
    consistencyByDay = homeData.data.consistencyByDay;
  } else if (homeData.status !== 404) {
    console.error("Failed to fetch home data:", {
      status: homeData.status,
      data: homeData.data,
    });
    throw new Error(`Failed to fetch home data (status ${homeData.status})`);
  }

  const userName = session.data.user.name?.split(" ")[0] ?? "";

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="relative flex h-[296px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-b-[20px] px-5 pb-10 pt-5">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/home-banner.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(243deg, rgba(0,0,0,0) 34%, rgb(0,0,0) 100%)",
            }}
          />
        </div>

        <Logo size="md" light className="relative" asLink />

        <div className="relative flex w-full items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold leading-[1.05] text-background">
              Olá, {userName}
            </h1>
            <p className="font-heading text-sm leading-[1.15] text-background/70">
              Bora treinar hoje?
            </p>
          </div>
          {activeSession ? (
            <Link
              href={`/workout-sessions/${activeSession.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
            >
              <span>Continuar</span>
              <Play className="size-3 fill-current" />
            </Link>
          ) : todayWorkoutDay && activeWorkoutPlanId ? (
            <Link
              href={`/workout-plans/${activeWorkoutPlanId}/days/${todayWorkoutDay.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
            >
              <span>Bora treinar!</span>
              <Play className="size-3 fill-current" />
            </Link>
          ) : (
            <Link
              href="/planning"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
            >
              <span>Ver treinos</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {activeSession && (
        <div className="px-5 pt-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
                <span className="font-heading text-xs font-semibold uppercase tracking-wider text-primary">
                  Treino em Andamento
                </span>
              </div>
              <span className="font-heading text-xs text-muted-foreground">
                Iniciado às {dayjs(activeSession.startedAt).format("HH:mm")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <p className="font-heading text-sm font-semibold text-foreground">
                  Você tem uma sessão aberta
                </p>
                <p className="font-heading text-xs text-muted-foreground">
                  {activeSession.sessionExercises.length} exercícios na sessão
                </p>
              </div>

              <Link
                href={`/workout-sessions/${activeSession.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <span>Continuar treino</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-4">
        <StartFreeWorkoutButton hasActiveSession={!!activeSession} />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Consistência
          </h2>
          <Link
            href="/history"
            className="rounded-sm font-heading text-xs text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver histórico
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-border p-5">
            <ConsistencyTracker
              consistencyByDay={consistencyByDay}
              today={today}
            />
          </div>
          <div className="flex items-center gap-2 self-stretch rounded-xl bg-streak px-5 py-2">
            <Flame className="size-5 text-streak-foreground" />
            <span className="font-heading text-base font-semibold text-foreground">
              {workoutStreak}
            </span>
          </div>
        </div>
      </div>

      {todayWorkoutDay ? (
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {isLastWorkoutCompletedToday
                  ? "Próximo Treino na Rotação"
                  : "Treino Sugerido"}
              </h2>
              {lastCompletedWorkoutDay && (
                <p className="font-heading text-xs text-muted-foreground">
                  {isLastWorkoutCompletedToday
                    ? `Hoje você fez ${lastCompletedWorkoutDay.name} 🔥`
                    : `Último realizado: ${lastCompletedWorkoutDay.name}`}
                </p>
              )}
            </div>
            {activeWorkoutPlanId && (
              <Link
                href={`/workout-plans/${activeWorkoutPlanId}`}
                className="font-heading text-xs font-semibold text-primary hover:underline"
              >
                Ver plano completo
              </Link>
            )}
          </div>

          <Link
            href={`/workout-plans/${todayWorkoutDay.workoutPlanId}/days/${todayWorkoutDay.id}`}
          >
            <WorkoutDayCard
              name={todayWorkoutDay.name}
              weekDay={todayWorkoutDay.weekDay}
              tag={
                isLastWorkoutCompletedToday
                  ? "PRÓXIMO NA FILA"
                  : "TREINO DA VEZ"
              }
              rotationLabel={
                rotationIndex && totalWorkoutsInRotation
                  ? `${rotationIndex} de ${totalWorkoutsInRotation}`
                  : undefined
              }
              estimatedDurationInSeconds={
                todayWorkoutDay.estimatedDurationInSeconds
              }
              exercisesCount={todayWorkoutDay.exercisesCount}
              coverImageUrl={todayWorkoutDay.coverImageUrl!}
            />
          </Link>
        </div>
      ) : !activeWorkoutPlanId ? (
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Nenhum plano ativo
              </h2>
              <p className="font-heading text-xs text-muted-foreground">
                Você pode iniciar um treino avulso ou organizar seu planejamento.
              </p>
            </div>
            <Link
              href="/planning"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <span>Ir para Planejamento</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      <HomeBodyMetricsCard
        weightInGrams={userTrainData?.weightInGrams}
        heightInCentimeters={userTrainData?.heightInCentimeters}
        age={userTrainData?.age}
        bodyFatPercentage={userTrainData?.bodyFatPercentage}
        weightDiffInGrams={userTrainData?.weightDiffInGrams}
        bodyFatDiff={userTrainData?.bodyFatDiff}
      />

      <BottomNav />
    </div>
  );
}
