import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AthletesList } from "@/app/personal/_components/athletes-list";
import { CoachPendingSubscriptionCard } from "@/app/personal/_components/coach-pending-subscription-card";
import { InvitationsList } from "@/app/personal/_components/invitations-list";
import { PersonalQuotaCard } from "@/app/personal/_components/personal-quota-card";
import { CoachAreaLinkCard } from "@/app/profile/_components/coach-area-link-card";
import { MyCoachSection } from "@/app/profile/_components/my-coach-section";
import { InvitationPreviewCard } from "@/app/convite/[token]/_components/invitation-preview-card";

// Mocks de navegação e server actions
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/app/personal/_actions", () => ({
  createInvitationAction: vi.fn().mockResolvedValue({
    success: true,
    data: { token: "tok-123", expiresAt: "2026-10-21T00:00:00.000Z" },
  }),
  cancelInvitationAction: vi.fn().mockResolvedValue({ success: true }),
  revokeStudentAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/app/convite/[token]/_actions", () => ({
  acceptInvitationAction: vi.fn().mockResolvedValue({
    success: true,
    coachName: "Coach Teste",
  }),
  revokeCoachAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Coach ↔ Athlete Foundation (Task 6.1 Frontend)", () => {
  describe("1. PersonalQuotaCard", () => {
    it("renderiza contagem e capacidade disponível", () => {
      render(<PersonalQuotaCard activeCount={2} limit={5} />);

      expect(screen.getByText("2")).toBeDefined();
      expect(screen.getByText("/ 5 alunos")).toBeDefined();
      expect(screen.getByText("3 vaga(s) livre(s)")).toBeDefined();
    });

    it("destaca limite atingido quando activeCount >= limit", () => {
      render(<PersonalQuotaCard activeCount={5} limit={5} />);

      expect(screen.getByText("Limite atingido")).toBeDefined();
    });

    it("renderiza plano ilimitado corretamente", () => {
      render(<PersonalQuotaCard activeCount={12} limit={null} />);

      expect(screen.getByText("12")).toBeDefined();
      expect(screen.getByText("/ Ilimitado")).toBeDefined();
      expect(screen.queryByText("vaga(s) livre(s)")).toBeNull();
    });
  });

  describe("2. AthletesList", () => {
    it("renderiza estado vazio amigável quando não há alunos", () => {
      render(<AthletesList athletes={[]} />);

      expect(screen.getByText("Nenhum aluno ativo")).toBeDefined();
      expect(
        screen.getByText(
          /Seus alunos vinculados aparecerão aqui assim que aceitarem/i,
        ),
      ).toBeDefined();
    });

    it("renderiza lista de alunos ativos com dados e botão de encerramento", () => {
      const mockAthletes = [
        {
          linkId: "link-1",
          athleteId: "ath-1",
          name: "Carlos Atleta",
          email: "carlos@test.com",
          acceptedAt: "2026-10-10T12:00:00.000Z",
        },
      ];

      render(<AthletesList athletes={mockAthletes} />);

      expect(screen.getByText("Carlos Atleta")).toBeDefined();
      expect(screen.getByText("carlos@test.com")).toBeDefined();

      // Clicar em Encerrar exibe confirmação inline
      const revokeBtn = screen.getByRole("button", { name: /encerrar/i });
      fireEvent.click(revokeBtn);

      expect(screen.getByText("Encerrar?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Sim" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Não" })).toBeDefined();
    });
  });

  describe("3. InvitationsList", () => {
    it("não renderiza nada se não houver convites pendentes", () => {
      const { container } = render(<InvitationsList invitations={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renderiza convite pendente com badge e botão de cancelamento", () => {
      const mockInvites = [
        {
          id: "inv-1",
          status: "PENDING" as const,
          expiresAt: "2026-10-20T12:00:00.000Z",
          createdAt: "2026-10-13T12:00:00.000Z",
        },
      ];

      render(<InvitationsList invitations={mockInvites} />);

      expect(screen.getByText("Aguardando Aceite")).toBeDefined();

      // Clicar em Cancelar exibe confirmação inline
      const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText("Cancelar?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Sim" })).toBeDefined();
    });
  });

  describe("4. InvitationPreviewCard (Tela de Aceite)", () => {
    it("renderiza card de indisponibilidade quando convite é inválido", () => {
      render(
        <InvitationPreviewCard
          token="invalid-tok"
          isValid={false}
          message="Este convite expirou."
          coach={null}
          currentUser={null}
        />,
      );

      expect(screen.getByText("Convite Indisponível")).toBeDefined();
      expect(screen.getByText("Este convite expirou.")).toBeDefined();
    });

    it("renderiza informações do treinador e botão de login para visitante", () => {
      render(
        <InvitationPreviewCard
          token="valid-tok"
          isValid={true}
          coach={{ id: "c-1", name: "Coach Rodrigo", image: null }}
          currentUser={null}
        />,
      );

      expect(screen.getByText("Coach Rodrigo")).toBeDefined();
      expect(screen.getByText(/Seus dados continuam sob seu controle/i)).toBeDefined();
      expect(
        screen.getByRole("button", {
          name: /entrar ou cadastrar-se para aceitar/i,
        }),
      ).toBeDefined();
    });

    it("renderiza botão de aceite para atleta autenticado", () => {
      render(
        <InvitationPreviewCard
          token="valid-tok"
          isValid={true}
          coach={{ id: "c-1", name: "Coach Rodrigo", image: null }}
          currentUser={{
            id: "ath-1",
            name: "Atleta João",
            email: "joao@test.com",
            accountType: "ATHLETE",
          }}
        />,
      );

      expect(
        screen.getByRole("button", {
          name: /aceitar convite de treinador/i,
        }),
      ).toBeDefined();
      expect(screen.getByRole("button", { name: /recusar convite/i })).toBeDefined();
    });
  });

  describe("5. MyCoachSection (Perfil do Atleta)", () => {
    it("renderiza estado autônomo quando atleta não possui treinador", () => {
      render(<MyCoachSection relationship={null} />);

      expect(screen.getByText("Meu Treinador")).toBeDefined();
      expect(
        screen.getByText(
          "Nenhum treinador vinculado. Você treina de forma autônoma.",
        ),
      ).toBeDefined();
    });

    it("renderiza treinador ativo e permite confirmar encerramento", () => {
      const rel = {
        linkId: "link-active",
        coachId: "coach-1",
        coachName: "Prof. Marcos",
        coachEmail: "marcos@coach.com",
        coachImage: null,
        acceptedAt: "2026-10-01T10:00:00.000Z",
      };

      render(<MyCoachSection relationship={rel} />);

      expect(screen.getByText("Prof. Marcos")).toBeDefined();
      expect(screen.getByText("marcos@coach.com")).toBeDefined();

      const revokeBtn = screen.getByRole("button", { name: /encerrar/i });
      fireEvent.click(revokeBtn);

      expect(screen.getByText("Encerrar?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Sim" })).toBeDefined();
    });
  });

  describe("6. Componentes Auxiliares", () => {
    it("CoachAreaLinkCard direciona para /personal", () => {
      render(<CoachAreaLinkCard />);

      expect(screen.getByText("Área do Personal")).toBeDefined();
      expect(
        screen.getByText("Gerencie seus alunos vinculados e convites"),
      ).toBeDefined();
    });

    it("CoachPendingSubscriptionCard explica status pendente preservando treinos próprios", () => {
      render(
        <CoachPendingSubscriptionCard
          planName="Coach Pro"
          status="PENDING"
        />,
      );

      expect(
        screen.getByText("Assessoria de Alunos Aguardando Liberação"),
      ).toBeDefined();
      expect(
        screen.getByText(/Seus treinos pessoais continuam ativos/i),
      ).toBeDefined();
    });
  });
});
