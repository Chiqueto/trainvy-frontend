"use client";
import { useId, useState } from "react";
import {
  getMuscleGroupLabel,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";

type Region = {
  muscle: MuscleGroup;
  views: ("front" | "back")[];
  paths: string[];
};
// Symmetric, schematic surface regions. The map illustrates catalog groups, not EMG.
const regions: Region[] = [
  {
    muscle: "SHOULDERS",
    views: ["front", "back"],
    paths: ["M70 77 Q55 74 49 88 Q44 98 49 110 L61 112 Q64 94 76 88 Z"],
  },
  {
    muscle: "CHEST",
    views: ["front"],
    paths: [
      "M80 80 Q88 77 97 80 L97 113 Q87 122 67 114 L65 101 Q69 88 80 80 Z",
    ],
  },
  {
    muscle: "BICEPS",
    views: ["front"],
    paths: ["M49 113 Q55 113 61 118 L57 145 Q52 158 43 153 L42 140 Z"],
  },
  {
    muscle: "TRICEPS",
    views: ["front"],
    paths: ["M40 111 L46 111 40 148 36 150 Q35 133 40 111 Z"],
  },
  {
    muscle: "TRICEPS",
    views: ["back"],
    paths: ["M48 112 Q56 111 62 119 L57 145 Q51 158 41 151 L42 129 Z"],
  },
  {
    muscle: "FOREARMS",
    views: ["front", "back"],
    paths: [
      "M42 160 Q48 159 54 157 Q51 181 40 202 L35 214 29 211 Q31 185 42 160 Z",
      "M40 163 L33 191 29 208 26 205 Q26 183 36 164 Z",
    ],
  },
  {
    muscle: "CORE",
    views: ["front"],
    paths: [
      "M87 124 L97 123 97 138 85 138 Z",
      "M85 143 L97 143 97 157 85 157 Z",
      "M86 162 L97 162 97 179 89 178 Z",
      "M90 184 L97 184 97 197 94 198 Z",
      "M66 121 L80 128 79 157 86 186 74 177 Q68 155 66 121 Z",
    ],
  },
  {
    muscle: "BACK",
    views: ["back"],
    paths: [
      "M90 65 L97 69 97 110 Q82 100 74 84 L78 76 Z",
      "M66 101 Q79 111 94 117 L86 143 79 172 Q68 159 65 129 Z",
      "M90 119 L97 117 97 190 88 184 86 164 Z",
    ],
  },
  {
    muscle: "HIP_FLEXORS",
    views: ["front"],
    paths: ["M76 184 L89 193 97 209 93 217 79 201 Z"],
  },
  {
    muscle: "HIP_ABDUCTORS",
    views: ["front", "back"],
    paths: ["M72 185 L76 196 72 215 66 231 Q63 205 72 185 Z"],
  },
  {
    muscle: "GLUTES",
    views: ["back"],
    paths: ["M78 188 Q88 188 97 198 L97 226 Q85 241 72 226 L71 209 Z"],
  },
  {
    muscle: "QUADRICEPS",
    views: ["front"],
    paths: [
      "M75 217 Q85 220 88 235 L85 277 Q81 292 73 286 Q66 265 69 240 Z",
      "M90 226 L96 221 94 273 Q94 288 87 295 L83 288 90 264 Z",
    ],
  },
  {
    muscle: "ADDUCTORS",
    views: ["front"],
    paths: ["M91 207 L99 217 96 251 90 264 88 237 Z"],
  },
  {
    muscle: "ADDUCTORS",
    views: ["back"],
    paths: ["M95 237 L99 235 96 269 90 280 91 251 Z"],
  },
  {
    muscle: "HAMSTRINGS",
    views: ["back"],
    paths: [
      "M72 235 Q81 240 86 237 L87 271 82 291 74 288 Q68 261 72 235 Z",
      "M90 236 L96 232 94 268 88 294 84 289 90 265 Z",
    ],
  },
  {
    muscle: "CALVES",
    views: ["back"],
    paths: [
      "M76 307 Q82 303 86 309 Q94 327 84 349 L79 353 73 339 Q68 320 76 307 Z",
      "M89 305 L94 307 Q97 330 88 345 L86 337 Z",
    ],
  },
  {
    muscle: "CALVES",
    views: ["front"],
    paths: ["M88 309 L93 309 Q98 328 88 346 L85 341 Z"],
  },
  {
    muscle: "TIBIALIS_ANTERIOR",
    views: ["front"],
    paths: ["M74 309 Q79 305 83 312 L79 350 80 381 74 385 70 351 Z"],
  },
];
const torso =
  "M89 61 Q100 65 111 61 L113 70 Q124 73 131 78 L139 99 135 130 Q129 161 127 179 Q139 199 134 220 L119 235 100 239 81 235 66 220 Q61 199 73 179 Q71 161 65 130 L61 99 69 78 Q76 73 87 70 Z";
const arm =
  "M58 80 Q45 80 41 99 L35 125 Q32 140 36 157 L26 185 23 210 19 221 Q16 228 20 235 L24 234 26 224 25 239 29 240 32 225 31 239 35 238 39 221 44 216 Q47 212 43 208 L42 205 Q53 182 57 159 L63 136 66 115 72 96 Z";
const leg =
  "M74 209 Q86 207 98 221 L96 265 93 294 Q97 306 97 320 Q98 338 89 360 L87 388 93 402 Q96 409 90 413 L72 413 Q66 412 67 407 L73 393 69 359 Q65 338 68 319 L70 300 Q64 280 64 259 Q62 234 74 209 Z";
const format = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
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
  const id = useId().replaceAll(":", "");
  const [view, setView] = useState<"front" | "back">("front"),
    [selected, setSelected] = useState<MuscleGroup>("CHEST");
  const visible = regions.filter((region) => region.views.includes(view));
  const selectedKey = visible.some((region) => region.muscle === selected)
    ? selected
    : (visible.find((region) => (volumes[region.muscle] ?? 0) > 0)?.muscle ??
      visible[0].muscle);
  const volume = volumes[selectedKey] ?? 0;
  const activeGroups = Object.entries(volumes)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Volume por músculo
        </p>
        <div
          role="group"
          aria-label="Vista do corpo"
          className="flex rounded-xl border border-white/10 bg-slate-950/60 p-1"
        >
          {(
            [
              ["front", "Frente"],
              ["back", "Costas"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`min-h-9 rounded-lg px-3 text-xs font-medium ${view === key ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_40%,#153144_0%,#0b1521_68%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(#67e8f906_1px,transparent_1px),linear-gradient(90deg,#67e8f906_1px,transparent_1px)] [background-size:24px_24px]" />
        <span className="absolute left-4 top-3 text-[10px] uppercase tracking-[0.2em] text-cyan-200/50">
          {view === "front" ? "Vista anterior" : "Vista posterior"}
        </span>
        <svg
          viewBox="0 0 200 430"
          className="relative mx-auto h-[320px] w-[180px] sm:h-[350px] sm:w-[196px]"
          role="group"
          aria-label={view === "front" ? "Mapa frontal" : "Mapa posterior"}
        >
          <defs>
            <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#17293a" />
              <stop offset=".5" stopColor="#2b4154" />
              <stop offset="1" stopColor="#142536" />
            </linearGradient>
            <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="white" stopOpacity=".16" />
              <stop offset=".48" stopColor="white" stopOpacity="0" />
              <stop offset="1" stopColor="#020617" stopOpacity=".3" />
            </linearGradient>
            <filter id={`${id}-glow`}>
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          <ellipse
            cx="100"
            cy="416"
            rx="42"
            ry="5"
            fill="#030812"
            opacity=".7"
          />
          <g fill={`url(#${id}-body)`} stroke="#4e6b80" strokeWidth=".8">
            <path d={torso} />
            <path d={arm} />
            <path d={arm} transform="translate(200 0) scale(-1 1)" />
            <path d={leg} />
            <path d={leg} transform="translate(200 0) scale(-1 1)" />
            <path d="M87 21 Q100 11 113 21 L115 38 111 52 105 58 95 58 89 52 85 38 Z" />
            <path d="M85 32 Q80 29 82 40 L87 45 M115 32 Q120 29 118 40 L113 45" />
          </g>
          <g fill="none" stroke="#7292a6" strokeOpacity=".38" strokeWidth=".8">
            <path
              d={
                view === "front"
                  ? "M91 46 Q100 51 109 46 M92 58 91 69 M108 58 109 69 M74 76 Q86 73 98 78 M102 78 Q114 73 126 76 M100 82 100 199"
                  : "M93 58 96 68 M107 58 104 68 M100 72 100 190 M77 88 Q79 108 91 116 M123 88 Q121 108 109 116"
              }
            />
            <path d="M73 297 Q81 291 90 297 L90 304 Q81 309 73 304 Z M78 354 79 389 M25 217 35 220 M74 397 86 397" />
            <path
              d="M73 297 Q81 291 90 297 L90 304 Q81 309 73 304 Z M78 354 79 389 M25 217 35 220 M74 397 86 397"
              transform="translate(200 0) scale(-1 1)"
            />
          </g>
          {visible.map((region) => {
            const selected = selectedKey === region.muscle;
            const amount = volumes[region.muscle] ?? 0;
            return (
              <g
                key={region.muscle}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${getMuscleGroupLabel(region.muscle)}: ${format(amount)} séries equivalentes`}
                onClick={() => setSelected(region.muscle)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(region.muscle);
                  }
                }}
                className="cursor-pointer outline-none [&:focus-visible_path]:stroke-white [&:focus-visible_path]:stroke-[2]"
              >
                <title>{getMuscleGroupLabel(region.muscle)}</title>
                {[false, true].map((mirror) => (
                  <g
                    key={String(mirror)}
                    transform={
                      mirror ? "translate(200 0) scale(-1 1)" : undefined
                    }
                  >
                    {region.paths.map((path, index) => (
                      <g key={index}>
                        <path
                          d={path}
                          fill={
                            amount > 0 ? heatColor(amount) : `url(#${id}-body)`
                          }
                          stroke={
                            selected
                              ? "#e2f8ff"
                              : amount > 0
                                ? "#bcefff66"
                                : "#56778f77"
                          }
                          strokeWidth={selected ? 1.3 : 0.8}
                        />
                        <path
                          d={path}
                          fill={`url(#${id}-sheen)`}
                          pointerEvents="none"
                        />
                      </g>
                    ))}
                  </g>
                ))}
              </g>
            );
          })}
          <g
            fill="none"
            stroke="#ccecff"
            strokeOpacity=".12"
            strokeWidth=".7"
            pointerEvents="none"
          >
            {[false, true].map((mirror) => (
              <g
                key={String(mirror)}
                transform={mirror ? "translate(200 0) scale(-1 1)" : undefined}
              >
                <path
                  d={
                    view === "front"
                      ? "M70 100 Q82 105 95 102 M72 109 Q85 114 95 108 M53 121 47 146 M75 231 78 272 M78 315 75 350"
                      : "M82 85 94 100 M70 120 83 144 M77 203 Q86 214 94 217 M77 245 78 276 M78 314 80 337"
                  }
                />
              </g>
            ))}
          </g>
        </svg>
        <div
          aria-live="polite"
          className="relative mx-3 mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5"
        >
          <span className="text-sm font-medium text-white">
            {getMuscleGroupLabel(selectedKey)}
          </span>
          <span className="text-right font-mono text-sm text-cyan-100">
            {format(volume)}{" "}
            <span className="font-sans text-xs text-slate-400">
              séries equiv.
            </span>
          </span>
        </div>
      </div>
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-400"
        aria-label="Legenda de volume"
      >
        {[
          ["Neutro", "0", 0],
          ["Ativo", "< 4", 1],
          ["Moderado", "4 a < 9", 4],
          ["Elevado", "9+", 9],
        ].map(([label, range, amount]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: heatColor(Number(amount)) }}
            />
            {label}
            <span className="ml-auto font-mono text-[11px] text-slate-500">
              {range}
            </span>
          </div>
        ))}
      </div>
      {activeGroups.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <p className="mb-2 text-xs text-slate-400">
            Grupos presentes na ficha
          </p>
          <div className="flex flex-wrap gap-2">
            {activeGroups.map(([muscle, amount]) => (
              <button
                type="button"
                key={muscle}
                onClick={() => {
                  const match = regions.find(
                    (region) => region.muscle === muscle,
                  );
                  if (match) {
                    setSelected(match.muscle);
                    if (!match.views.includes(view)) setView(match.views[0]);
                  }
                }}
                className={`min-h-9 rounded-lg border px-2.5 text-xs ${selectedKey === muscle ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
              >
                {getMuscleGroupLabel(muscle)}{" "}
                <span className="ml-1 font-mono text-slate-400">
                  {format(amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs leading-relaxed text-slate-500">
        Toque nos músculos ou nos nomes para explorar. Séries principais ×1 e
        secundárias ×0,5. Cores representam volume planejado ilustrativo, sem
        medição de ativação muscular.
      </p>
    </div>
  );
}
