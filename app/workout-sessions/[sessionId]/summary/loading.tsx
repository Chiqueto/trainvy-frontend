export default function WorkoutSummaryLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-12 animate-pulse">
      {/* Top Header */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-border/40">
        <div className="size-9 rounded-full bg-muted/60" />
        <div className="h-5 w-32 rounded bg-muted/60" />
        <div className="size-9" />
      </div>

      <main className="flex flex-col gap-6 p-5">
        {/* Celebration Card Skeleton */}
        <div className="h-56 w-full rounded-3xl border border-border/60 bg-card/60 p-6 flex flex-col items-center justify-center gap-3">
          <div className="size-16 rounded-full bg-muted/70" />
          <div className="h-6 w-44 rounded-lg bg-muted/70" />
          <div className="h-4 w-56 rounded bg-muted/50" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl border border-border/60 bg-card/50 p-4" />
          <div className="h-24 rounded-2xl border border-border/60 bg-card/50 p-4" />
          <div className="h-24 rounded-2xl border border-border/60 bg-card/50 p-4" />
          <div className="h-24 rounded-2xl border border-border/60 bg-card/50 p-4" />
        </div>

        {/* Action Button Skeleton */}
        <div className="pt-2">
          <div className="h-12 w-full rounded-xl bg-muted/60" />
        </div>
      </main>
    </div>
  );
}
