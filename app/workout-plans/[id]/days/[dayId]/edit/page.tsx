import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getEditableWorkoutPlan } from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";
import { WorkoutDayEditor } from "@/app/planning/_components/workout-day-editor";
import { deserializeWorkoutDays } from "@/app/planning/_lib/workout-plan-builder";

export default async function EditWorkoutDayPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  const { id, dayId } = await params;
  const result = await getEditableWorkoutPlan(id, { cache: "no-store" });
  if (result.status === 401) redirect("/auth");
  if (result.status === 404) notFound();
  if (result.status !== 200)
    throw new Error("Não foi possível carregar o treino para edição.");

  const day = deserializeWorkoutDays(result.data).find(
    (entry) => entry.id === dayId,
  );
  if (!day) notFound();
  const workoutHref = `/workout-plans/${id}/days/${dayId}`;
  if (result.data.canEdit === false) redirect(workoutHref);

  return (
    <main className="trainvy-page flex min-h-svh flex-col gap-5 py-5 pb-20">
      <header>
        <p className="text-sm text-muted-foreground">{result.data.name}</p>
        <h1 className="font-heading text-2xl font-bold">Editar treino</h1>
      </header>
      <WorkoutDayEditor
        key={dayId}
        planId={id}
        dayId={dayId}
        initialDay={day}
      />
    </main>
  );
}
