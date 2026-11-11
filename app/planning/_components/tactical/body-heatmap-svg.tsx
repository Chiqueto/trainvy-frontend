import { useState } from "react";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
const regions = [
  { muscle: "CHEST", d: "M44 43 Q55 38 64 44 L63 59 44 56 Z", back: false },
  { muscle: "CHEST", d: "M68 44 Q78 38 88 43 L88 56 69 59 Z", back: false },
  { muscle: "BACK", d: "M45 43 L87 43 80 82 52 82 Z", back: true },
  { muscle: "SHOULDERS", d: "M43 40 Q30 40 29 58 L40 60 45 46 Z", back: null },
  {
    muscle: "SHOULDERS",
    d: "M89 40 Q102 40 103 58 L92 60 87 46 Z",
    back: null,
  },
  {
    muscle: "BICEPS",
    d: "M29 61 L40 63 35 83 25 80 Z M92 63 L103 61 107 80 97 83 Z",
    back: false,
  },
  {
    muscle: "TRICEPS",
    d: "M29 61 L40 63 35 83 25 80 Z M92 63 L103 61 107 80 97 83 Z",
    back: true,
  },
  {
    muscle: "FOREARMS",
    d: "M24 84 L34 87 28 110 20 108 Z M98 87 L108 84 112 108 104 110 Z",
    back: null,
  },
  { muscle: "CORE", d: "M48 62 L84 62 80 88 52 88 Z", back: false },
  {
    muscle: "GLUTES",
    d: "M50 90 L82 90 86 111 68 114 66 107 64 114 46 111 Z",
    back: true,
  },
  {
    muscle: "QUADRICEPS",
    d: "M48 99 L63 102 61 141 47 143 Z M69 102 L84 99 85 143 71 141 Z",
    back: false,
  },
  {
    muscle: "HAMSTRINGS",
    d: "M48 116 L63 117 61 141 47 143 Z M69 117 L84 116 85 143 71 141 Z",
    back: true,
  },
  {
    muscle: "ADDUCTORS",
    d: "M60 100 L65 100 63 134 59 136 Z M67 100 L72 100 73 136 69 134 Z",
    back: false,
  },
  {
    muscle: "CALVES",
    d: "M47 149 L60 148 59 177 50 181 Z M72 148 L85 149 82 181 73 177 Z",
    back: null,
  },
];
export function heatColor(volume: number) {
  return volume >= 9
    ? "#ddd6fe"
    : volume >= 4
      ? "#fb713b"
      : volume > 0
        ? "#22d3ee"
        : "#334155";
}
export function BodyHeatmapSVG({
  volumes,
}: {
  volumes: Record<string, number>;
}) {
  const [back, setBack] = useState(false);
  const [selected, setSelected] = useState("CHEST");
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tracking-widest text-slate-400">
          MAPA DE VOLUME
        </span>
        <button
          type="button"
          onClick={() => setBack(!back)}
          className="min-h-11 px-2 text-cyan-300"
        >
          {back ? "Ver frente ↻" : "Ver costas ↻"}
        </button>
      </div>
      <svg
        viewBox="0 0 132 200"
        className="mx-auto h-52"
        role="group"
        aria-label={back ? "Mapa posterior" : "Mapa frontal"}
      >
        <circle cx="66" cy="22" r="13" fill="#475569" />
        <path
          d="M59 35 L73 35 76 42 90 42 104 58 114 110 104 116 91 79 85 92 89 144 84 187 70 187 66 143 62 187 48 187 43 144 47 92 41 79 28 116 18 110 28 58 42 42 56 42 Z"
          fill="#1e293b"
          stroke="#475569"
        />
        {regions
          .filter((r) => r.back === null || r.back === back)
          .map((r, i) => (
            <path
              key={`${r.muscle}-${i}`}
              d={r.d}
              role="button"
              tabIndex={0}
              aria-label={`${getMuscleGroupLabel(r.muscle)}: ${volumes[r.muscle] ?? 0} séries equivalentes`}
              onClick={() => setSelected(r.muscle)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(r.muscle);
                }
              }}
              fill={heatColor(volumes[r.muscle] ?? 0)}
              stroke={selected === r.muscle ? "#f8fafc" : "#0f172a"}
              strokeWidth="1"
              className={
                (volumes[r.muscle] ?? 0) >= 9
                  ? "motion-safe:animate-pulse"
                  : "transition-colors duration-500"
              }
            >
              <title>{getMuscleGroupLabel(r.muscle)}</title>
            </path>
          ))}
      </svg>
      <p className="text-center text-xs text-slate-300">
        {getMuscleGroupLabel(selected)} · {volumes[selected] ?? 0} séries equiv.{" "}
        {(volumes[selected] ?? 0) >= 9 && "⚠ Volume elevado"}
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
        0 neutro · 1–3 ciano · 4–8 laranja · 9+ violeta. Grupos ilustrativos:
        principais ×1, secundários ×0,5. Cor representa volume planejado, sem
        EMG ou esforço medido.
      </p>
    </div>
  );
}
