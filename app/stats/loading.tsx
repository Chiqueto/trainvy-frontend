export default function Loading() {
  return (
    <div
      className="trainvy-page space-y-5 p-5"
      aria-label="Carregando evolução"
      aria-busy="true"
    >
      <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      <div className="h-[560px] animate-pulse rounded-2xl bg-muted" />
      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
