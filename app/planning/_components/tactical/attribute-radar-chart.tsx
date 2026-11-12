"use client";
import { motion, useReducedMotion } from "framer-motion";
const attributes = [
  {
    key: "strength",
    label: "Força",
    description: "Ênfase nos movimentos e nas faixas prescritas.",
    color: "#7dd3fc",
  },
  {
    key: "power",
    label: "Explosão",
    description: "Presença de movimentos classificados como potência.",
    color: "#c4b5fd",
  },
  {
    key: "hypertrophy",
    label: "Hipertrofia",
    description: "Perfil dos exercícios e repetições planejadas.",
    color: "#67e8f9",
  },
  {
    key: "metabolic",
    label: "Metabólico",
    description: "Ênfase ilustrativa de resistência e repetições.",
    color: "#fbbf24",
  },
  {
    key: "stability",
    label: "Estabilidade",
    description: "Características dos exercícios e equipamentos.",
    color: "#6ee7b7",
  },
] as const;
type Key = (typeof attributes)[number]["key"];
const point = (i: number, radius: number) => {
  const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
  return {
    x: 160 + Math.cos(angle) * radius,
    y: 138 + Math.sin(angle) * radius,
  };
};
const coordinates = (i: number, radius: number) => {
  const p = point(i, radius);
  return `${p.x},${p.y}`;
};
export function AttributeRadarChart({
  values,
}: {
  values: Record<Key, number>;
}) {
  const reduced = useReducedMotion();
  const value = (key: Key) =>
    Number.isFinite(values[key]) ? Math.max(0, Math.min(10, values[key])) : 0;
  const format = (n: number) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            Perfil do treino
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Compare a ênfase estimada em cada atributo.
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 px-2 py-1 font-mono text-xs text-slate-400">
          0–10
        </span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,#142d3d,#0b1521_75%)] px-1 py-3">
        <svg
          viewBox="0 0 320 280"
          className="mx-auto w-full max-w-[360px]"
          role="img"
          aria-label={attributes
            .map(({ key, label }) => `${label}: ${format(value(key))} de 10`)
            .join(", ")}
        >
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={attributes
                .map((_, i) => coordinates(i, 82 * scale))
                .join(" ")}
              fill={scale === 1 ? "#0e223088" : "none"}
              stroke="#496074"
              strokeOpacity={scale === 1 ? 0.65 : 0.4}
              strokeWidth="1"
            />
          ))}
          {attributes.map(({ key }, i) => {
            const p = point(i, 82);
            return (
              <line
                key={key}
                x1="160"
                y1="138"
                x2={p.x}
                y2={p.y}
                stroke="#496074"
                strokeOpacity=".45"
              />
            );
          })}
          <motion.polygon
            initial={false}
            animate={{
              points: attributes
                .map(({ key }, i) => coordinates(i, (82 * value(key)) / 10))
                .join(" "),
            }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 100, damping: 22 }
            }
            fill="#22d3ee24"
            stroke="#67e8f9"
            strokeWidth="2"
          />
          {attributes.map(({ key, color }, i) => {
            const p = point(i, (82 * value(key)) / 10);
            return (
              <circle
                key={key}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill={color}
                stroke="#0b1521"
                strokeWidth="1.5"
              />
            );
          })}
          {attributes.map(({ key, label }, i) => {
            const p = point(i, 113);
            return (
              <text
                key={key}
                x={p.x}
                y={p.y}
                fill="#e2e8f0"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
      <dl className="space-y-3" aria-label="Valores dos atributos">
        {attributes.map(({ key, label, description, color }) => (
          <div
            key={key}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <dt
                className="flex items-center gap-2 text-sm text-slate-200"
                title={description}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: color }}
                />
                {label}
              </dt>
              <dd className="font-mono text-sm font-semibold text-white">
                {format(value(key))}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  /10
                </span>
              </dd>
            </div>
            <div
              aria-hidden
              className="mt-2 h-1 overflow-hidden rounded-full bg-white/5"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${value(key) * 10}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-slate-500">
        Atributos calculados a partir da ficha. Não representam capacidades
        medidas do atleta.
      </p>
    </div>
  );
}
