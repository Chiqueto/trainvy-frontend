import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { LegalConsent } from "../app/_components/legal-consent";
import {
  acceptLegalDocumentAction,
  getMyLegalDocumentsAction,
} from "../app/_actions/legal";
vi.mock("../app/_actions/legal", () => ({
  acceptLegalDocumentAction: vi.fn(),
  getMyLegalDocumentsAction: vi.fn(),
}));
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const document = {
  id: "health",
  slug: "termo-saude-parq-lgpd",
  title: "Consentimento de saúde",
  category: "HEALTH_PARQ_CONSENT",
  classification: "OBRIGATORIO_LEI" as const,
  targetAudience: "STUDENT",
  version: "1.0.0",
  contentMd: "# Saúde e IA",
  requiresClickwrap: true,
  isActive: true,
  updatedAt: "2026-11-06",
  contentHash: "a".repeat(64),
  accepted: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMyLegalDocumentsAction).mockResolvedValue({
    status: 200,
    data: [document],
  });
  vi.mocked(acceptLegalDocumentAction).mockResolvedValue({
    status: 200,
    data: { success: true },
  });
});
afterEach(cleanup);
describe("Consentimento destacado", () => {
  it("opens the complete document in an accessible modal", async () => {
    render(<LegalConsent />);
    fireEvent.click(
      await screen.findByRole("button", { name: document.title }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(document.contentMd)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fechar leitura" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("starts unchecked and only unlocks after an explicit, server-confirmed acceptance", async () => {
    const ready = vi.fn();
    render(<LegalConsent onReady={ready} />);
    const checkbox = await screen.findByRole("checkbox");
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    expect(acceptLegalDocumentAction).not.toHaveBeenCalled();
    expect(ready).toHaveBeenLastCalledWith(false);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    await waitFor(() => expect(ready).toHaveBeenLastCalledWith(true));
    expect(acceptLegalDocumentAction).toHaveBeenCalledWith(document.slug, {
      accepted: true,
      version: document.version,
      contentHash: document.contentHash,
    });
  });
  it("does not unlock when the accepted document version changed on the server", async () => {
    vi.mocked(acceptLegalDocumentAction).mockResolvedValue({
      status: 409,
      data: { code: "DOCUMENT_VERSION_CHANGED", error: "Leia a versão atual." },
    });
    const ready = vi.fn();
    render(<LegalConsent onReady={ready} />);
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    await screen.findByText("Leia a versão atual.");
    expect(ready).toHaveBeenLastCalledWith(false);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(getMyLegalDocumentsAction).toHaveBeenCalledTimes(2);
  });
  it("groups terms and privacy, keeps health separate, and submits each version and hash", async () => {
    const terms = {
      ...document,
      id: "terms",
      slug: "termos-de-uso",
      category: "TERMS_OF_USE",
      title: "Termos",
    };
    const privacy = {
      ...document,
      id: "privacy",
      slug: "politica-de-privacidade",
      category: "PRIVACY_POLICY",
      title: "Privacidade",
    };
    vi.mocked(getMyLegalDocumentsAction).mockResolvedValue({
      status: 200,
      data: [terms, privacy, document],
    });
    const ready = vi.fn();
    render(<LegalConsent onReady={ready} />);
    const core = await screen.findByRole("checkbox", {
      name: "Li e estou de acordo com os Termos de Uso e a Política de Privacidade do Trainvy.",
    });
    const health = screen.getByRole("checkbox", {
      name: /Declaro ciência do Termo de Prontidão Física/,
    });
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    fireEvent.click(core);
    expect(
      (
        screen.getByRole("button", {
          name: "Registrar aceite",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(health);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    await waitFor(() => expect(ready).toHaveBeenLastCalledWith(true));
    expect(acceptLegalDocumentAction).toHaveBeenCalledTimes(3);
    for (const d of [terms, privacy, document])
      expect(acceptLegalDocumentAction).toHaveBeenCalledWith(d.slug, {
        accepted: true,
        version: d.version,
        contentHash: d.contentHash,
      });
  });
  it("preserves server-confirmed acceptances and retries only the remaining documents", async () => {
    const ai = {
      ...document,
      id: "ai",
      slug: "diretrizes-ia-seguranca",
      title: "Aviso de IA",
      category: "AI_DISCLAIMER",
    };
    vi.mocked(getMyLegalDocumentsAction).mockResolvedValue({
      status: 200,
      data: [document, ai],
    });
    vi.mocked(acceptLegalDocumentAction)
      .mockResolvedValueOnce({ status: 200, data: { success: true } })
      .mockRejectedValueOnce(new Error("Offline"));
    const ready = vi.fn();
    render(<LegalConsent onReady={ready} />);
    await screen.findByRole("checkbox", { name: /Declaro ciência/ });
    screen
      .getAllByRole("checkbox")
      .forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    await screen.findByText(/Falha ao registrar aceite/);
    expect(ready).toHaveBeenLastCalledWith(false);
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Registrar aceite" }));
    await waitFor(() => expect(ready).toHaveBeenLastCalledWith(true));
    expect(acceptLegalDocumentAction).toHaveBeenNthCalledWith(3, ai.slug, {
      accepted: true,
      version: ai.version,
      contentHash: ai.contentHash,
    });
  });
});
