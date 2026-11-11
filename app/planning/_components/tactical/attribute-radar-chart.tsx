import { motion } from "framer-motion";
const labels = [
  "Força",
  "Explosão",
  "Hipertrofia",
  "Metabólico",
  "Estabilidade",
];
const keys = [
  "strength",
  "power",
  "hypertrophy",
  "metabolic",
  "stability",
] as const;
function point(i: number, radius: number) {
  const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
  return `${110 + Math.cos(a) * radius},${110 + Math.sin(a) * radius}`;
}
export function AttributeRadarChart({
  values,
}: {
  values: Record<(typeof keys)[number], number>;
}) {
  return (
    <svg
      viewBox="0 0 220 215"
      className="mx-auto w-full max-w-60"
      role="img"
      aria-label={keys
        .map((k, i) => `${labels[i]}: ${values[k].toFixed(1)} de 10`)
        .join(", ")}
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={keys.map((_, i) => point(i, 65 * scale)).join(" ")}
          fill="none"
          stroke="#334155"
        />
      ))}
      {keys.map((k, i) => (
        <line
          key={k}
          x1="110"
          y1="110"
          x2={point(i, 65).split(",")[0]}
          y2={point(i, 65).split(",")[1]}
          stroke="#334155"
        />
      ))}
      <motion.polygon
        initial={false}
        animate={{
          points: keys.map((k, i) => point(i, (65 * values[k]) / 10)).join(" "),
        }}
        transition={{ type: "spring", stiffness: 100, damping: 22 }}
        fill="#22d3ee30"
        stroke="#67e8f9"
        strokeWidth="2"
      />
      {labels.map((label, i) => (
        <text
          key={label}
          x={point(i, 92).split(",")[0]}
          y={point(i, 92).split(",")[1]}
          fill="#cbd5e1"
          textAnchor="middle"
          fontSize="9"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
