/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  sanitizeReturnTo,
  RETURN_TO_COOKIE_NAME,
  setReturnToCookie,
  readReturnToCookie,
  consumeReturnToCookie,
  getReturnToCookie,
  clearReturnToCookie,
} from "@/app/_lib/auth-return-to";
import { finishSignup } from "@/app/auth/_actions";
import { InvitationPreviewCard } from "@/app/convite/[token]/_components/invitation-preview-card";
import { SignInWithGoogle } from "@/app/auth/_components/sign-in-with-google";
import { authClient } from "@/app/_lib/auth-client";

// Mock next/headers
const mockCookiesStore = new Map<string, any>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => mockCookiesStore.get(name),
    set: (name: string, value: string, options: any) => {
      mockCookiesStore.set(name, { value, ...options });
    },
    delete: (name: string) => {
      mockCookiesStore.delete(name);
    },
  })),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock API calls in finishSignup
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: vi.fn(),
  completeSignup: vi.fn(),
  createSignupIntent: vi.fn(),
  listPublicPlans: vi.fn(),
}));

// Mock authClient
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
    getSession: vi.fn(),
  },
}));

describe("TASK 6.1.1 — Coach ↔ Athlete Security & Reliability Hardening", () => {
  beforeEach(() => {
    mockCookiesStore.clear();
    vi.clearAllMocks();
  });

  describe("1. Validação estrita de redirecionamento (Open Redirect Prevention)", () => {
    it("permite caminhos válidos no formato /convite/[token]", () => {
      expect(sanitizeReturnTo("/convite/abc12345678")).toBe("/convite/abc12345678");
      expect(sanitizeReturnTo("/convite/token_com_hifen-e-underline_1234")).toBe(
        "/convite/token_com_hifen-e-underline_1234",
      );
    });

    it("bloqueia URLs absolutas externas e domínios maliciosos", () => {
      expect(sanitizeReturnTo("https://evil.com")).toBeNull();
      expect(sanitizeReturnTo("http://attacker.com/convite/token12345678")).toBeNull();
      expect(sanitizeReturnTo("https://trainvy.fake.com")).toBeNull();
    });

    it("bloqueia URLs protocol-relative (//evil.com)", () => {
      expect(sanitizeReturnTo("//evil.com")).toBeNull();
      expect(sanitizeReturnTo("//evil.com/convite/token12345678")).toBeNull();
    });

    it("bloqueia javascript: e data: URIs", () => {
      expect(sanitizeReturnTo("javascript:alert(1)")).toBeNull();
      expect(sanitizeReturnTo("javascript:void(0)")).toBeNull();
      expect(sanitizeReturnTo("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    });

    it("bloqueia tentativas de directory traversal e barras invertidas", () => {
      expect(sanitizeReturnTo("/convite/../admin")).toBeNull();
      expect(sanitizeReturnTo("/convite/..\\evil")).toBeNull();
      expect(sanitizeReturnTo("/convite/token\\admin")).toBeNull();
    });

    it("bloqueia caminhos internos que não sejam a rota de convites", () => {
      expect(sanitizeReturnTo("/admin")).toBeNull();
      expect(sanitizeReturnTo("/profile")).toBeNull();
      expect(sanitizeReturnTo("/api/auth/signout")).toBeNull();
      expect(sanitizeReturnTo("/onboarding")).toBeNull();
    });

    it("bloqueia tokens com tamanho fora dos limites de segurança", () => {
      expect(sanitizeReturnTo("/convite/short")).toBeNull(); // < 8 caracteres
      expect(sanitizeReturnTo(`/convite/${"a".repeat(200)}`)).toBeNull(); // > 128 caracteres
    });
  });

  describe("2. Gerenciamento de Cookies HttpOnly para Preservação do Convite", () => {
    it("grava cookie com flags de segurança (HttpOnly, SameSite, MaxAge)", async () => {
      const ok = await setReturnToCookie("/convite/valid_token_1234");
      expect(ok).toBe(true);

      const cookie = mockCookiesStore.get(RETURN_TO_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie.value).toBe("/convite/valid_token_1234");
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.sameSite).toBe("lax");
      expect(cookie.path).toBe("/");
    });

    it("não grava cookie para destinos inválidos", async () => {
      const ok = await setReturnToCookie("https://evil.com");
      expect(ok).toBe(false);
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("recupera o destino e limpa o cookie quando solicitado", async () => {
      await setReturnToCookie("/convite/valid_token_1234");

      const retrieved = await getReturnToCookie(true);
      expect(retrieved).toBe("/convite/valid_token_1234");

      // O cookie foi apagado após o consumo
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("descarta cookies corrompidos ou maliciosos automaticamente com consumeReturnToCookie", async () => {
      mockCookiesStore.set(RETURN_TO_COOKIE_NAME, { value: "https://evil.com" });

      const retrieved = await consumeReturnToCookie();
      expect(retrieved).toBeNull();
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("readReturnToCookie retorna null de forma segura sem mutar cookies", async () => {
      mockCookiesStore.set(RETURN_TO_COOKIE_NAME, { value: "https://evil.com" });

      const retrieved = await readReturnToCookie();
      expect(retrieved).toBeNull();
      // Não removeu o cookie porque leitura em Server Components é estritamente imutável
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeDefined();
    });
  });

  describe("3. Fluxo de finishSignup com preservação de retorno", () => {
    it("atleta já cadastrado com login Google: retorna ao convite e limpa cookie", async () => {
      const { getCommercialContext } = await import("@/app/_lib/api/fetch-generated");
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountSetupCompletedAt: "2026-01-01T00:00:00.000Z",
          accountType: "ATHLETE",
        },
      });

      await setReturnToCookie("/convite/existing_ath_token");

      const result = await finishSignup();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destination).toBe("/convite/existing_ath_token");
      }
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("atleta já cadastrado sem cookie de retorno: vai para a home '/'", async () => {
      const { getCommercialContext } = await import("@/app/_lib/api/fetch-generated");
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountSetupCompletedAt: "2026-01-01T00:00:00.000Z",
          accountType: "ATHLETE",
        },
      });

      const result = await finishSignup();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destination).toBe("/");
      }
    });

    it("atleta novo completando cadastro: vai para /onboarding e preserva o cookie do convite", async () => {
      const { getCommercialContext, completeSignup } = await import(
        "@/app/_lib/api/fetch-generated"
      );
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountSetupCompletedAt: null,
          accountType: "ATHLETE",
        },
      });

      mockCookiesStore.set("trainvy-signup-intent", { value: "intent-token-123" });
      await setReturnToCookie("/convite/new_ath_token");

      (completeSignup as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "ATHLETE",
        },
      });

      const result = await finishSignup();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destination).toBe("/onboarding");
      }

      // O cookie trainvy-return-to DEVE continuar preservado para após o onboarding!
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)?.value).toBe("/convite/new_ath_token");
    });

    it("treinador novo completando cadastro: limpa o cookie de convite e vai para /auth/welcome", async () => {
      const { getCommercialContext, completeSignup } = await import(
        "@/app/_lib/api/fetch-generated"
      );
      (getCommercialContext as any).mockResolvedValue({
        status: 200,
        data: {
          accountSetupCompletedAt: null,
          accountType: "COACH",
        },
      });

      mockCookiesStore.set("trainvy-signup-intent", { value: "intent-token-coach" });
      await setReturnToCookie("/convite/coach_should_not_have_this");

      (completeSignup as any).mockResolvedValue({
        status: 200,
        data: {
          accountType: "COACH",
        },
      });

      const result = await finishSignup();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destination).toBe("/auth/welcome");
      }

      // Treinador não pode aceitar convite como aluno; o cookie deve ser limpo
      expect(mockCookiesStore.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });
  });

  describe("4. Componente SignInWithGoogle com returnTo", () => {
    it("inclui returnTo sanitizado nas URLs de callback do Better Auth", async () => {
      render(<SignInWithGoogle returnTo="/convite/tok_google_123" />);

      const btn = screen.getByRole("button", { name: /fazer login com google/i });
      btn.click();

      await waitFor(() => {
        expect(authClient.signIn.social).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: "google",
            requestSignUp: false,
            callbackURL: expect.stringContaining("returnTo=%2Fconvite%2Ftok_google_123"),
            errorCallbackURL: expect.stringContaining("returnTo=%2Fconvite%2Ftok_google_123"),
          }),
        );
      });
    });

    it("usa callback padrão quando não há returnTo", async () => {
      render(<SignInWithGoogle />);

      const btn = screen.getByRole("button", { name: /fazer login com google/i });
      btn.click();

      await waitFor(() => {
        expect(authClient.signIn.social).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: "google",
            requestSignUp: false,
            callbackURL: expect.not.stringContaining("returnTo="),
            errorCallbackURL: expect.not.stringContaining("returnTo="),
          }),
        );
      });
    });
  });

  describe("5. Interface do Convite (InvitationPreviewCard)", () => {
    it("exibe link para /auth com returnTo quando o usuário está deslogado", () => {
      render(
        <InvitationPreviewCard
          token="token_deslogado_123"
          isValid={true}
          coach={{ id: "coach-1", name: "Rodrigo Treinador" }}
          currentUser={null}
        />,
      );

      const authLink = screen.getByRole("link", {
        name: /entrar ou cadastrar-se para aceitar/i,
      });
      expect(authLink.getAttribute("href")).toBe("/auth?returnTo=/convite/token_deslogado_123");
    });

    it("bloqueia conta COACH de aceitar convite de outro treinador na UI", () => {
      render(
        <InvitationPreviewCard
          token="token_coach_block"
          isValid={true}
          coach={{ id: "coach-1", name: "Rodrigo Treinador" }}
          currentUser={{
            id: "coach-2",
            name: "Outro Treinador",
            email: "outro@coach.com",
            accountType: "COACH",
          }}
        />,
      );

      expect(
        screen.getByText(/Sua conta atual é do tipo Treinador \(COACH\)/i),
      ).toBeDefined();
      expect(screen.queryByRole("button", { name: /aceitar convite/i })).toBeNull();
    });

    it("exibe botão de confirmação explícita para atleta logado (sem aceite automático)", () => {
      render(
        <InvitationPreviewCard
          token="token_ath_ready"
          isValid={true}
          coach={{ id: "coach-1", name: "Rodrigo Treinador" }}
          currentUser={{
            id: "ath-1",
            name: "Aluno Pronto",
            email: "aluno@test.com",
            accountType: "ATHLETE",
          }}
        />,
      );

      const acceptBtn = screen.getByRole("button", { name: /aceitar convite de treinador/i });
      expect(acceptBtn).toBeDefined();
    });
  });
});
