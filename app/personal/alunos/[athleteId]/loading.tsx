import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";

export default function AthleteDetailsLoading() {
  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8">
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Link
            href="/personal"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Voltar para Alunos</span>
          </Link>
          <div className="h-4 w-24 bg-muted/60 rounded-full animate-pulse" />
        </div>

        {/* Skeleton do Hero Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-md flex flex-col items-center text-center gap-4">
          <div className="size-20 rounded-full bg-muted animate-pulse" />

          <div className="space-y-2 flex flex-col items-center w-full">
            <div className="h-5 w-24 bg-muted rounded-full animate-pulse" />
            <div className="h-6 w-44 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-muted rounded-md animate-pulse" />
          </div>

          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <div className="h-14 bg-muted/40 rounded-xl animate-pulse" />
            <div className="h-14 bg-muted/40 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Skeleton das Ações */}
        <div className="space-y-2.5">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-11 bg-muted rounded-xl animate-pulse" />
          <div className="h-11 bg-muted rounded-xl animate-pulse" />
        </div>

        {/* Skeleton do Card de Privacidade */}
        <div className="h-24 bg-muted/20 border border-border/60 rounded-2xl animate-pulse" />
      </main>

      <BottomNav isCoach={true} activePage="athletes" />
    </div>
  );
}
