import { BatteryCharging, Clock3, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { telemetry } from "../../_lib/tactical";
export function TelemetryHeader({
  data,
}: {
  data: ReturnType<typeof telemetry>;
}) {
  const warning = data.neural > 100 || data.minutes > 65;
  return (
    <div
      className={`rounded-2xl border p-4 ${warning ? "border-amber-400/60 bg-amber-400/5" : "border-cyan-400/20 bg-cyan-400/5"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="flex items-center gap-2">
          <BatteryCharging
            size={18}
            className={warning ? "text-amber-300" : "text-cyan-300"}
          />{" "}
          Custo SNC <strong>{data.neural}%</strong>
        </span>
        <span className="flex items-center gap-2">
          <Clock3 size={16} /> ~{data.minutes} min
        </span>
        <span className="flex items-center gap-2">
          <Layers size={16} />
          {data.sets} séries
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={false}
          animate={{ width: `${Math.min(100, data.neural)}%` }}
          className={`h-full rounded-full ${warning ? "bg-amber-300 motion-safe:animate-pulse" : "bg-cyan-300"}`}
        />
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        Estimativa de planejamento, sem medição de fadiga neural.
        {warning && " Volume ou duração elevados: revise a composição."}
      </p>
    </div>
  );
}
