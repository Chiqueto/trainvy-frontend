import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import {
  getCommercialContext,
  getWorkoutPlan,
  getUserTrainData,
} from "@/app/_lib/api/fetch-generated";
import { WorkoutCover } from "@/app/_components/workout-cover";
import Link from "next/link";
import { Goal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/app/_components/bottom-nav";
import { WorkoutDayCard } from "@/app/_components/workout-day-card";
import { Logo } from "@/app/_components/logo";
import { SavePlanAsTemplateButton } from "./_components/save-plan-as-template-button";

const WEEKDAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default async function WorkoutPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) redirect("/auth");

  const { id } = await params;
  const [workoutPlanData, trainData, commercialRes] = await Promise.all([
    getWorkoutPlan(id),
    getUserTrainData(),
    getCommercialContext({ cache: "no-store" }).catch(() => null),
  ]);

  const isCoach =
    commercialRes?.status === 200 && commercialRes.data.accountType === "COACH";

  const needsOnboarding =
    !isCoach &&
    ((trainData.status === 200 && !trainData.data) || trainData.status === 404);
  if (needsOnboarding) redirect("/onboarding");

  if (workoutPlanData.status !== 200) redirect("/");

  const { name, workoutDays, nextWorkoutDayId, lastCompletedWorkoutDayId } =
    workoutPlanData.data;

  const sortedDays = [...workoutDays].sort((a, b) => {
    if (
      typeof a.order === "number" &&
      typeof b.order === "number" &&
      a.order !== b.order
    ) {
      return a.order - b.order;
    }
    return WEEKDAY_ORDER.indexOf(a.weekDay) - WEEKDAY_ORDER.indexOf(b.weekDay);
  });

  const trainingDays = sortedDays.filter((day) => !day.isRest);

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="relative flex h-[296px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-b-[20px] px-5 pb-10 pt-5">
        <WorkoutCover
          src="/workout-plan-banner.png"
          name={name}
          variant="plan"
          priority
        />

        <Logo size="md" light className="relative" asLink />

        <div className="relative flex w-full items-end justify-between">
          <div className="flex flex-col gap-3">
            <Badge className="gap-1 rounded-full px-2.5 py-1.5 font-heading text-xs font-semibold uppercase">
              <Goal className="size-4" />
              {name}
            </Badge>
            <h1 className="font-heading text-2xl font-semibold leading-[1.05] text-white">
              Rotina de Treinos
            </h1>
          </div>
          {isCoach && (
            <SavePlanAsTemplateButton planId={id} planName={name} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {trainingDays.map((day, index) => {
          const isNext = day.id === nextWorkoutDayId;
          const isLastCompleted = day.id === lastCompletedWorkoutDayId;
          const tag = isNext
            ? "PRÓXIMO NA FILA"
            : isLastCompleted
              ? "ÚLTIMO REALIZADO"
              : `TREINO ${String.fromCharCode(65 + (index % 26))}`;

          return (
            <Link
              key={day.id}
              href={`/workout-plans/${id}/days/${day.id}`}
              className={isNext ? "rounded-xl ring-2 ring-primary" : ""}
            >
              <WorkoutDayCard
                name={day.name}
                weekDay={day.weekDay}
                tag={tag}
                rotationLabel={isNext ? "Sua vez" : undefined}
                estimatedDurationInSeconds={day.estimatedDurationInSeconds}
                exercisesCount={day.exercisesCount}
                coverImageUrl={day.coverImageUrl}
              />
            </Link>
          );
        })}
      </div>

      <BottomNav isCoach={isCoach} activePage="planning" />
    </div>
  );
}
