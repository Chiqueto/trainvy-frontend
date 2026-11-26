import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Exercise3DViewer } from "../app/_components/exercise-3d/exercise-3d-viewer";
import { FeatureConsentProvider } from "../app/_components/feature-consent-provider";
import { LandingPage } from "../app/_components/landing/landing-page";
import { getFeatureTermsAction } from "../app/_actions/feature-terms";

vi.mock("../app/_lib/auth-client", () => ({
  authClient: { useSession: vi.fn(() => ({ data: null })) },
}));

vi.mock("../app/_actions/feature-terms", () => ({
  getFeatureTermsAction: vi.fn(async () => ({
    success: false as const,
    error: "Entre na sua conta para continuar.",
  })),
  acceptFeatureTermsAction: vi.fn(),
  authorizeFeatureAccessAction: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<
      ComponentType<Record<string, unknown>> | { default: ComponentType<Record<string, unknown>> }
    >,
    options?: { loading?: () => ReactNode },
  ) =>
    function DynamicMock(props: Record<string, unknown>) {
      const [Loaded, setLoaded] = useState<ComponentType<Record<string, unknown>> | null>(
        null,
      );
      useEffect(() => {
        let active = true;
        void loader().then((resolved) => {
          if (!active) return;
          const Component =
            typeof resolved === "function" ? resolved : resolved.default;
          setLoaded(() => Component);
        });
        return () => {
          active = false;
        };
      }, []);
      if (!Loaded) return options?.loading?.() ?? null;
      return <Loaded {...props} />;
    },
}));

vi.mock("../app/_components/exercise-3d/exercise-scene", () => ({
  default: function MockScene(props: {
    exercise: string;
    onReady: () => void;
  }) {
    const { onReady } = props;
    useEffect(() => onReady(), [onReady]);
    return <div data-testid="scene" data-exercise={props.exercise} />;
  },
}));

describe("Public landing 3D showcase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("opens the landing 3D viewer for logged-out visitors without requiring feature-terms auth", async () => {
    render(
      <FeatureConsentProvider>
        <LandingPage />
      </FeatureConsentProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Experimente na prática/i }),
    );

    await screen.findByRole("region", {
      name: "Demonstração 3D: Agachamento livre",
    });
    await screen.findByTestId("scene");
    expect(screen.getByTestId("scene").getAttribute("data-exercise")).toBe(
      "squat",
    );
    expect(screen.queryByText(/Entre na sua conta para continuar/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Continuar para a demonstração" }),
    ).toBeNull();
    expect(getFeatureTermsAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Supino reto" }));
    await screen.findByRole("region", {
      name: "Demonstração 3D: Supino Reto com Barra",
    });
    expect(screen.getByTestId("scene").getAttribute("data-exercise")).toBe(
      "bench-press",
    );
    expect(getFeatureTermsAction).not.toHaveBeenCalled();
  });

  it("still gates authenticated Exercise3DViewer behind FeatureConsentGate", async () => {
    render(
      <FeatureConsentProvider>
        <Exercise3DViewer exercise="squat" />
      </FeatureConsentProvider>,
    );

    await screen.findByRole("button", {
      name: "Continuar para a demonstração",
    });
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(getFeatureTermsAction).toHaveBeenCalledWith("EXERCISE_3D");
  });
});
