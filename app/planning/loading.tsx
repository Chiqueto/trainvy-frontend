import { BottomNav } from "@/app/_components/bottom-nav";

export default function PlanningLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Header Skeleton */}
      <header className="trainvy-page sticky top-0 z-30 flex flex-col gap-3 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-3.5 w-52 animate-pulse rounded-md bg-muted" />
        </div>
      </header>

      <main className="trainvy-page flex flex-col gap-6 p-5">
        {/* Ativo agora Skeleton */}
        <section className="flex flex-col gap-3">
          <div className="h-3.5 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-5" />
        </section>

        {/* Meus planos Skeleton */}
        <section className="flex flex-col gap-3">
          <div className="h-3.5 w-28 animate-pulse rounded-md bg-muted" />
          <div className="flex flex-col gap-2.5">
            <div className="h-16 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
            <div className="h-16 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
            <div className="h-16 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
          </div>
        </section>

        {/* Minhas periodizações Skeleton */}
        <section className="flex flex-col gap-3">
          <div className="h-3.5 w-36 animate-pulse rounded-md bg-muted" />
          <div className="flex flex-col gap-2.5">
            <div className="h-24 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
            <div className="h-24 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
          </div>
        </section>
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
