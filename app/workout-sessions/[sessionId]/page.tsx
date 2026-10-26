import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getAthleteCoachRelationship,
  getWorkoutSession,
} from "@/app/_lib/api/fetch-generated";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

import { BackButton } from "./_components/back-button";
import { WorkoutSessionTracker } from "./_components/workout-session-tracker";

interface WorkoutSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function WorkoutSessionPage({
  params,
}: WorkoutSessionPageProps) {
  const _cookies = await cookies();
  const sessionAuth = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: _cookies.toString(),
      },
    },
  });

  if (!sessionAuth.data?.user) {
    redirect("/auth");
  }

  const { sessionId } = await params;
  const [sessionResponse, coachRelResponse] = await Promise.all([
    getWorkoutSession(sessionId),
    getAthleteCoachRelationship({ cache: "no-store" }).catch(() => null),
  ]);

  if (sessionResponse.status === 401) {
    redirect("/auth");
  }

  // Estado: Sessão inexistente ou sem ownership (404)
  if (sessionResponse.status === 404) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <BackButton />
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Sessão de Treino
          </h1>
          <div className="size-6" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Sessão não encontrada
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Esta sessão de treino não existe ou não pertence à sua conta.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Estado: Erro genérico da API
  if (sessionResponse.status !== 200 || !sessionResponse.data) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <BackButton />
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Sessão de Treino
          </h1>
          <div className="size-6" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Erro ao carregar sessão
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Não foi possível recuperar os dados da sessão de treino. Tente novamente mais tarde.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  const coachInfo =
    coachRelResponse &&
    coachRelResponse.status === 200 &&
    coachRelResponse.data.hasCoach &&
    coachRelResponse.data.relationship
      ? {
          name: coachRelResponse.data.relationship.coachName,
          image: coachRelResponse.data.relationship.coachImage,
        }
      : null;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <BackButton />
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Sessão de Treino
        </h1>
        <div className="size-6" />
      </div>

      {/* Tracker Interativo */}
      <WorkoutSessionTracker
        session={sessionResponse.data}
        coachInfo={coachInfo}
      />

      <BottomNav />
    </div>
  );
}
