import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { BottomNav } from "@/app/_components/bottom-nav";
import { HistorySessionDetail } from "@/app/history/_components/history-session-detail";
import { getWorkoutHistorySession } from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  const { sessionId } = await params;

  let response: Awaited<ReturnType<typeof getWorkoutHistorySession>> | null =
    null;
  try {
    response = await getWorkoutHistorySession(sessionId);
  } catch (error) {
    console.error("Failed to load workout history detail:", error);
  }

  if (!response) return <HistoryDetailError />;
  if (response.status === 401) redirect("/auth");
  if (response.status === 404) notFound();
  if (response.status !== 200) return <HistoryDetailError />;

  return (
    <div className="min-h-svh bg-background pb-24">
      <HistorySessionDetail session={response.data} />
      <div className="mx-auto max-w-3xl px-5 pb-5">
        <Button
          asChild
          variant="outline"
          className="min-h-11 w-full rounded-full"
        >
          <Link href={`/workout-sessions/${sessionId}/summary`}>
            Ver resumo e avaliação pós-treino
          </Link>
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}

function HistoryDetailError() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 pb-24 text-center">
      <AlertCircle className="size-9 text-destructive" aria-hidden="true" />
      <h1 className="mt-3 font-heading text-xl font-semibold text-foreground">
        Não foi possível carregar este treino.
      </h1>
      <Button asChild variant="outline" className="mt-5 rounded-full">
        <Link href="/history">Voltar ao histórico</Link>
      </Button>
      <BottomNav />
    </div>
  );
}
