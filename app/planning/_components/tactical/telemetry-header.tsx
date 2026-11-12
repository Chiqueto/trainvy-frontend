import { Brain, Clock3, Layers } from "lucide-react";
import type { telemetry } from "../../_lib/tactical";
export function TelemetryHeader({
  data,
  compact = false,
}: {
  data: ReturnType<typeof telemetry>;
  compact?: boolean;
}) {
  if (compact)
    return (
      <div
        className="flex min-w-0 items-center gap-3 text-xs text-slate-400"
        aria-label={`Estimativa: SNC ${data.neural} pontos, ${data.minutes} minutos`}
      >
        <span className="shrink-0">
          SNC{" "}
          <strong className="font-mono font-medium text-cyan-100">
            {data.neural}
          </strong>{" "}
          <span className="text-slate-500">pts</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Clock3 size={12} />~{data.minutes} min
        </span>
      </div>
    );
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="flex items-center gap-2">
          <Brain size={18} className="text-cyan-300" />
          SNC <strong className="font-mono">{data.neural}</strong>
          <span className="text-xs text-slate-400">pts estimados</span>
        </span>
        <span className="flex items-center gap-2">
          <Clock3 size={16} />~{data.minutes} min
        </span>
        <span className="flex items-center gap-2">
          <Layers size={16} />
          {data.sets} séries
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Índice ilustrativo da composição da ficha, sem medição de fadiga neural.
      </p>
    </div>
  );
}
