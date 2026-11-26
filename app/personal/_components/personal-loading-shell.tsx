import { BottomNav, type BottomNavProps } from "@/app/_components/bottom-nav";
import { Logo } from "@/app/_components/logo";

export function PersonalLoadingShell({
  activePage = "athletes",
}: {
  activePage?: BottomNavProps["activePage"];
}) {
  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8">
      <main className="trainvy-page mx-auto w-full px-5 py-4 flex flex-col gap-5">
        <header className="flex h-12 items-center justify-between border-b border-border/60 pb-3">
          <Logo size="md" asLink />
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-24 rounded-lg bg-muted/60" />
            <div className="size-8 rounded-xl bg-muted/60" />
            <div className="size-8 rounded-xl bg-muted/60" />
          </div>
        </header>

        <div className="flex flex-col gap-4 sm:gap-5 rounded-3xl border border-border/70 bg-card p-4 sm:p-7 shadow-xs animate-pulse">
          <div className="h-6 w-52 rounded-full bg-muted/60" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-muted/60" />
            <div className="h-4 w-72 max-w-full rounded-md bg-muted/40" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:flex border-t border-border/50 pt-4">
            <div className="h-9 sm:w-24 rounded-xl bg-muted/60" />
            <div className="h-9 sm:w-24 rounded-xl bg-muted/40" />
            <div className="h-9 sm:w-24 rounded-xl bg-muted/40" />
          </div>
        </div>

        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/70 bg-card p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted/60 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-muted/60" />
                  <div className="h-3 w-44 rounded bg-muted/40" />
                </div>
              </div>
              <div className="h-8 w-16 rounded-lg bg-muted/40" />
            </div>
          ))}
        </div>
      </main>

      <BottomNav isCoach={true} activePage={activePage} />
    </div>
  );
}
