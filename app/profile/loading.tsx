import { BottomNav } from "@/app/_components/bottom-nav";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-28">
      {/* Header */}
      <div className="flex h-[56px] items-center px-5">
        <div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
      </div>

      <main className="flex flex-col items-center gap-5 px-5 pt-5">
        {/* User Card Skeleton */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-[52px] animate-pulse rounded-full bg-muted/70" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-32 animate-pulse rounded bg-muted/70" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card/60 p-3" />
          <div className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card/60 p-3" />
          <div className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card/60 p-3" />
          <div className="h-20 animate-pulse rounded-2xl border border-border/60 bg-card/60 p-3" />
        </div>

        {/* Theme Card Skeleton */}
        <div className="h-28 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />

        {/* PWA Card Skeleton */}
        <div className="h-24 w-full animate-pulse rounded-2xl border border-border/60 bg-card/60 p-4" />

        {/* Logout Skeleton */}
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted/40" />
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
