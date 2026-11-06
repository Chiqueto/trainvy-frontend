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
  });
});
