import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FeatureConsentGate,
  useFeatureConsent,
} from "../app/_components/feature-consent";
import { StrictMode, useState } from "react";
import {
  acceptFeatureTermsAction,
  authorizeFeatureAccessAction,
  getFeatureTermsAction,
} from "../app/_actions/feature-terms";

vi.mock("../app/_actions/feature-terms", () => ({
  getFeatureTermsAction: vi.fn(),
  acceptFeatureTermsAction: vi.fn(),
  authorizeFeatureAccessAction: vi.fn(),
}));
const terms = {
  feature: "EXERCISE_3D" as const,
  version: "v1",
  title: "Antes do 3D",
  text: "Ilustração educativa, sem medição de EMG.",
  textHash: "a".repeat(64),
  accepted: false,
  acceptanceId: null,
  acceptedAt: null,
};
function mount() {
  render(
    <FeatureConsentGate feature="EXERCISE_3D" context="squat">
      <span>Conteúdo 3D</span>
    </FeatureConsentGate>,
  );
}
async function open() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Continuar para o 3D" }),
  );
  await screen.findByRole("dialog");
}
describe("feature acknowledgements", () => {
  it("does not reopen consent after cancellation while status is loading", async () => {
    let resolveStatus!: (
      value: Awaited<ReturnType<typeof getFeatureTermsAction>>,
    ) => void;
    vi.mocked(getFeatureTermsAction).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );
    function Harness() {
      const { requestConsent, cancelConsent, dialog } = useFeatureConsent();
      const [result, setResult] = useState("");
      return (
        <>
          <button
            onClick={() => {
              void requestConsent("AI_WORKOUT").then((value) =>
                setResult(String(value)),
              );
            }}
          >
            Solicitar
          </button>
          <button onClick={cancelConsent}>Fechar chat</button>
          {dialog}
          <span>{result}</span>
        </>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText("Solicitar"));
    fireEvent.click(screen.getByText("Fechar chat"));
    resolveStatus({ success: true, data: { ...terms, feature: "AI_WORKOUT" } });
    await screen.findByText("false");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: terms,
    });
    vi.mocked(acceptFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, accepted: true },
    });
    vi.mocked(authorizeFeatureAccessAction).mockResolvedValue({
      success: true,
      data: { authorized: true, eventId: "event" },
    });
  });
  it("requires an unchecked acknowledgement and successful persistence before loading 3D", async () => {
    mount();
    await open();
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Aceitar e continuar",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Aceitar e continuar" }),
    );
    await screen.findByText("Conteúdo 3D");
    expect(acceptFeatureTermsAction).toHaveBeenCalledWith(
      "EXERCISE_3D",
      "v1",
      terms.textHash,
    );
    expect(authorizeFeatureAccessAction).toHaveBeenCalledWith(
      "EXERCISE_3D",
      "squat",
    );
  });
  it("cancels without saving or opening the scene", async () => {
    mount();
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(acceptFeatureTermsAction).not.toHaveBeenCalled();
    expect(authorizeFeatureAccessAction).not.toHaveBeenCalled();
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
  });
  it("keeps the gate closed when saving fails", async () => {
    vi.mocked(acceptFeatureTermsAction).mockRejectedValue(
      new Error("Falha ao salvar"),
    );
    mount();
    await open();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Aceitar e continuar" }),
    );
    await screen.findByText("Falha ao salvar");
    expect(authorizeFeatureAccessAction).not.toHaveBeenCalled();
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
  });
  it("reuses server acceptance and still audits the access", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, accepted: true },
    });
    mount();
    await screen.findByText("Conteúdo 3D");
    expect(
      screen.queryByRole("button", { name: "Continuar para o 3D" }),
    ).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(acceptFeatureTermsAction).not.toHaveBeenCalled();
    expect(authorizeFeatureAccessAction).toHaveBeenCalledOnce();
  });
  it("blocks the resource if access auditing fails even after previous acceptance", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, accepted: true },
    });
    vi.mocked(authorizeFeatureAccessAction).mockRejectedValue(
      new Error("Indisponível"),
    );
    mount();
    await screen.findByText("Indisponível");
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
  });
  it("does not mount or audit the scene while acceptance is being checked", async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof getFeatureTermsAction>>,
    ) => void;
    vi.mocked(getFeatureTermsAction).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    mount();
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Continuar para o 3D" }),
    ).toBeNull();
    expect(authorizeFeatureAccessAction).not.toHaveBeenCalled();
    resolve({ success: true, data: { ...terms, accepted: true } });
    await screen.findByText("Conteúdo 3D");
  });
  it("reuses acceptance on remount, but revalidates the server and audits each resource", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, accepted: true },
    });
    const first = render(
      <FeatureConsentGate
        feature="EXERCISE_3D"
        context="exercise-3d:leg-extension"
      >
        <span>Extensora</span>
      </FeatureConsentGate>,
    );
    await screen.findByText("Extensora");
    first.unmount();
    render(
      <FeatureConsentGate
        feature="EXERCISE_3D"
        context="exercise-3d:seated-leg-curl"
      >
        <span>Flexora</span>
      </FeatureConsentGate>,
    );
    await screen.findByText("Flexora");
    expect(getFeatureTermsAction).toHaveBeenCalledTimes(2);
    expect(authorizeFeatureAccessAction).toHaveBeenCalledTimes(2);
    expect(authorizeFeatureAccessAction).toHaveBeenLastCalledWith(
      "EXERCISE_3D",
      "exercise-3d:seated-leg-curl",
    );
    expect(acceptFeatureTermsAction).not.toHaveBeenCalled();
  });
  it("requires a new acknowledgement when the current server version is not accepted", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValueOnce({
      success: true,
      data: { ...terms, accepted: true },
    });
    const first = render(
      <FeatureConsentGate feature="EXERCISE_3D" context="old">
        <span>Antigo</span>
      </FeatureConsentGate>,
    );
    await screen.findByText("Antigo");
    first.unmount();
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, version: "v2", textHash: "b".repeat(64) },
    });
    mount();
    await open();
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
    expect(authorizeFeatureAccessAction).toHaveBeenCalledOnce();
    expect(acceptFeatureTermsAction).not.toHaveBeenCalled();
  });
  it("ignores late responses from an unmounted resource", async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof getFeatureTermsAction>>,
    ) => void;
    vi.mocked(getFeatureTermsAction).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const view = render(
      <FeatureConsentGate feature="EXERCISE_3D" context="old">
        <span>Antigo</span>
      </FeatureConsentGate>,
    );
    view.rerender(
      <FeatureConsentGate feature="EXERCISE_3D" context="new">
        <span>Novo</span>
      </FeatureConsentGate>,
    );
    await screen.findByRole("button", { name: "Continuar para o 3D" });
    resolve({ success: true, data: { ...terms, accepted: true } });
    await waitFor(() => expect(getFeatureTermsAction).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Antigo")).toBeNull();
    expect(screen.queryByText("Novo")).toBeNull();
    expect(authorizeFeatureAccessAction).not.toHaveBeenCalled();
  });
  it("keeps the scene blocked when revalidation fails and permits a retry", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValueOnce({
      success: false,
      error: "Sem conexão",
    });
    mount();
    await screen.findByText("Sem conexão");
    expect(screen.queryByText("Conteúdo 3D")).toBeNull();
    expect(authorizeFeatureAccessAction).not.toHaveBeenCalled();
    await open();
    expect(screen.getByRole("checkbox").getAttribute("checked")).toBeNull();
  });
  it("does not duplicate audited access during StrictMode effect replay", async () => {
    vi.mocked(getFeatureTermsAction).mockResolvedValue({
      success: true,
      data: { ...terms, accepted: true },
    });
    render(
      <StrictMode>
        <FeatureConsentGate feature="EXERCISE_3D" context="strict">
          <span>Conteúdo 3D</span>
        </FeatureConsentGate>
      </StrictMode>,
    );
    await screen.findByText("Conteúdo 3D");
    expect(authorizeFeatureAccessAction).toHaveBeenCalledOnce();
  });
});
