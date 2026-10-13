import { BottomNav } from "@/app/_components/bottom-nav";

export default function WorkoutPlanLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Header */}
      <div className="flex h-[56px] items-center px-5">
        <div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
      </div>

      {/* Plan Cover / Header */}
      <div className="relative flex h-[220px] shrink-0 flex-col justify-between overflow-hidden rounded-b-[20px] bg-muted/30 p-5 animate-pulse">
        <div className="h-4 w-20 rounded bg-muted/60" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted/60" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 rounded-full bg-muted/50" />
            <div className="h-5 w-20 rounded-full bg-muted/50" />
          </div>
        </div>
      </div>

      {/* Days list */}
      <main className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted/50" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="h-28 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
          <div className="h-28 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
          <div className="h-28 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
        </div>
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
