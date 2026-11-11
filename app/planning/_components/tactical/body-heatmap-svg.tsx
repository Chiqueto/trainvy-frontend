import { useState } from "react";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
const regions = [
  {
    muscle: "CHEST",
    d: "M44 44 Q53 39 64 44 L63 57 Q53 62 44 55 Z",
    back: false,
  },
  {
    muscle: "CHEST",
    d: "M68 44 Q79 39 88 44 L88 55 Q79 62 69 57 Z",
    back: false,
  },
  {
    muscle: "BACK",
    d: "M45 44 Q55 38 64 43 L64 58 58 80 Q48 72 45 44 Z M68 43 Q77 38 87 44 Q84 72 74 80 L68 58 Z",
    back: true,
  },
  { muscle: "SHOULDERS", d: "M43 40 Q30 40 29 58 L40 60 45 46 Z", back: null },
  {
    muscle: "SHOULDERS",
    d: "M89 40 Q102 40 103 58 L92 60 87 46 Z",
    back: null,
  },
  {
    muscle: "BICEPS",
    d: "M29 61 Q35 57 40 63 Q39 77 33 84 L25 80 Q26 69 29 61 Z M92 63 Q97 57 103 61 Q106 69 107 80 L99 84 Q93 77 92 63 Z",
    back: false,
  },
  {
    muscle: "TRICEPS",
    d: "M29 61 Q35 57 40 63 Q39 77 33 84 L25 80 Q26 69 29 61 Z M92 63 Q97 57 103 61 Q106 69 107 80 L99 84 Q93 77 92 63 Z",
    back: true,
  },
  {
    muscle: "FOREARMS",
    d: "M24 84 L34 87 28 110 20 108 Z M98 87 L108 84 112 108 104 110 Z",
    back: null,
  },
  {
    muscle: "CORE",
    d: "M56 63 L64 63 64 71 56 70 Z M68 63 L76 63 76 70 68 71 Z M56 73 L64 74 64 81 57 80 Z M68 74 L76 73 75 80 68 81 Z M57 83 L64 84 64 91 59 89 Z M68 84 L75 83 73 89 68 91 Z M46 60 L53 64 55 87 50 83 Z M79 64 L86 60 82 83 77 87 Z",
    back: false,
  },
  {
    muscle: "GLUTES",
    d: "M51 90 Q59 86 65 94 L64 110 Q54 118 47 108 Z M67 94 Q73 86 81 90 L85 108 Q78 118 68 110 Z",
    back: true,
  },
  {
    muscle: "QUADRICEPS",
    d: "M49 97 Q58 96 61 104 L59 134 Q55 146 49 140 Q43 119 49 97 Z M71 104 Q74 96 83 97 Q89 119 83 140 Q77 146 73 134 Z",
    back: false,
  },
  {
    muscle: "HAMSTRINGS",
    d: "M48 115 Q56 119 63 116 L60 137 Q54 147 48 140 Z M69 116 Q76 119 84 115 L84 140 Q78 147 72 137 Z",
    back: true,
  },
  {
    muscle: "ADDUCTORS",
    d: "M60 100 L65 100 63 134 59 136 Z M67 100 L72 100 73 136 69 134 Z",
    back: false,
  },
  {
    muscle: "CALVES",
    d: "M49 149 Q55 145 60 150 Q63 165 56 177 L51 180 Q46 164 49 149 Z M72 150 Q77 145 83 149 Q86 164 81 180 L76 177 Q69 165 72 150 Z",
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
        className="mx-auto h-[min(32dvh,260px)]"
        role="group"
        aria-label={back ? "Mapa posterior" : "Mapa frontal"}
      >
        <circle cx="66" cy="22" r="13" fill="#475569" />
        <path
          d="M59 34 Q66 38 73 34 L76 40 Q95 37 102 51 Q108 64 108 80 L116 109 Q116 118 109 118 L101 110 92 83 Q90 77 88 72 L84 91 Q90 113 88 137 L85 155 83 183 88 190 Q79 195 71 190 L69 160 66 139 63 160 61 190 Q53 195 44 190 L49 183 47 155 44 137 Q42 113 48 91 L44 72 Q42 77 40 83 L31 110 23 118 Q16 118 16 109 L24 80 Q24 64 30 51 Q37 37 56 40 Z"
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
      <div
        className="mt-3 flex justify-center gap-2 text-[9px] text-slate-400"
        title="Volume planejado: 0, 1–3, 4–8 e 9+ séries equivalentes. Grupos ilustrativos, sem EMG medido."
      >
        {["Neutro", "Ativo", "Moderado", "Elevado"].map((label, i) => (
          <span key={label} className="flex items-center gap-1">
            <span
              className="size-1.5 rounded-full"
              style={{ background: heatColor([0, 1, 4, 9][i]) }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
