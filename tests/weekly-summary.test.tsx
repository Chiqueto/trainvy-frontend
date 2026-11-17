import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeeklySummary } from "@/app/stats/_components/weekly-summary";
import type { GetCurrentTrainingWeek200 } from "@/app/_lib/api/fetch-generated";

const week: GetCurrentTrainingWeek200 = {
  startDate: "2026-11-15",
  endDate: "2026-11-21",
  timezone: "America/Sao_Paulo",
  workoutsCompleted: 2,
  workingSets: 4,
  loadVolumeKg: 400,
  durationInSeconds: 3600,
  unclassifiedWorkingSets: 1,
  days: [{ date: "2026-11-15", workoutsCompleted: 2 }],
  attributes: { shortReps: 1, mediumReps: 2, longReps: 0, withoutReps: 1 },
  muscles: [
    {
      muscleGroup: "CHEST",
      directWorkingSets: 3,
      indirectWorkingSets: 0,
      directLoadVolumeKg: 400,
    },
    {
      muscleGroup: "TRICEPS",
      directWorkingSets: 0,
      indirectWorkingSets: 3,
      directLoadVolumeKg: 0,
    },
  ],
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Weekly summary", () => {
  it("shows real direct/indirect counts, neutral missing groups and recorded rep ranges", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => week });
    vi.stubGlobal("fetch", fetcher);
    render(<WeeklySummary />);
    expect(screen.getByLabelText("Carregando resumo da semana")).toBeDefined();
    await screen.findByText("O que você treinou");
    expect(fetcher.mock.calls[0][0]).toContain("/api/training-week?tz=");
    const primary = screen.getByRole("button", {
      name: "Peito: 3 séries diretas e 0 indiretas",
    });
    const secondary = screen.getByRole("button", {
      name: "Tríceps: 0 séries diretas e 3 indiretas",
    });
    expect(primary.querySelector("path")?.getAttribute("fill")).toBe("#ef4444");
    expect(secondary.querySelector("path")?.getAttribute("fill")).toBe(
      "#fca5a5",
    );
    expect(
      screen
        .getByRole("button", { name: /Quadríceps: 0 séries diretas/ })
        .querySelector("path")
        ?.getAttribute("fill"),
    ).toBe("#334155");
    expect(screen.getByLabelText("Dom: 2 treinos")).toBeDefined();
    expect(
      screen.getByText(/1 séries sem classificação muscular/),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Atributos" }));
    expect(screen.getByText("Força · faixa curta")).toBeDefined();
    expect(screen.getByText("2 séries")).toBeDefined();
    expect(screen.getByText(/1 séries sem repetições/)).toBeDefined();
    expect(screen.getByText(/não recebem pontuação estimada/)).toBeDefined();
  });
  it("retries a failed weekly request without blocking other content", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: true, json: async () => week });
    vi.stubGlobal("fetch", fetcher);
    render(<WeeklySummary />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByText("O que você treinou");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("aborts the request on navigation and shows an honest empty week", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          ...week,
          workoutsCompleted: 0,
          workingSets: 0,
          muscles: [],
          days: [],
        }),
      });
    vi.stubGlobal("fetch", fetcher);
    const { unmount } = render(<WeeklySummary />);
    await waitFor(() =>
      expect(screen.getByText(/Sua semana começa aqui/)).toBeDefined(),
    );
    unmount();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
