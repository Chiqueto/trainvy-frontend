import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Exercise3DViewer } from "../app/_components/exercise-3d/exercise-3d-viewer";

// Viewer controls are tested after consent; the real gate has its own regression suite.
vi.mock("../app/_components/feature-consent", () => ({
  FeatureConsentGate: ({ children }: { children: import("react").ReactNode }) =>
    children,
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockScene(props: {
      onReady: () => void;
      onError: () => void;
      view: string;
      highlighted: boolean;
      playing: boolean;
      revision: number;
    }) {
      const { onReady } = props;
      useEffect(() => onReady(), [onReady]);
      return (
        <div
          data-testid="scene"
          data-view={props.view}
          data-highlighted={String(props.highlighted)}
          data-playing={String(props.playing)}
          data-revision={props.revision}
        >
          <button onClick={props.onError}>Simular perda de contexto</button>
        </div>
      );
    },
}));

function motionPreference(matches = false) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
describe("Anatomical viewer controls", () => {
  it("labels the pulldown return, overhead pause and pull correctly", () => {
    render(<Exercise3DViewer exercise="lat-pulldown" />);
    const slider=screen.getByRole("slider",{name:"Posição do movimento"});
    for(const [value,label] of [[250,"Retorno controlado da barra"],[500,"Pausa com braços alongados"],[800,"Puxada à frente do corpo"]] as const) {
      fireEvent.change(slider,{target:{value:String(value)}});
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(screen.getByText("Latíssimo do dorso · Redondo maior")).toBeDefined();
  });
  it("shows the LPO catch phase when scrubbing Hang Power Clean", async () => {
    render(<Exercise3DViewer exercise="hang-power-clean" />);
    fireEvent.change(screen.getByRole("slider",{name:"Posição do movimento"}),{target:{value:"450"}});
    expect(screen.getByText("Recepção em agachamento parcial")).toBeDefined();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    motionPreference();
  });
  it("can pause and scrub the actual pose revision without remounting", async () => {
    render(<Exercise3DViewer exercise="squat" />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pausar movimento" }),
      ).toBeDefined(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Pausar movimento" }));
    fireEvent.change(
      screen.getByRole("slider", { name: "Posição do movimento" }),
      { target: { value: "500" } },
    );
    expect(screen.getByTestId("scene").getAttribute("data-playing")).toBe(
      "false",
    );
    expect(screen.getByTestId("scene").getAttribute("data-revision")).toBe("1");
    expect(screen.getByRole("slider").getAttribute("value")).toBe("500");
  });
  it("switches rear camera and anatomical highlight independently", async () => {
    render(<Exercise3DViewer exercise="bench-press" />);
    fireEvent.click(screen.getByRole("button", { name: "Costas" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Músculos do exercício" }),
    );
    expect(screen.getByTestId("scene").getAttribute("data-view")).toBe("back");
    expect(screen.getByTestId("scene").getAttribute("data-highlighted")).toBe(
      "false",
    );
    expect(screen.getByText("Anatomia neutra")).toBeDefined();
  });
  it("honours reduced motion on initial load", async () => {
    motionPreference(true);
    render(<Exercise3DViewer exercise="squat" />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reproduzir movimento" }),
      ).toBeDefined(),
    );
    expect(screen.getByTestId("scene").getAttribute("data-playing")).toBe(
      "false",
    );
  });
  it("keeps instructions available if WebGL is interrupted", () => {
    render(<Exercise3DViewer exercise="squat" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Simular perda de contexto" }),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "As ilustrações e as instruções do exercício continuam disponíveis",
    );
  });
});
