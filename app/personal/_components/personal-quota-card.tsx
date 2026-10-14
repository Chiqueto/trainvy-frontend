import { Users } from "lucide-react";

interface PersonalQuotaCardProps {
  activeCount: number;
  limit: number | null;
}

export function PersonalQuotaCard({
  activeCount,
  limit,
}: PersonalQuotaCardProps) {
  const isUnlimited = limit === null || limit === undefined;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((activeCount / limit) * 100));
  const remaining = isUnlimited ? null : Math.max(0, limit - activeCount);
  const isFull = !isUnlimited && activeCount >= limit;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <span className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Capacidade do Plano
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading text-xl font-bold text-foreground">
                {activeCount}
              </span>
              <span className="font-heading text-sm text-muted-foreground">
                / {isUnlimited ? "Ilimitado" : `${limit} alunos`}
              </span>
            </div>
          </div>
        </div>

        {!isUnlimited && (
          <div className="text-right">
            <span
              className={`font-heading text-xs font-bold px-2.5 py-1 rounded-full ${
                isFull
                  ? "bg-destructive/15 text-destructive border border-destructive/20"
                  : "bg-primary/15 text-primary border border-primary/20"
              }`}
            >
              {isFull ? "Limite atingido" : `${remaining} vaga(s) livre(s)`}
            </span>
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFull ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
