import { BottomNav } from "@/app/_components/bottom-nav";

export default function WorkoutDayLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-32">
      {/* Top Bar with BackButton */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-border/40">
        <div className="size-9 rounded-full bg-muted/60 animate-pulse" />
        <div className="h-5 w-28 rounded bg-muted/60 animate-pulse" />
        <div className="size-9" />
      </div>

      {/* Cover Skeleton */}
      <div className="relative flex h-[190px] shrink-0 flex-col justify-between overflow-hidden bg-muted/30 p-5 animate-pulse">
        <div className="h-5 w-20 rounded-full bg-muted/60" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-muted/60" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 rounded bg-muted/50" />
            <div className="h-4 w-24 rounded bg-muted/50" />
          </div>
        </div>
      </div>

      {/* Exercises List Skeleton */}
      <main className="flex flex-col gap-3 p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />

        <div className="flex flex-col gap-3">
          <div className="h-20 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
          <div className="h-20 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
          <div className="h-20 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
          <div className="h-20 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
        </div>
      </main>

      <BottomNav activePage="planning" />
    </div>
  );
}
