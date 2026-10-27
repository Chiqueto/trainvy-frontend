import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEditableWorkoutPlan } from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";
import { WorkoutPlanBuilder } from "@/app/planning/_components/workout-plan-builder";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");
  const { id } = await params;
  const response = await getEditableWorkoutPlan(id, { cache: "no-store" });
  if (response.status === 401) redirect("/auth");
  if (response.status === 404) notFound();
  if (response.status !== 200)
    throw new Error("Não foi possível carregar o plano para edição.");
  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="border-b border-border px-5 py-4">
        <Link
          href={`/workout-plans/${id}`}
          className="inline-flex min-h-11 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Voltar ao plano
        </Link>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-5 p-5">
        <h1 className="font-heading text-2xl font-bold">Editar plano</h1>
        <WorkoutPlanBuilder
          key={response.data.id}
          mode="edit"
          initialPlan={response.data}
        />
      </main>
    </div>
  );
}
