import { useState } from "react";
import { BodyHeatmapSVG, heatColor } from "./body-heatmap-svg";
import { AttributeRadarChart } from "./attribute-radar-chart";
import { TacticalSheet } from "./tactical-sheet";
import type { telemetry } from "../../_lib/tactical";

export function TrainingBioDetails({
  data,
}: {
  data: ReturnType<typeof telemetry>;
}) {
  return (
    <>
      <BodyHeatmapSVG volumes={data.muscles} />
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-center text-[10px] uppercase tracking-widest text-zinc-500">
          Perfil do treino
        </p>
        <AttributeRadarChart values={data.attributes} />
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Atributos, volume e custo SNC são estimativas de planejamento, sem
          medição fisiológica.
        </p>
      </div>
    </>
  );
}
export function TrainingBioPanel({
  data,
}: {
  data: ReturnType<typeof telemetry>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Ver mapa muscular e atributos"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center rounded-xl border border-cyan-300/15 bg-cyan-300/5"
      >
        <svg viewBox="0 0 48 48" className="size-12" aria-hidden="true">
          <circle cx="24" cy="7" r="4" fill="#52525b" />
          <path
            d="M18 13H30L36 29H32L29 20 30 32 28 45H24L23 33 22 45H18L17 32 19 20 16 29H12Z"
            fill="#27272a"
            stroke="#52525b"
          />
          <path
            d="M18 14H30V22H18Z"
            fill={heatColor(data.muscles.CHEST ?? 0)}
          />
          <path d="M20 23H28V30H20Z" fill={heatColor(data.muscles.CORE ?? 0)} />
          <path
            d="M18 32H23V41H18Z M25 32H30V41H25Z"
            fill={heatColor(data.muscles.QUADRICEPS ?? 0)}
          />
        </svg>
        <div
          className="size-12 overflow-hidden [&_svg]:h-12 [&_svg]:w-12"
          aria-hidden="true"
        >
          <AttributeRadarChart values={data.attributes} />
        </div>
      </button>
      <TacticalSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Mapa muscular e atributos"
        description="Volume planejado do treino atual. Toque nos grupos para ver detalhes."
      >
        <TrainingBioDetails data={data} />
      </TacticalSheet>
    </>
  );
}
