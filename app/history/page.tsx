import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BottomNav } from "@/app/_components/bottom-nav";
import {
  listWorkoutHistory,
  type ListWorkoutHistory200,
} from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";

import { HistoryTimeline } from "./_components/history-timeline";

export default async function HistoryPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  return (
    <div className="min-h-svh bg-background pb-24">
      <Suspense
        fallback={
          <div
            className="trainvy-page space-y-4 p-5"
            aria-label="Carregando histórico"
          >
            <h1 className="font-heading text-2xl font-semibold">Histórico</h1>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        }
      >
        <HistoryContent />
      </Suspense>
      <BottomNav />
    </div>
  );
}

async function HistoryContent() {
  let initialPage: ListWorkoutHistory200 | null = null;
  let initialError: string | null = null;

  try {
    const response = await listWorkoutHistory();
    if (response.status === 200) {
      initialPage = response.data;
    } else {
      initialError = "Não foi possível carregar seu histórico.";
    }
  } catch (error) {
    console.error("Failed to load initial workout history:", error);
    initialError = "Não foi possível carregar seu histórico.";
  }

  return (
    <HistoryTimeline initialPage={initialPage} initialError={initialError} />
  );
}
