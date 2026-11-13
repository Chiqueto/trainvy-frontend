import { BottomNav } from "@/app/_components/bottom-nav";

export default function PeriodizationDetailLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Top bar skeleton */}
      <header className="trainvy-page sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
      </header>

      <main className="trainvy-page flex flex-col gap-6 p-5">
        {/* Info card skeleton */}
        <section className="h-36 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-5" />

        {/* Timeline skeleton */}
        <section className="flex flex-col gap-3">
          <div className="h-3.5 w-40 animate-pulse rounded-md bg-muted" />
          <div className="flex flex-col gap-3">
            <div className="h-20 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
            <div className="h-20 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
            <div className="h-20 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-4" />
          </div>
        </section>
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
