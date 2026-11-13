export default function StatsLoading() {
  return (
    <div className="min-h-svh animate-pulse bg-background pb-24 pt-5">
      <div className="trainvy-page">
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="mt-7 h-8 w-36 rounded bg-muted" />
        <div className="mt-2 h-4 w-64 max-w-full rounded bg-muted/70" />
        <div className="mt-5 h-12 rounded-xl bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="mt-5 h-64 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
