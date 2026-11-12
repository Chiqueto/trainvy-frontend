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
  screenToBoard,
} from "@/app/planning/_components/tactical/spatial-utils";
import { EnergyLinksSvg } from "@/app/planning/_components/tactical/energy-links-svg";
import { SpatialCanvas } from "@/app/planning/_components/tactical/spatial-canvas";
import { HoloExerciseCard } from "@/app/planning/_components/tactical/holo-exercise-card";
import { PlayerHand } from "@/app/planning/_components/tactical/player-hand";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";

describe("Holo-Board 3D Spatial Utils", () => {
  it("keeps mobile cards spaced horizontally instead of stacking under the deck", () => {
    const points = generateTacticalFormation(4, 390, 844);
    expect(points[0].x).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].x - points[i - 1].x).toBeGreaterThan(CARD_WIDTH);
      expect(Math.abs(points[i].y - points[0].y)).toBeLessThan(50);
    }
  });

  it("maps pointer movement to board coordinates at different zoom levels", () => {
    const rect = { left: 20, top: 30, width: 1000, height: 800 };
    const camera = { panX: 50, panY: -20, zoom: 0.5, tilt: 0 };
    expect(screenToBoard({ x: 570, y: 410 }, rect, camera)).toEqual({
      x: 500,
      y: 400,
    });
    expect(screenToBoard({ x: 620, y: 460 }, rect, camera)).toEqual({
      x: 600,
      y: 500,
    });
  });
  it("computes accurate IN (top) and OUT (bottom) card connectors", () => {
    const conn = getCardConnectors(100, 200);
    expect(conn.input).toEqual({ x: 100 + CARD_WIDTH / 2, y: 200 });
    expect(conn.output).toEqual({
      x: 100 + CARD_WIDTH / 2,
      y: 200 + CARD_HEIGHT,
    });
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
  it("pans by incremental pointer movement without accelerating", () => {
    const onPan = vi.fn();
    const { container } = render(
      <SpatialCanvas
        camera={{ panX: 0, panY: 0, zoom: 1, tilt: 0 }}
        onPan={onPan}
        onZoom={vi.fn()}
      >
        <div />
      </SpatialCanvas>,
    );
    fireEvent.pointerDown(container.firstChild as HTMLElement, {
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(window, { clientX: 110, clientY: 105 });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 110 });
    fireEvent.pointerUp(window);
    expect(onPan.mock.calls).toEqual([
      [10, 5],
      [10, 5],
    ]);
  });

  it("makes exercises beyond the first 18 reachable and resets pagination when searching", () => {
    const onSummon = vi.fn();
    const catalog: ListExercises200Item[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: `exercise-${i}`,
        name: `Exercício ${i}`,
        ownerUserId: null,
        hasMedia: false,
        muscles: [],
      }),
    );
    render(<PlayerHand catalog={catalog} onSummonExercise={onSummon} />);
    for (let i = 0; i < 3; i++)
      fireEvent.click(
        screen.getByRole("button", { name: "Próxima página de exercícios" }),
      );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Adicionar Exercício 19",
      }),
    );
    expect(onSummon).toHaveBeenCalledWith(catalog[19]);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar exercícios no deck" }),
      { target: { value: "Exercicio 0" } },
    );
    expect(
      screen.getByRole("button", {
        name: "Adicionar Exercício 0",
      }),
    ).toBeDefined();
    expect(
      (
        screen.getByRole("button", {
          name: "Página anterior de exercícios",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
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
    expect((container.firstChild as HTMLElement).style.perspective).toBe(
      "1200px",
    );
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
        muscles: [
          { id: "ex-1-shoulders", muscleGroup: "SHOULDERS", role: "PRIMARY" },
        ],
      },
      {
        id: "ex-2",
        name: "Elevação Lateral",
        ownerUserId: null,
        hasMedia: false,
        muscles: [
          { id: "ex-2-shoulders", muscleGroup: "SHOULDERS", role: "PRIMARY" },
        ],
      },
    ];

    render(<PlayerHand catalog={mockCatalog} onSummonExercise={onSummon} />);

    // Cartas no leque
    expect(screen.getByText("Desenvolvimento Militar")).toBeDefined();
    expect(screen.getByText("Elevação Lateral")).toBeDefined();

    // Invocação ao clicar
    fireEvent.click(screen.getByText("Desenvolvimento Militar"));
    expect(onSummon).toHaveBeenCalled();
  });
});
