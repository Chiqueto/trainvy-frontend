import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfessionalRegistrationForm } from "@/app/personal/_components/professional-registration-form";
import {
  declareProfessionalCredentialsAction,
  getMyLegalDocumentsAction,
} from "@/app/_actions/legal";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/_actions/legal", () => ({
  declareProfessionalCredentialsAction: vi.fn(),
  getMyLegalDocumentsAction: vi.fn(),
}));
vi.mock("@/app/_components/legal-document-reader", () => ({
  LegalDocumentReader: () => <span>Termo completo</span>,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMyLegalDocumentsAction).mockResolvedValue({
    status: 200,
    data: [
      {
        id: "declaration",
        slug: "declaracao-responsabilidade-cref",
        title: "Declaração",
        category: "CREF_DECLARATION",
        classification: "OBRIGATORIO_LEI",
        targetAudience: "PROFESSIONAL",
        version: "1.0.0",
        contentHash: "a".repeat(64),
        contentMd: "Termo completo",
        requiresClickwrap: true,
        isActive: true,
        updatedAt: "2026-11-06",
      },
    ],
  });
  vi.mocked(declareProfessionalCredentialsAction).mockResolvedValue({
    status: 200,
    data: { success: true },
  });
});
afterEach(cleanup);

describe("Cadastro profissional", () => {
  it("formats typed or pasted identifiers, sends normalized values and clears CPF after success", async () => {
    render(<ProfessionalRegistrationForm registration={null} />);
    await screen.findByText("Termo completo");
    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Profissional Exemplo" },
    });
    const cpf = screen.getByLabelText("CPF") as HTMLInputElement;
    fireEvent.change(cpf, { target: { value: "52998224725" } });
    expect(cpf.value).toBe("529.982.247-25");
    const cref = screen.getByLabelText(/CREF \(ex/) as HTMLInputElement;
    fireEvent.change(cref, { target: { value: "123456g" } });
    expect(cref.value).toBe("123456-G");
    fireEvent.change(screen.getByLabelText("UF do registro"), {
      target: { value: "SP" },
    });
    fireEvent.change(
      screen.getByLabelText("Categoria e habilitação declaradas"),
      { target: { value: "Bacharel" } },
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Ativar credenciais profissionais" }),
    );
    await waitFor(() =>
      expect(declareProfessionalCredentialsAction).toHaveBeenCalledWith({
        fullName: "Profissional Exemplo",
        cpf: "52998224725",
        cref: "123456-G",
        region: "SP",
        category: "Bacharel",
        acceptance: {
          accepted: true,
          version: "1.0.0",
          contentHash: "a".repeat(64),
        },
      }),
    );
    await waitFor(() => expect(cpf.value).toBe(""));
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByText(/demonstração e rascunhos/i)).toBeNull();
  });
});
