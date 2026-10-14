export default function NewPeriodizationLoading() {
  return (
    <div className="min-h-svh bg-background pb-12">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur-md">
        <div className="h-6 w-44 animate-pulse rounded-md bg-muted" />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <div className="h-44 w-full animate-pulse rounded-2xl border border-border bg-card/60 p-5" />
          <div className="h-12 w-full animate-pulse rounded-full bg-primary/20" />
        </div>
      </main>
    </div>
  );
}
