import { BottomNav } from "@/app/_components/bottom-nav";

export default function PersonalLoading() {
  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8 animate-pulse">
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-muted/60" />
            <div className="h-6 w-28 rounded-full bg-muted/60" />
          </div>
          <div className="space-y-2">
            <div className="h-7 w-40 rounded-lg bg-muted/60" />
            <div className="h-4 w-60 rounded-md bg-muted/40" />
          </div>
        </div>

        {/* Quota Card Skeleton */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-muted/60" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-muted/40" />
                <div className="h-6 w-16 rounded bg-muted/60" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-muted/40" />
          </div>
          <div className="w-full h-2 rounded-full bg-muted/40" />
        </div>

        {/* Button Skeleton */}
        <div className="w-full h-12 rounded-xl bg-muted/60" />

        {/* Athletes List Skeleton */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="h-4 w-32 rounded bg-muted/40" />
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted/60 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-muted/60" />
                    <div className="h-3 w-36 rounded bg-muted/40" />
                  </div>
                </div>
                <div className="h-8 w-16 rounded-lg bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav isCoach={true} activePage="athletes" />
    </div>
  );
}
