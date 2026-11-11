import { TelemetryHeader } from "./telemetry-header";
import { useState } from "react";
import { BodyHeatmapSVG } from "./body-heatmap-svg";
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
      <div className="mt-3 border-t border-white/10 pt-3 [&_svg]:max-h-[min(25dvh,200px)]">
        <p className="text-center text-[10px] uppercase tracking-widest text-zinc-500">
          Perfil do treino
        </p>
        <AttributeRadarChart values={data.attributes} />
        <p className="text-center text-[9px] text-zinc-500">
          Estimativas de planejamento · sem medição fisiológica.
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
        className="flex shrink-0 items-center h-9 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3"
      >
        <span className="text-[10px] text-cyan-200 sm:hidden">
          ⚡ {data.neural}%
        </span>
        <span className="hidden sm:block">
          <TelemetryHeader compact data={data} />
        </span>
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
