"use client";
import { Brain, Layers3, Sparkles } from "lucide-react";
import type { telemetry } from "../../_lib/tactical";
const format = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const demandLabels = {
  low: "Isolador",
  medium: "Multiarticular",
  high: "Composto / potência",
  unknown: "Sem classificação",
};
export function NeuralDemandPanel({
  data,
}: {
  data: ReturnType<typeof telemetry>;
}) {
  const breakdown = data.neuralBreakdown;
  const sources = [...breakdown.sources].sort((a, b) => b.points - a.points);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">
          Demanda estimada do SNC
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Entenda como a composição da ficha contribui para o índice.
        </p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/15 bg-[radial-gradient(ellipse_at_top_right,#5c462d44,#101923_75%)] p-5">
        <Brain
          size={92}
          strokeWidth={0.8}
          className="absolute -right-2 top-2 text-amber-200/10"
          aria-hidden
        />
        <span className="text-[11px] font-medium uppercase tracking-widest text-amber-200/70">
          Índice da ficha
        </span>
        <p className="relative mt-2 font-mono text-5xl font-medium tracking-tight text-amber-100">
          {format(data.neural)}
          <span className="ml-2 font-sans text-sm font-normal tracking-normal text-slate-400">
            pontos
          </span>
        </p>
        <p className="mt-3 text-xs text-slate-400">
          {data.sets} séries planejadas · {sources.length} exercícios
        </p>
        <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-amber-100/10 pt-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Layers3 size={13} />
              Base dos exercícios
            </p>
            <p className="mt-1 font-mono text-lg text-slate-100">
              {format(breakdown.base)}{" "}
              <span className="text-xs text-slate-500">pts</span>
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles size={13} />
              Técnicas aplicadas
            </p>
            <p className="mt-1 font-mono text-lg text-amber-200">
              +{format(breakdown.techniques)}{" "}
              <span className="text-xs text-slate-500">pts</span>
            </p>
          </div>
        </div>
      </div>
      <section aria-label="Contribuição dos exercícios">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200">
            Contribuição por exercício
          </h4>
          <span className="text-xs text-slate-500">pontos</span>
        </div>
        {sources.length ? (
          <ol className="space-y-3">
            {sources.map((source, i) => (
              <li
                key={`${source.name}-${i}`}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-slate-100">
                      {source.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {source.sets} séries · {demandLabels[source.demand]}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm text-amber-100">
                    {format(source.points)}
                  </span>
                </div>
                <div aria-hidden className="mt-2 h-1 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-amber-200/60"
                    style={{
                      width: `${sources[0].points > 0 ? (source.points / sources[0].points) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            Adicione exercícios à ficha para ver a distribuição.
          </p>
        )}
      </section>
      <details className="rounded-xl border border-white/10 px-3 py-2">
        <summary className="cursor-pointer py-1 text-sm text-slate-300">
          Como o índice é calculado
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Cada série contribui com 2 pontos para isoladores, 4 para
          multiarticulares ou 7 para compostos/potência. Exercícios sem
          classificação usam 3 pontos. Cada técnica adiciona 15% à contribuição
          do exercício. A classificação é aproximada e os totais são
          arredondados.
        </p>
      </details>
      <p className="rounded-xl bg-amber-100/[0.04] p-3 text-xs leading-relaxed text-slate-400">
        Use o índice para comparar a composição das fichas. Ele não mede fadiga
        ou estresse real do sistema nervoso central.
      </p>
    </div>
  );
}
