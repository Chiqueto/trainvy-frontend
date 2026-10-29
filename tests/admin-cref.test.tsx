import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfessionalVerificationPolicyCard } from "@/app/admin/professionals/policy-card";
import { ProfessionalCrefSearch } from "@/app/admin/professionals/search";
import { ProfessionalReview } from "@/app/admin/professionals/review";
import {
  updateProfessionalVerificationPolicyAction,
  reviewProfessionalRegistrationAction,
} from "@/app/admin/professionals/_actions";
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/admin/professionals/_actions", () => ({
  updateProfessionalVerificationPolicyAction: vi.fn(),
  reviewProfessionalRegistrationAction: vi.fn(),
}));
const policy = {
  required: true,
  revision: 3,
  updatedAt: null,
  updatedByUserId: null,
};
describe("Admin CREF controls", () => {
  beforeEach(() => vi.clearAllMocks());
  it("only saves the test flag after the admin submits the change", async () => {
    vi.mocked(updateProfessionalVerificationPolicyAction).mockResolvedValue({
      status: 200,
      data: { ...policy, required: false, revision: 4 },
    });
    render(<ProfessionalVerificationPolicyCard policy={policy} />);
    expect(
      (
        screen.getByRole("switch", {
          name: "Exigir CREF verificado",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    fireEvent.click(screen.getByRole("switch"));
    expect(updateProfessionalVerificationPolicyAction).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar configuração" }),
    );
    await waitFor(() =>
      expect(updateProfessionalVerificationPolicyAction).toHaveBeenCalledWith({
        required: false,
        revision: 3,
        reason: "Fase de testes da plataforma",
      }),
    );
    expect(await screen.findByText("Configuração salva.")).toBeDefined();
    expect(refresh).toHaveBeenCalled();
  });
  it("clearly identifies the active test mode without claiming verification", () => {
    render(
      <ProfessionalVerificationPolicyCard
        policy={{ ...policy, required: false }}
      />,
    );
    expect(screen.getByText(/Modo de testes ativo/)).toBeDefined();
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(
      screen
        .getByRole("link", { name: "Buscar e validar CREFs" })
        .getAttribute("href"),
    ).toBe("/admin/professionals");
  });
  it("keeps the pending selection visible when the backend rejects a stale revision", async () => {
    vi.mocked(updateProfessionalVerificationPolicyAction).mockResolvedValue({
      status: 409,
      data: { code: "CONCURRENCY_CONFLICT", error: "A configuração mudou." },
    });
    render(<ProfessionalVerificationPolicyCard policy={policy} />);
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(
      screen.getByRole("button", { name: "Salvar configuração" }),
    );
    expect(await screen.findByText("A configuração mudou.")).toBeDefined();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("searches local registrations by name/number and UF and links the correct official source", () => {
    render(<ProfessionalCrefSearch q="987654-G" region="SP" />);
    expect(
      (screen.getByLabelText("CREF ou nome") as HTMLInputElement).value,
    ).toBe("987654-G");
    expect(
      screen
        .getByRole("link", { name: "Consulta oficial CREF/SP" })
        .getAttribute("href"),
    ).toBe(
      "https://cref-sp.implanta.net.br/servicosOnline/Publico/ConsultaInscritos",
    );
    expect(
      screen
        .getByRole("button", { name: "Buscar cadastros" })
        .closest("form")
        ?.getAttribute("action"),
    ).toBe("/admin/professionals");
    fireEvent.change(screen.getByLabelText("UF"), { target: { value: "RJ" } });
    expect(
      screen
        .getByRole("link", { name: "Consulta oficial CREF/RJ" })
        .getAttribute("href"),
    ).toContain("cref-rj.implanta.net.br");
  });
  it("keeps manual identity and evidence checks when validating a registration", async () => {
    const registration = {
      userId: "coach",
      fullName: "Profissional Teste",
      cref: "987654-G",
      region: "SP" as const,
      category: "Bacharel",
      status: "PENDING_VERIFICATION",
      revision: 5,
      verifiedAt: null,
      validUntil: null,
      publicReason: null,
      updatedAt: "2026-10-29T12:00:00Z",
    };
    vi.mocked(reviewProfessionalRegistrationAction).mockResolvedValue({
      status: 200,
      data: { ...registration, status: "VERIFIED" },
    });
    render(<ProfessionalReview registration={registration} />);
    fireEvent.change(screen.getByLabelText("Resultado"), {
      target: { value: "VERIFIED" },
    });
    for (const label of [
      "Titularidade e nome conferidos",
      "Registro ativo confirmado",
      "Categoria e habilitação compatíveis confirmadas",
    ])
      fireEvent.click(screen.getByLabelText(label));
    fireEvent.change(
      screen.getByLabelText("Método de conferência da titularidade"),
      { target: { value: "LIVE_IDENTITY_CHECK" } },
    );
    fireEvent.change(
      screen.getByLabelText("Referência restrita da conferência"),
      { target: { value: "Protocolo QA" } },
    );
    fireEvent.change(
      screen.getByLabelText("Evidência mínima (acesso restrito)"),
      { target: { value: "Cadastro conferido na consulta oficial." } },
    );
    fireEvent.change(
      screen.getByLabelText("Orientação visível ao profissional"),
      { target: { value: "Registro e habilitação conferidos." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Registrar revisão" }));
    await waitFor(() =>
      expect(reviewProfessionalRegistrationAction).toHaveBeenCalledWith(
        "coach",
        expect.objectContaining({
          revision: 5,
          result: "VERIFIED",
          identityMatched: true,
          registrationActive: true,
          scopeConfirmed: true,
          identityVerificationMethod: "LIVE_IDENTITY_CHECK",
          sourceUrl:
            "https://cref-sp.implanta.net.br/servicosOnline/Publico/ConsultaInscritos",
        }),
      ),
    );
  });
});
