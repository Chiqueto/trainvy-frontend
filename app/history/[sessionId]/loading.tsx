export default function HistorySessionLoading() {
  return (
    <div className="min-h-svh animate-pulse bg-background pb-24 pt-4">
      <div className="trainvy-page">
        <div className="h-10 w-24 rounded bg-muted/70" />
        <div className="mt-3 h-8 w-48 rounded bg-muted" />
        <div className="mt-2 h-4 w-40 rounded bg-muted/70" />
        <div className="mt-5 h-36 rounded-2xl border border-border bg-muted/50" />
        <div className="mt-6 space-y-4">
          <div className="h-64 rounded-2xl border border-border bg-muted/50" />
          <div className="h-64 rounded-2xl border border-border bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
