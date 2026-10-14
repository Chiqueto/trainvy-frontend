/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import AthleteDetailsPage from "@/app/personal/alunos/[athleteId]/page";
import AthleteNotFound from "@/app/personal/alunos/[athleteId]/not-found";
import AthleteDetailsLoading from "@/app/personal/alunos/[athleteId]/loading";
import { RevokeAthleteModal } from "@/app/personal/alunos/[athleteId]/_components/revoke-athlete-modal";
import { AthletesList } from "@/app/personal/_components/athletes-list";
import { revokeStudentAction } from "@/app/personal/_actions";
import {
  getCoachAthleteDetails,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";

// Mocks
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT: ${url}`);
});
const mockNotFound = vi.fn().mockImplementation(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/personal",
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

vi.mock("@/app/personal/_actions", () => ({
  revokeStudentAction: vi.fn(),
}));

vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: vi.fn(),
  getCoachAthleteDetails: vi.fn(),
  listCoachAthletePrescriptions: vi.fn().mockResolvedValue({ status: 200, data: [] }),
}));

vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn().mockResolvedValue({
    accountType: "COACH",
    accountSetupCompletedAt: "2026-01-01T00:00:00.000Z",
  }),
}));

vi.mock("nuqs", () => ({
  useQueryStates: () => [{}, vi.fn()],
  parseAsBoolean: { withDefault: () => ({}) },
  parseAsString: {},
}));

vi.mock("@/app/_components/chat-open-button", () => ({
  ChatOpenButton: () => <button aria-label="Abrir Chat">Chat</button>,
}));

describe("TASK 6.2A — Coach Athlete Overview & Details UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. AthletesList — Busca em tempo real e Navegação para Detalhes", () => {
    const mockAthletes = [
      {
        linkId: "link-1",
        athleteId: "ath-1",
        name: "Carlos Atleta",
        email: "carlos@test.com",
        acceptedAt: "2026-10-10T12:00:00.000Z",
      },
      {
        linkId: "link-2",
        athleteId: "ath-2",
        name: "Mariana Silva",
        email: "mariana@test.com",
        acceptedAt: "2026-10-12T12:00:00.000Z",
      },
    ];

    it("renderiza campo de busca e lista de alunos vinculados com link para detalhes", () => {
      render(<AthletesList athletes={mockAthletes} />);

      expect(screen.getByPlaceholderText(/buscar aluno por nome ou email/i)).toBeDefined();
      expect(screen.getByText("Carlos Atleta")).toBeDefined();
      expect(screen.getByText("Mariana Silva")).toBeDefined();

      // Verifica link de navegação para /personal/alunos/[athleteId]
      const carlosLink = screen.getByRole("link", { name: /carlos atleta/i });
      expect(carlosLink.getAttribute("href")).toBe("/personal/alunos/ath-1");

      const marianaLink = screen.getByRole("link", { name: /mariana silva/i });
      expect(marianaLink.getAttribute("href")).toBe("/personal/alunos/ath-2");
    });

    it("filtra alunos em tempo real por nome", () => {
      render(<AthletesList athletes={mockAthletes} />);

      const searchInput = screen.getByPlaceholderText(/buscar aluno por nome ou email/i);
      fireEvent.change(searchInput, { target: { value: "Mariana" } });

      expect(screen.getByText("Mariana Silva")).toBeDefined();
      expect(screen.queryByText("Carlos Atleta")).toBeNull();
    });

    it("filtra alunos em tempo real por email", () => {
      render(<AthletesList athletes={mockAthletes} />);

      const searchInput = screen.getByPlaceholderText(/buscar aluno por nome ou email/i);
      fireEvent.change(searchInput, { target: { value: "carlos@test.com" } });

      expect(screen.getByText("Carlos Atleta")).toBeDefined();
      expect(screen.queryByText("Mariana Silva")).toBeNull();
    });

    it("exibe mensagem amigável quando nenhum aluno corresponde à busca", () => {
      render(<AthletesList athletes={mockAthletes} />);

      const searchInput = screen.getByPlaceholderText(/buscar aluno por nome ou email/i);
      fireEvent.change(searchInput, { target: { value: "Inexistente" } });

      expect(screen.getByText(/nenhum aluno encontrado para/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /limpar busca/i })).toBeDefined();

      // Limpar busca restaura a lista
      fireEvent.click(screen.getByRole("button", { name: /limpar busca/i }));
      expect(screen.getByText("Carlos Atleta")).toBeDefined();
      expect(screen.getByText("Mariana Silva")).toBeDefined();
    });
  });

  describe("2. AthleteDetailsPage — Autorização, Isolamento IDOR e Privacidade", () => {
    it("renderiza página de detalhes com informações autorizadas do aluno", async () => {
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
          entitlements: [{ key: "MANAGE_ATHLETES", limitValue: 5 }],
        },
      });

      (getCoachAthleteDetails as any).mockResolvedValue({
        status: 200,
        data: {
          linkId: "link-123",
          athleteId: "ath-123",
          name: "Lucas Aluno",
          email: "lucas@aluno.test",
          image: null,
          acceptedAt: "2026-10-01T10:00:00.000Z",
          status: "ACTIVE",
        },
      });

      const Page = await AthleteDetailsPage({
        params: Promise.resolve({ athleteId: "ath-123" }),
      });

      render(Page);

      expect(screen.getByText("Lucas Aluno")).toBeDefined();
      expect(screen.getByText("lucas@aluno.test")).toBeDefined();
      expect(screen.getByText("Vínculo Ativo")).toBeDefined();
      expect(screen.getByText("Início do Vínculo")).toBeDefined();
      expect(screen.getByText(/Voltar para Alunos/i)).toBeDefined();

      // Guardrail de privacidade: não renderiza prescrição ou métricas privadas
      expect(screen.queryByText(/Histórico detalhado de treinos/i)).toBeNull();
      expect(screen.queryByText(/Cargas máximas/i)).toBeNull();
      expect(screen.queryByText(/Conversas de IA/i)).toBeNull();
    });

    it("IDOR Defense: dispara notFound() quando o aluno não pertence ao treinador ou está inativo", async () => {
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
          entitlements: [{ key: "MANAGE_ATHLETES", limitValue: 5 }],
        },
      });

      // API retorna 404 (IDOR prevenido no backend)
      (getCoachAthleteDetails as any).mockResolvedValue({
        status: 404,
        data: { error: "Aluno não encontrado ou vínculo inativo com este treinador." },
      });

      await expect(
        AthleteDetailsPage({
          params: Promise.resolve({ athleteId: "ath-alheio-ou-revogado" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });

    it("bloqueia acesso se o usuário logado não for conta COACH", async () => {
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "ATHLETE",
          entitlements: [],
        },
      });

      await expect(
        AthleteDetailsPage({
          params: Promise.resolve({ athleteId: "ath-123" }),
        }),
      ).rejects.toThrow("NEXT_REDIRECT: /profile");
    });

    it("bloqueia acesso se o treinador não tiver entitlement MANAGE_ATHLETES", async () => {
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
          entitlements: [{ key: "COACH_DASHBOARD", limitValue: null }],
        },
      });

      await expect(
        AthleteDetailsPage({
          params: Promise.resolve({ athleteId: "ath-123" }),
        }),
      ).rejects.toThrow("NEXT_REDIRECT: /personal");
    });
  });

  describe("3. RevokeAthleteModal — Modal de Encerramento com Confirmação Segura", () => {
    it("abre modal de confirmação ao clicar no botão de encerramento", () => {
      render(<RevokeAthleteModal linkId="link-xyz" athleteName="Lucas Aluno" />);

      const triggerBtn = screen.getByRole("button", { name: /encerrar vínculo com aluno/i });
      fireEvent.click(triggerBtn);

      expect(screen.getByText("Encerrar Vínculo")).toBeDefined();
      expect(screen.getByText(/Tem certeza de que deseja encerrar o acompanhamento de/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /sim, encerrar vínculo/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeDefined();
    });

    it("executa ação de encerramento e navega para /personal após confirmação", async () => {
      (revokeStudentAction as any).mockResolvedValue({ success: true });

      render(<RevokeAthleteModal linkId="link-xyz" athleteName="Lucas Aluno" />);

      fireEvent.click(screen.getByRole("button", { name: /encerrar vínculo com aluno/i }));
      fireEvent.click(screen.getByRole("button", { name: /sim, encerrar vínculo/i }));

      await waitFor(() => {
        expect(revokeStudentAction).toHaveBeenCalledWith("link-xyz");
        expect(mockPush).toHaveBeenCalledWith("/personal");
      });
    });
  });

  describe("4. Estados de UI (Loading e Not-Found)", () => {
    it("renderiza Skeleton de Loading sem falhas", () => {
      const { container } = render(<AthleteDetailsLoading />);
      expect(container.querySelector(".animate-pulse")).toBeDefined();
      expect(screen.getByText(/Voltar para Alunos/i)).toBeDefined();
    });

    it("renderiza tela de Not-Found amigável", () => {
      render(<AthleteNotFound />);
      expect(screen.getByText("Aluno Não Encontrado")).toBeDefined();
      expect(screen.getByRole("link", { name: /voltar para meus alunos/i })).toBeDefined();
    });
  });
});
