import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PersonalPage from "@/app/personal/page";
import { ProfessionalProfileCard } from "@/app/profile/_components/professional-profile-card";

const state = vi.hoisted(() => ({ access: false }));

vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn(),
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: async () => ({
    status: 200,
    data: {
      accountType: "COACH",
      professionalAccessGranted: state.access,
      entitlements: state.access ? [{ key: "MANAGE_ATHLETES" }] : [],
    },
  }),
  getProfessionalRegistration: async () => ({ status: 200, data: null }),
  listCoachAthletes: async () => ({
    status: 200,
    data: { athletes: [], activeCount: 0, limit: 5 },
  }),
  listCoachInvitations: async () => ({ status: 200, data: [] }),
}));
vi.mock("@/app/personal/_components/personal-header", () => ({
  PersonalHeader: () => <h1>Painel do Personal</h1>,
}));
vi.mock("@/app/_components/bottom-nav", () => ({ BottomNav: () => null }));
vi.mock("@/app/personal/_components/athletes-list", () => ({
  AthletesList: () => <h2>Lista de alunos</h2>,
}));
vi.mock("@/app/personal/_components/coach-first-steps-card", () => ({
  CoachFirstStepsCard: () => null,
}));
vi.mock("@/app/personal/_components/invite-student-modal", () => ({
  InviteStudentModal: () => <button>Convidar aluno</button>,
}));
vi.mock("@/app/personal/_components/invitations-list", () => ({
  InvitationsList: () => null,
}));
vi.mock("@/app/personal/_components/personal-quota-card", () => ({
  PersonalQuotaCard: () => <p>Limite de alunos</p>,
}));
vi.mock("@/app/_components/legal-consent", () => ({
  LegalConsent: () => <div>Consentimentos</div>,
}));
vi.mock("@/app/personal/_components/professional-registration-form", () => ({
  ProfessionalRegistrationForm: () => <div>Cadastro profissional</div>,
}));
afterEach(cleanup);
beforeEach(() => {
  state.access = false;
});
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

  it("prioriza os alunos e mantém o arquivo como recurso secundário sem o CREF no painel", async () => {
    state.access = true;
    render(await PersonalPage());
    const students = screen.getByRole("heading", { name: "Lista de alunos" });
    const resources = screen.getByRole("region", {
      name: "Recursos da assessoria",
    });
    expect(
      students.compareDocumentPosition(resources) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Prescrições arquivadas/ })
        .getAttribute("href"),
    ).toBe("/personal/arquivo");
    expect(
      screen.queryByRole("link", { name: /CREF|consultar cadastro/ }),
    ).toBeNull();
  });

  it.each([
    ["DECLARED_ACTIVE", "CREF declarado"],
    ["VERIFIED_ADMIN", "Conferido pela administração"],
    ["EXPIRED", "Verificação expirada"],
  ])(
    "apresenta %s no cartão de cadastro profissional do Perfil",
    (status, label) => {
      render(
        <ProfessionalProfileCard
          verification={{
            status: "VERIFIED",
            validUntil: null,
            crefVerificationStatus: status,
          }}
        />,
      );
      expect(screen.getByText(label)).toBeTruthy();
      expect(
        screen
          .getByRole("link", { name: /Cadastro profissional/ })
          .getAttribute("href"),
      ).toBe("/personal/verification");
    },
  );
});
