import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptLegalDocument,
  getMyLegalDocuments,
} from "../app/_lib/api/fetch-generated";
import {
  acceptLegalDocumentAction,
  getMyLegalDocumentsAction,
} from "../app/_actions/legal";
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "Browser under test" }),
}));
vi.mock("../app/_lib/api/fetch-generated", () => ({
  acceptLegalDocument: vi.fn(),
  getMyLegalDocuments: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
describe("Legal Server Actions", () => {
  it("returns only serializable data across the server/client boundary", async () => {
    vi.mocked(getMyLegalDocuments).mockResolvedValue({
      status: 200,
      data: [],
      headers: new Headers(),
    });
    expect(await getMyLegalDocumentsAction()).toEqual({
      status: 200,
      data: [],
    });
  });
  it("forwards the request browser agent and preserves version-conflict errors", async () => {
    vi.mocked(acceptLegalDocument).mockResolvedValue({
      status: 409,
      data: { code: "DOCUMENT_VERSION_CHANGED", error: "Documento alterado." },
      headers: new Headers(),
    });
    const body = {
      accepted: true as const,
      version: "1.0.0",
      contentHash: "a".repeat(64),
    };
    expect(await acceptLegalDocumentAction("termos-de-uso", body)).toEqual({
      status: 409,
      data: { code: "DOCUMENT_VERSION_CHANGED", error: "Documento alterado." },
    });
    expect(acceptLegalDocument).toHaveBeenCalledWith("termos-de-uso", body, {
      headers: { "user-agent": "Browser under test" },
    });
  });
});
