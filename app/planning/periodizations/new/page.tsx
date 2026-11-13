import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { authClient } from "@/app/_lib/auth-client";
import { PeriodizationForm } from "../../_components/periodization-form";

export default async function NewPeriodizationPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data?.user) redirect("/auth");

  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="trainvy-page sticky top-0 z-30 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <Link
          href="/planning"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao planejamento
        </Link>
      </header>
      <main className="trainvy-page mx-auto flex w-full flex-col gap-5 p-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">Nova periodização</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie o rascunho do ciclo. As etapas podem ser adicionadas depois.
          </p>
        </div>
        <PeriodizationForm />
      </main>
    </div>
  );
}
