import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  getCardConnectors,
  calculateBezierCurve,
  distance,
  checkMagneticFusion,
  generateTacticalFormation,
} from "@/app/planning/_components/tactical/spatial-utils";
import { EnergyLinksSvg } from "@/app/planning/_components/tactical/energy-links-svg";
import { SpatialCanvas } from "@/app/planning/_components/tactical/spatial-canvas";
import { HoloExerciseCard } from "@/app/planning/_components/tactical/holo-exercise-card";
import { PlayerHand } from "@/app/planning/_components/tactical/player-hand";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";

describe("Holo-Board 3D Spatial Utils", () => {
  it("computes accurate IN (top) and OUT (bottom) card connectors", () => {
    const conn = getCardConnectors(100, 200);
    expect(conn.input).toEqual({ x: 100 + CARD_WIDTH / 2, y: 200 });
    expect(conn.output).toEqual({ x: 100 + CARD_WIDTH / 2, y: 200 + CARD_HEIGHT });
  });

  it("calculates a smooth cubic Bezier path with midpoint between cards", () => {
    const from = { x: 100, y: 200 };
    const to = { x: 300, y: 500 };
    const { path, midpoint } = calculateBezierCurve(from, to);

    expect(path).toMatch(/^M 100 200 C/);
    expect(path).toContain("300 500");
    expect(midpoint.x).toBeGreaterThan(100);
    expect(midpoint.x).toBeLessThan(300);
    expect(midpoint.y).toBeGreaterThan(200);
    expect(midpoint.y).toBeLessThan(500);
  });

  it("calculates Euclidean distance accurately", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("detects magnetic proximity for Bi-Set Fusion (< 50px)", () => {
    const cardA = { x: 100, y: 200 };
    // Carta próxima lateralmente
    const closeCard = { x: 100 + CARD_WIDTH + 10, y: 205 };
    // Carta distante
    const farCard = { x: 600, y: 800 };

    expect(checkMagneticFusion(closeCard, cardA)).toBe(true);
    expect(checkMagneticFusion(farCard, cardA)).toBe(false);
  });

  it("generates tactical formations: arc for <=4 cards and zigzag for 5+ cards", () => {
    const arc = generateTacticalFormation(3, 1400, 900);
    expect(arc).toHaveLength(3);
    expect(arc[1].y).toBeLessThan(arc[0].y); // Ponto central elevado em arco parabólico

    const zigzag = generateTacticalFormation(6, 1400, 900);
    expect(zigzag).toHaveLength(6);
    expect(zigzag[0].x).toBeDefined();
    expect(zigzag[5].y).toBeGreaterThan(zigzag[0].y);
  });
});

describe("Holo-Board 3D Components", () => {
  it("renders the 3D perspective spatial canvas with volumetric lighting and grid", () => {
    const onPan = vi.fn();
    const onZoom = vi.fn();

    const { container } = render(
      <SpatialCanvas
        camera={{ panX: 50, panY: -20, zoom: 1.1, tilt: 22 }}
        onPan={onPan}
        onZoom={onZoom}
      >
        <div data-testid="test-child">Child on Board</div>
      </SpatialCanvas>,
    );

    expect(screen.getByTestId("test-child")).toBeDefined();
    // Verifica se a perspectiva de 1200px foi aplicada
    expect((container.firstChild as HTMLElement).style.perspective).toBe("1200px");
  });

  it("renders energy links SVG with animated Bezier curves and connection HUDs", () => {
    const connections = [
      {
        fromIndex: 0,
        toIndex: 1,
        fromPoint: { x: 100, y: 300 },
        toPoint: { x: 400, y: 300 },
        restTimeSeconds: 90,
      },
    ];

    render(<EnergyLinksSvg connections={connections} />);
    expect(screen.getByText("90s")).toBeDefined();
  });

  it("renders HoloExerciseCard with Yu-Gi-Oh rarity frame, order badge, and ATK/DEF controls", () => {
    const onPositionChange = vi.fn();
    const onChange = vi.fn();
    const onRemove = vi.fn();
    const onStartWirePull = vi.fn();

    render(
      <HoloExerciseCard
        item={{
          name: "Supino Inclinado",
          sets: 4,
          reps: 10,
          restTimeInSeconds: 75,
          runes: ["DROP_SET"],
          runeConfig: { DROP_SET: 2 },
        }}
        index={0}
        orderLabel="01"
        x={150}
        y={200}
        demand="high"
        muscle="Peitoral Superior"
        onPositionChange={onPositionChange}
        onChange={onChange}
        onRemove={onRemove}
        onStartWirePull={onStartWirePull}
      />,
    );

    // Badge de Ordem #01
    expect(screen.getByText("#01")).toBeDefined();
    // Estrelas de raridade para high CNS demand
    expect(screen.getByText("★★★")).toBeDefined();
    // Nome do exercício
    expect(screen.getByText("Supino Inclinado")).toBeDefined();
    // Tag muscular
    expect(screen.getByText("Peitoral Superior")).toBeDefined();
    // Séries (4 sets)
    expect(screen.getByText("4")).toBeDefined();
    // Runa equipada Drop-set
    expect(screen.getByText(/Drop-set 2x/)).toBeDefined();
  });

  it("renders PlayerHand floating fan deck and allows invoking exercises onto the board", () => {
    const onSummon = vi.fn();
    const mockCatalog: ListExercises200Item[] = [
      {
        id: "ex-1",
        name: "Desenvolvimento Militar",
        ownerUserId: null,
        hasMedia: false,
        muscles: [{ muscleGroup: "SHOULDERS", role: "PRIMARY" }],
      },
      {
        id: "ex-2",
        name: "Elevação Lateral",
        ownerUserId: null,
        hasMedia: false,
        muscles: [{ muscleGroup: "SHOULDERS", role: "PRIMARY" }],
      },
    ];

    render(
      <PlayerHand catalog={mockCatalog} onSummonExercise={onSummon} />,
    );

    // Cartas no leque
    expect(screen.getByText("Desenvolvimento Militar")).toBeDefined();
    expect(screen.getByText("Elevação Lateral")).toBeDefined();

    // Invocação ao clicar
    fireEvent.click(screen.getByText("Desenvolvimento Militar"));
    expect(onSummon).toHaveBeenCalled();
  });
});

