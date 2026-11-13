export default function HistoryLoading() {
  return (
    <div className="min-h-svh animate-pulse bg-background pb-24 pt-5">
      <div className="trainvy-page">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-3 h-8 w-36 rounded bg-muted" />
        <div className="mt-2 h-4 w-48 rounded bg-muted/70" />
        <div className="mt-5 h-12 rounded-xl bg-muted/70" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
