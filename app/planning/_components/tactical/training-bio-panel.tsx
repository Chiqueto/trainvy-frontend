"use client";
import { Tabs } from "radix-ui";
import { Activity, Brain, Radar } from "lucide-react";
import { TelemetryHeader } from "./telemetry-header";
import { useState } from "react";
import { BodyHeatmapSVG } from "./body-heatmap-svg";
import { AttributeRadarChart } from "./attribute-radar-chart";
import { NeuralDemandPanel } from "./neural-demand-panel";
import { TacticalSheet } from "./tactical-sheet";
import type { telemetry } from "../../_lib/tactical";

export function TrainingBioDetails({
  data,
}: {
  data: ReturnType<typeof telemetry>;
}) {
  return (
    <Tabs.Root defaultValue="muscles" className="space-y-5">
      <Tabs.List
        aria-label="Análise da ficha"
        className="sticky top-0 z-10 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-slate-950 p-1 shadow-lg"
      >
        {[
          { key: "muscles", label: "Músculos", Icon: Activity },
          { key: "neural", label: "SNC", Icon: Brain },
          { key: "attributes", label: "Atributos", Icon: Radar },
        ].map(({ key, label, Icon }) => (
          <Tabs.Trigger
            key={key}
            value={key}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 data-[state=active]:bg-cyan-300/10 data-[state=active]:text-cyan-100"
          >
            <Icon size={15} />
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content value="muscles" className="outline-none">
        <BodyHeatmapSVG volumes={data.muscles} />
      </Tabs.Content>
      <Tabs.Content value="neural" className="outline-none">
        <NeuralDemandPanel data={data} />
      </Tabs.Content>
      <Tabs.Content value="attributes" className="outline-none">
        <AttributeRadarChart values={data.attributes} />
      </Tabs.Content>
    </Tabs.Root>
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
        className="flex h-9 shrink-0 items-center rounded-full border border-cyan-300/15 bg-cyan-300/5 px-2 sm:px-3"
      >
        <span className="text-xs text-cyan-200 lg:hidden">
          SNC {data.neural} pts
        </span>
        <span className="hidden lg:block">
          <TelemetryHeader compact data={data} />
        </span>
      </button>
      <TacticalSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Mapa muscular e atributos"
        description="Explore os músculos, a composição da demanda do SNC e os atributos estimados da ficha."
      >
        <TrainingBioDetails data={data} />
      </TacticalSheet>
    </>
  );
}
