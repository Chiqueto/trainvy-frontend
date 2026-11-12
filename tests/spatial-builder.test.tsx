import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
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
import { SpatialBuilderArena } from "@/app/planning/_components/tactical/spatial-builder-arena";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { patchExercise, toggleRune } from "@/app/planning/_lib/tactical";
import type {
  WorkoutPlanDraftExercise,
  WorkoutPlanDraftDay,
} from "@/app/planning/_lib/workout-plan-builder";

const catalogFixture = vi.hoisted(() => [
  {
    id: "catalog-test",
    name: "Exercício configurável",
    ownerUserId: null,
    hasMedia: false,
    muscles: [],
  },
]);
vi.mock("@/app/_lib/hooks/use-exercise-catalog", () => ({
  useExerciseCatalog: () => ({ exercises: catalogFixture, isSyncing: false }),
}));

describe("Holo-Board 3D Spatial Utils", () => {
  it("preserves an existing custom cadence when enabling its technique", () => {
    const item = {
      name: "Supino",
      sets: 3,
      reps: 10,
      restTimeInSeconds: 75,
      tempo: "5-2-1-3",
    };
    expect(toggleRune(item, "TEMPO_CONTROL")).toMatchObject({
      tempo: "5-2-1-3",
      runeConfig: { TEMPO_CONTROL: "5-2-1-3" },
    });
  });
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
  it("preserves the prescription configured in the catalog when adding its card to the board", () => {
    const observe = vi.fn();
    function Editor() {
      const [day, setDay] = useState<WorkoutPlanDraftDay>({
        clientId: "day",
        name: "Treino A",
        isRest: false,
        estimatedDurationInMinutes: 30,
        exercises: [],
      });
      return (
        <SpatialBuilderArena
          day={day}
          days={[day]}
          activeDayIndex={0}
          onSelectDay={vi.fn()}
          onAddDay={vi.fn()}
          onChange={(patch) => {
            observe(patch);
            setDay((previous) => ({ ...previous, ...patch }));
          }}
        />
      );
    }
    render(<Editor />);
    fireEvent.contextMenu(
      screen.getByRole("button", { name: "Adicionar Exercício configurável" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Prescrição avançada" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Exercício configurável",
    });
    fireEvent.change(within(dialog).getByLabelText("Série 1: descanso (s)"), {
      target: { value: "95" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Adicionar ao treino" }),
    );
    expect(observe).toHaveBeenLastCalledWith(
      expect.objectContaining({
        exercises: [
          expect.objectContaining({
            exerciseId: "catalog-test",
            restTimeInSeconds: 95,
            setPrescription: expect.arrayContaining([
              expect.objectContaining({ restSeconds: 95 }),
            ]),
          }),
        ],
      }),
    );
  });
  it("opens options on stationary long press and suppresses the insertion click when releasing", () => {
    vi.useFakeTimers();
    try {
      const onSummon = vi.fn();
      render(
        <PlayerHand
          catalog={[
            {
              id: "long-press",
              name: "Remada de teste",
              ownerUserId: null,
              hasMedia: false,
              muscles: [],
            },
          ]}
          onSummonExercise={onSummon}
        />,
      );
      const add = screen.getByRole("button", {
        name: "Adicionar Remada de teste",
      });
      fireEvent.pointerDown(add, {
        button: 0,
        pointerType: "touch",
        clientX: 60,
        clientY: 100,
      });
      act(() => vi.advanceTimersByTime(650));
      fireEvent.pointerUp(add, {
        pointerType: "touch",
        clientX: 60,
        clientY: 100,
      });
      fireEvent.click(add);
      expect(
        screen.getByRole("menuitem", { name: "Configurar técnicas" }),
      ).toBeDefined();
      expect(onSummon).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels the long press when the finger moves to scroll", () => {
    vi.useFakeTimers();
    try {
      render(
        <PlayerHand
          catalog={[
            {
              id: "swipe",
              name: "Remada para deslizar",
              ownerUserId: null,
              hasMedia: false,
              muscles: [],
            },
          ]}
          onSummonExercise={vi.fn()}
        />,
      );
      const add = screen.getByRole("button", {
        name: "Adicionar Remada para deslizar",
      });
      fireEvent.pointerDown(add, {
        button: 0,
        pointerType: "touch",
        clientX: 60,
        clientY: 100,
      });
      fireEvent.pointerMove(add, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      act(() => vi.advanceTimersByTime(650));
      fireEvent.pointerUp(add, {
        pointerType: "touch",
        clientX: 100,
        clientY: 100,
      });
      expect(screen.queryByRole("menu")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it("drags inside the workspace dialog and reports the release point for returning to the deck", () => {
    const onPositionChange = vi.fn(),
      onDragEnd = vi.fn();
    const { container } = render(
      <div role="dialog">
        <HoloExerciseCard
          item={{ name: "Remada", sets: 3, reps: 10, restTimeInSeconds: 75 }}
          index={0}
          orderLabel="01"
          x={100}
          y={100}
          onPositionChange={onPositionChange}
          onDragEnd={onDragEnd}
          onChange={vi.fn()}
          onRemove={vi.fn()}
          onStartWirePull={vi.fn()}
        />
      </div>,
    );
    const card = container.querySelector("[data-holo-card]") as HTMLElement;
    card.setPointerCapture = vi.fn();
    fireEvent.pointerDown(card.querySelector("svg.lucide-dumbbell")!, {
      button: 0,
      pointerId: 1,
      clientX: 130,
      clientY: 180,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 220 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 700 });
    expect(onPositionChange).toHaveBeenCalledWith({ x: 120, y: 140 });
    expect(onDragEnd).toHaveBeenCalledWith({ x: 150, y: 700 });
  });

  it("opens settings on double click, lets advanced fields toggle, and edits explicit technique inputs", () => {
    function Editor() {
      const [item, setItem] = useState<WorkoutPlanDraftExercise>({
        name: "Supino de teste",
        sets: 3,
        reps: 10,
        restTimeInSeconds: 75,
      });
      return (
        <HoloExerciseCard
          item={item}
          index={0}
          orderLabel="01"
          x={0}
          y={0}
          onPositionChange={vi.fn()}
          onChange={(patch) =>
            setItem((previous) => patchExercise(previous, patch))
          }
          onRemove={vi.fn()}
          onStartWirePull={vi.fn()}
        />
      );
    }
    const { container } = render(<Editor />);
    const title = container.querySelector("[data-card-title]")!;
    fireEvent.click(title);
    expect(
      screen.queryByRole("dialog", { name: "Supino de teste" }),
    ).toBeNull();
    fireEvent.doubleClick(title);
    const dialog = screen.getByRole("dialog", { name: "Supino de teste" });
    const advanced = within(dialog).getByText("Prescrição avançada (opcional)");
    fireEvent.pointerDown(advanced, { button: 0 });
    fireEvent.click(advanced);
    expect((advanced.closest("details") as HTMLDetailsElement).open).toBe(
      false,
    );
    fireEvent.click(advanced);
    expect((advanced.closest("details") as HTMLDetailsElement).open).toBe(true);
    fireEvent.change(within(dialog).getByLabelText("RIR alvo"), {
      target: { value: "3" },
    });
    fireEvent.click(within(dialog).getByRole("tab", { name: "Técnicas" }));
    fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "Rest-pause" }),
    );
    fireEvent.change(within(dialog).getByLabelText("Pausa interna (s)"), {
      target: { value: "17" },
    });
    fireEvent.click(
      within(dialog).getByRole("checkbox", { name: "Isometria" }),
    );
    fireEvent.change(within(dialog).getByLabelText("Posição da isometria"), {
      target: { value: "base" },
    });
    fireEvent.change(within(dialog).getByLabelText("Isometria (s)"), {
      target: { value: "12" },
    });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Cadência" }));
    fireEvent.change(within(dialog).getByLabelText("Descida (s)"), {
      target: { value: "5" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Concluir" }));
    expect(screen.getByText(/Rest-pause 17s/)).toBeDefined();
    expect(screen.getByText(/Base 12s/)).toBeDefined();
    expect(screen.getByText(/5-0-1-0/)).toBeDefined();
    fireEvent.doubleClick(title);
    expect(
      (
        within(
          screen.getByRole("dialog", { name: "Supino de teste" }),
        ).getByLabelText("RIR alvo") as HTMLInputElement
      ).value,
    ).toBe("3");
  });

  it("adjusts exact reps by click and wheel while preserving individual rests and loads", () => {
    const observe = vi.fn();
    function Editor() {
      const [item, setItem] = useState<WorkoutPlanDraftExercise>({
        name: "Remada",
        sets: 2,
        reps: 10,
        restTimeInSeconds: 75,
        repsMin: 8,
        repsMax: 12,
        setPrescription: [
          { reps: 10, zone: "hypertrophy", restSeconds: 75, load: 20 },
          { reps: 8, zone: "hypertrophy", restSeconds: 90, load: 15 },
        ],
      });
      return (
        <HoloExerciseCard
          item={item}
          index={0}
          orderLabel="01"
          x={0}
          y={0}
          onPositionChange={vi.fn()}
          onChange={(patch) =>
            setItem((previous) => {
              const next = patchExercise(previous, patch);
              observe(next);
              return next;
            })
          }
          onRemove={vi.fn()}
          onStartWirePull={vi.fn()}
        />
      );
    }
    render(<Editor />);
    fireEvent.click(
      screen.getByRole("button", { name: "Aumentar repetições" }),
    );
    fireEvent.wheel(
      screen.getByRole("spinbutton", { name: "Valor de repetições" }),
      { deltaY: -100 },
    );
    expect(observe).toHaveBeenLastCalledWith(
      expect.objectContaining({
        reps: 12,
        repsMin: null,
        repsMax: null,
        setPrescription: [
          { reps: 12, zone: "hypertrophy", restSeconds: 75, load: 20 },
          { reps: 12, zone: "hypertrophy", restSeconds: 90, load: 15 },
        ],
      }),
    );
  });
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

  it("makes exercises beyond the first 18 reachable in a scrollable list and filters search", () => {
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
          name: "Rolar exercícios para a esquerda",
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
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Valor de séries",
        }) as HTMLInputElement
      ).value,
    ).toBe("4");
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
