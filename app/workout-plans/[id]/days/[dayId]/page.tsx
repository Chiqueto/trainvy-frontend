import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import {
  getCommercialContext,
  getWorkoutDay,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import Link from "next/link";
import dayjs from "dayjs";
import { WorkoutCover } from "@/app/_components/workout-cover";
import { Calendar, Timer, Dumbbell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/app/_components/bottom-nav";
import { BackButton } from "./_components/back-button";
import { ExerciseCard } from "./_components/exercise-card";
import { StartWorkoutButton } from "./_components/start-workout-button";
import { CompleteWorkoutButton } from "./_components/complete-workout-button";

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "SEGUNDA",
  TUESDAY: "TERÇA",
  WEDNESDAY: "QUARTA",
  THURSDAY: "QUINTA",
  FRIDAY: "SEXTA",
  SATURDAY: "SÁBADO",
  SUNDAY: "DOMINGO",
};

const WEEKDAY_TITLE_LABELS: Record<string, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export const dynamic = "force-dynamic";

export default async function WorkoutDayPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const { id: workoutPlanId, dayId } = await params;
  const today = dayjs();
  const [workoutDayData, trainData, commercialRes] = await Promise.all([
    getWorkoutDay(workoutPlanId, dayId),
    getUserTrainData({ cache: "no-store" }),
    getCommercialContext({ cache: "no-store" }).catch(() => null),
  ]);

  const isCoach =
    commercialRes?.status === 200 && commercialRes.data.accountType === "COACH";

  const needsOnboarding =
    !isCoach &&
    ((trainData.status === 200 && !trainData.data) || trainData.status === 404);
  if (needsOnboarding) redirect("/onboarding");

  if (workoutDayData.status !== 200) redirect("/");

  const {
    name,
    weekDay,
    estimatedDurationInSeconds,
    exercises,
    sessions,
    coverImageUrl,
  } = workoutDayData.data;

  const durationInMinutes = Math.round(estimatedDurationInSeconds / 60);

  const todayStr = today.format("YYYY-MM-DD");
  const inProgressSession = sessions.find((s) => s.startedAt && !s.completedAt);
  const completedTodaySession = sessions.find(
    (s) => s.completedAt === todayStr,
  );
  const hasInProgressSession = !!inProgressSession;
  const hasCompletedSession = !!completedTodaySession;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="flex items-center justify-between px-5 py-4">
        <BackButton />
        <h1 className="font-heading text-lg font-semibold text-foreground">
          {hasInProgressSession || hasCompletedSession
            ? "Treino de Hoje"
            : WEEKDAY_TITLE_LABELS[weekDay]}
        </h1>
        <div className="size-6" />
      </div>

      <div className="px-5">
        <div className="relative flex h-[200px] w-full flex-col items-start justify-between overflow-hidden rounded-2xl p-5 shadow-sm">
          <WorkoutCover src={coverImageUrl} name={name} />

          <div className="relative">
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
              <Calendar className="size-3.5 text-white" />
              <span className="font-heading text-xs font-semibold uppercase text-white">
                {WEEKDAY_LABELS[weekDay]}
              </span>
            </div>
          </div>

          <div className="relative flex w-full items-end justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-2xl font-semibold leading-[1.05] text-white">
                {name}
              </h2>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1">
                  <Timer className="size-3.5 text-white/80" />
                  <span className="font-heading text-xs text-white/80">
                    {durationInMinutes}min
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Dumbbell className="size-3.5 text-white/80" />
                  <span className="font-heading text-xs text-white/80">
                    {exercises.length} exercícios
                  </span>
                </div>
              </div>
            </div>

            {!hasInProgressSession && !hasCompletedSession && (
              <StartWorkoutButton
                workoutPlanId={workoutPlanId}
                workoutDayId={dayId}
              />
            )}
            {hasInProgressSession && inProgressSession && (
              <Link
                href={`/workout-sessions/${inProgressSession.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
              >
                <span>Continuar</span>
                <Play className="size-3.5 fill-current" />
              </Link>
            )}
            {hasCompletedSession && (
              <Button
                variant="ghost"
                disabled
                className="rounded-full px-4 py-2 font-heading text-sm font-semibold text-white/80 hover:bg-transparent hover:text-white/80"
              >
                Concluído!
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-5">
        {exercises
          .sort((a, b) => a.order - b.order)
          .map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
      </div>

      {hasInProgressSession && inProgressSession && (
        <div className="flex flex-col gap-2.5 px-5 pt-5">
          <Link
            href={`/workout-sessions/${inProgressSession.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-heading text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
          >
            <Play className="size-4 fill-current" />
            <span>Continuar treino no Tracker</span>
          </Link>
          <CompleteWorkoutButton
            workoutPlanId={workoutPlanId}
            workoutDayId={dayId}
            sessionId={inProgressSession.id}
          />
        </div>
      )}

      <BottomNav isCoach={isCoach} activePage="planning" />
    </div>
  );
}
