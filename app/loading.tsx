import { BottomNav } from "./_components/bottom-nav";

export default function HomeLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      {/* 1. Banner Superior Skeleton */}
      <div className="relative flex h-[296px] shrink-0 flex-col justify-between overflow-hidden rounded-b-[20px] bg-muted/30 px-5 pb-10 pt-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-28 rounded-lg bg-muted/60" />
          <div className="size-9 rounded-full bg-muted/60" />
        </div>

        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted/60" />
          <div className="h-8 w-44 rounded-lg bg-muted/60" />
        </div>
      </div>

      {/* 2. Consistency / Streak Tracker Skeleton */}
      <div className="px-5 pt-5">
        <div className="h-20 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />
      </div>

      {/* 3. Card do Treino de Hoje Skeleton */}
      <div className="flex flex-col gap-3 px-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted/50" />
        </div>

        <div className="h-48 w-full animate-pulse rounded-2xl border border-border/60 bg-card/70 p-5 shadow-xs" />
      </div>

      {/* 4. Treino Livre Skeleton */}
      <div className="px-5 pt-4">
        <div className="h-12 w-full animate-pulse rounded-xl border border-border/60 bg-muted/40" />
      </div>

      <BottomNav activePage="home" />
    </div>
  );
}
