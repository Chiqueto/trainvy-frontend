import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PersonalPage from "@/app/personal/page";

vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn(),
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: async () => ({
    status: 200,
    data: {
      accountType: "COACH",
      professionalAccessGranted: false,
      entitlements: [],
    },
  }),
  getProfessionalRegistration: async () => ({ status: 200, data: null }),
  listCoachAthletes: vi.fn(),
  listCoachInvitations: vi.fn(),
}));
vi.mock("@/app/personal/_components/personal-header", () => ({
  PersonalHeader: () => <h1>Painel do Personal</h1>,
}));
vi.mock("@/app/_components/bottom-nav", () => ({ BottomNav: () => null }));
vi.mock("@/app/_components/legal-consent", () => ({
  LegalConsent: () => <div>Consentimentos</div>,
}));
vi.mock("@/app/personal/_components/professional-registration-form", () => ({
  ProfessionalRegistrationForm: () => <div>Cadastro profissional</div>,
}));
afterEach(cleanup);
describe("Personal sem liberação", () => {
  it("shows consent and registration without promoting drafts, AI or archived prescriptions", async () => {
    render(await PersonalPage());
    expect(screen.getByText("Cadastro profissional")).toBeTruthy();
    expect(screen.getByText("Consentimentos")).toBeTruthy();
    expect(
      screen.queryByText(
        /rascunhos|demonstração|copiloto|prescrições anteriores/i,
      ),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /arquivo/i })).toBeNull();
  });
});
