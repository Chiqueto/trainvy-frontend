import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { TrainingBioDetails } from "@/app/planning/_components/tactical/training-bio-panel";
import { BodyHeatmapSVG } from "@/app/planning/_components/tactical/body-heatmap-svg";
import { AttributeRadarChart } from "@/app/planning/_components/tactical/attribute-radar-chart";
import { TelemetryHeader } from "@/app/planning/_components/tactical/telemetry-header";
import { telemetry } from "@/app/planning/_lib/tactical";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import type { WorkoutPlanDraftExercise } from "@/app/planning/_lib/workout-plan-builder";
const catalog: ListExercises200Item[] = [
  {
    id: "bench",
    name: "Supino com barra",
    ownerUserId: null,
    hasMedia: false,
    muscles: [
      { id: "chest", muscleGroup: "CHEST", role: "PRIMARY" },
      { id: "triceps", muscleGroup: "TRICEPS", role: "SECONDARY" },
    ],
  },
  {
    id: "curl",
    name: "Rosca direta",
    ownerUserId: null,
    hasMedia: false,
    muscles: [{ id: "biceps", muscleGroup: "BICEPS", role: "PRIMARY" }],
  },
];
const items: WorkoutPlanDraftExercise[] = [
  {
    name: "Supino com barra",
    exerciseId: "bench",
    sets: 2,
    reps: 10,
    restTimeInSeconds: 75,
    runes: ["REST_PAUSE", "TEMPO_CONTROL"],
  },
  {
    name: "Rosca direta",
    exerciseId: "curl",
    sets: 3,
    reps: 10,
    restTimeInSeconds: 75,
  },
  { name: "Movimento livre", sets: 1, reps: 10, restTimeInSeconds: 75 },
];
describe("Training analysis panel", () => {
  it("explains the existing neural index without changing its calculation or hiding unclassified exercises", () => {
    const data = telemetry(items, catalog);
    expect(data.neural).toBe(27);
    expect(data.neuralBreakdown.base).toBe(23);
    expect(data.neuralBreakdown.techniques).toBe(4);
    expect(data.neuralBreakdown.sources).toEqual([
      { name: "Supino com barra", sets: 2, demand: "high", points: 18.2 },
      { name: "Rosca direta", sets: 3, demand: "low", points: 6 },
      { name: "Movimento livre", sets: 1, demand: "unknown", points: 3 },
    ]);
    expect(data.neuralBreakdown.base + data.neuralBreakdown.techniques).toBe(
      data.neural,
    );
    expect(telemetry([], catalog).neuralBreakdown).toEqual({
      base: 0,
      techniques: 0,
      sources: [],
    });
  });
  it("lets the reader switch between a large muscle map, neural contributors and readable attribute values", () => {
    render(<TrainingBioDetails data={telemetry(items, catalog)} />);
    expect(screen.getByRole("group", { name: "Mapa frontal" })).toBeDefined();
    fireEvent.keyDown(screen.getByRole("tab", { name: "SNC" }), {
      key: "Enter",
    });
    const panel = screen.getByRole("tabpanel", { name: "SNC" });
    expect(within(panel).getByText("Base dos exercícios")).toBeDefined();
    expect(within(panel).getByText("Técnicas aplicadas")).toBeDefined();
    expect(within(panel).getByText("Movimento livre")).toBeDefined();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Atributos" }), {
      key: "Enter",
    });
    const attributes = screen.getByRole("tabpanel", { name: "Atributos" });
    expect(
      within(attributes).getByRole("img").getAttribute("aria-label"),
    ).toContain("Força:");
    expect(within(attributes).getAllByRole("definition")).toHaveLength(5);
    expect(
      within(attributes)
        .getAllByRole("term")
        .map((node) => node.textContent),
    ).toEqual([
      "Força",
      "Explosão",
      "Hipertrofia",
      "Metabólico",
      "Estabilidade",
    ]);
  });
  it("switches to the posterior surface when selecting a posterior group and supports keyboard selection", () => {
    render(<BodyHeatmapSVG volumes={{ CHEST: 3, GLUTES: 1.5 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Glúteos 1,5" }));
    const posterior = screen.getByRole("group", { name: "Mapa posterior" });
    const glutes = within(posterior).getByRole("button", {
      name: "Glúteos: 1,5 séries equivalentes",
    });
    expect(glutes.getAttribute("aria-pressed")).toBe("true");
    const hamstrings = within(posterior).getByRole("button", {
      name: "Posteriores: 0 séries equivalentes",
    });
    fireEvent.keyDown(hamstrings, { key: "Enter" });
    expect(hamstrings.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Frente" }));
    expect(screen.getByRole("group", { name: "Mapa frontal" })).toBeDefined();
  });
  it("keeps the chart and numeric summaries consistent for empty or invalid values", () => {
    render(
      <AttributeRadarChart
        values={{
          strength: NaN,
          power: -2,
          hypertrophy: 20,
          metabolic: 0,
          stability: 5,
        }}
      />,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "Força: 0,0 de 10, Explosão: 0,0 de 10, Hipertrofia: 10,0 de 10, Metabólico: 0,0 de 10, Estabilidade: 5,0 de 10",
    );
    expect(
      within(screen.getByLabelText("Valores dos atributos"))
        .getAllByRole("definition")
        .map((node) => node.textContent),
    ).toEqual(["0,0/10", "0,0/10", "10,0/10", "0,0/10", "5,0/10"]);
  });
  it("labels the neural index as points in compact summaries instead of a physiological percentage", () => {
    render(<TelemetryHeader data={telemetry(items, catalog)} compact />);
    expect(
      screen.getByLabelText(/^Estimativa: SNC 27 pontos, [0-9]+ minutos$/),
    ).toBeDefined();
    expect(screen.queryByText("27%")).toBeNull();
  });
});
