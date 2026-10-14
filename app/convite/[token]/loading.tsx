import { Logo } from "@/app/_components/logo";

export default function ConviteLoading() {
  return (
    <div className="flex min-h-svh flex-col bg-background p-5 items-center justify-center animate-pulse">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Logo size="lg" />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col items-center gap-6 shadow-xl w-full">
          <div className="size-20 rounded-full bg-muted/60" />

          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-4 w-28 rounded-full bg-muted/60" />
            <div className="h-7 w-48 rounded-lg bg-muted/60" />
            <div className="h-3 w-64 rounded bg-muted/40" />
          </div>

          <div className="w-full h-24 rounded-2xl bg-muted/30 border border-border/80" />

          <div className="w-full h-12 rounded-xl bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
