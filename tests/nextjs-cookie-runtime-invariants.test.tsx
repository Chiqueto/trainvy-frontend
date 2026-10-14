/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { RETURN_TO_COOKIE_NAME } from "@/app/_lib/auth-return-to";
import { setAuthReturnToAction, beginSignup } from "@/app/auth/_actions";
import { GET as returnRouteHandler } from "@/app/auth/return/route";

// Cookie storage for tests
const cookieJar = new Map<string, any>();

// Invariant flag: when true, cookie mutations throw runtime error exactly as Next.js App Router does during Server Component render.
let allowCookieMutation = false;

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string, options: any) => {
      if (!allowCookieMutation) {
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options",
        );
      }
      cookieJar.set(name, { value, ...options });
    },
    delete: (name: string) => {
      if (!allowCookieMutation) {
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiesdelete",
        );
      }
      cookieJar.delete(name);
    },
  })),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/navigation redirect with proper NEXT_REDIRECT error
class NextRedirectError extends Error {
  digest: string;
  url: string;
  constructor(url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.name = "NextRedirectError";
    this.url = url;
    this.digest = `NEXT_REDIRECT;${url}`;
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new NextRedirectError(url);
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock authClient
const mockAuthClient = {
  getSession: vi.fn(),
  signIn: {
    social: vi.fn(),
  },
};

vi.mock("@/app/_lib/auth-client", () => ({
  authClient: mockAuthClient,
}));

// Mock API endpoints
const mockGetCommercialContext = vi.fn();
const mockGetUserTrainData = vi.fn();
const mockGetHomeData = vi.fn();
const mockGetActiveWorkoutSession = vi.fn();
const mockCreateSignupIntent = vi.fn();

vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: () => mockGetCommercialContext(),
  getUserTrainData: () => mockGetUserTrainData(),
  getHomeData: () => mockGetHomeData(),
  getActiveWorkoutSession: () => mockGetActiveWorkoutSession(),
  createSignupIntent: (body: any) => mockCreateSignupIntent(body),
  listPublicPlans: vi.fn(),
  completeSignup: vi.fn(),
}));

vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn().mockResolvedValue({
    accountType: "ATHLETE",
    accountSetupCompletedAt: "2026-01-01T00:00:00.000Z",
  }),
}));

vi.mock("@/app/_components/chat", () => ({
  Chat: () => <div data-testid="chat-mock" />,
}));

describe("Task 6.1.2 — Next.js App Router Cookie Runtime Invariants", () => {
  beforeEach(() => {
    cookieJar.clear();
    vi.clearAllMocks();
    // Default to strict runtime enforcement: Server Component rendering mode
    allowCookieMutation = false;
  });

  describe("1. Renderização de Server Components com proibição estrita de mutação de cookies", () => {
    it("AuthPage (deslogado) renderiza com returnTo sem invocar cookies().set() ou delete()", async () => {
      mockAuthClient.getSession.mockResolvedValue({ data: null });
      const { default: AuthPage } = await import("@/app/auth/page");

      // Se cookies().set() ou delete() fosse chamado durante o render, lançaria erro imediatamente
      const result = await AuthPage({
        searchParams: Promise.resolve({ returnTo: "/convite/token_valido_123" }),
      });

      expect(result).toBeDefined();
      expect(result.type).toBe("div");
      // Cookie NÃO deve ser mutado no Server Component
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("AuthPage (logado) redireciona diretamente para o returnTo sem invocar cookies().delete()", async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { user: { id: "user-1", name: "Atleta" } },
      });
      const { default: AuthPage } = await import("@/app/auth/page");

      await expect(
        AuthPage({
          searchParams: Promise.resolve({ returnTo: "/convite/token_valido_123" }),
        }),
      ).rejects.toThrow("NEXT_REDIRECT: /convite/token_valido_123");

      // Não houve mutação de cookie durante render
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("SignupPage (deslogado) renderiza com returnTo sem invocar cookies().set() ou delete()", async () => {
      mockAuthClient.getSession.mockResolvedValue({ data: null });
      const { default: SignupPage } = await import("@/app/auth/signup/page");

      const result = await SignupPage({
        searchParams: Promise.resolve({ returnTo: "/convite/token_valido_123" }),
      });

      expect(result).toBeDefined();
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("SignupPage (logado com setup concluído) redireciona para returnTo sem mutar cookies", async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockGetCommercialContext.mockResolvedValue({
        status: 200,
        data: { accountSetupCompletedAt: "2026-01-01T00:00:00.000Z" },
      });
      const { default: SignupPage } = await import("@/app/auth/signup/page");

      await expect(
        SignupPage({
          searchParams: Promise.resolve({ returnTo: "/convite/token_valido_123" }),
        }),
      ).rejects.toThrow("NEXT_REDIRECT: /convite/token_valido_123");

      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("OnboardingPage redireciona para Route Handler /auth/return sem mutar cookies durante render", async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      // Dados já preenchidos (onboarding concluído)
      mockGetUserTrainData.mockResolvedValue({
        status: 200,
        data: { weightInGrams: 75000 },
      });
      // Existe cookie de convite gravado anteriormente
      cookieJar.set(RETURN_TO_COOKIE_NAME, { value: "/convite/tok_retorno_onboarding" });

      const { default: OnboardingPage } = await import("@/app/onboarding/page");

      // Deve redirecionar para o Route Handler /auth/return (que tem permissão de mutação)
      await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT: /auth/return");

      // O Server Component NÃO deletou o cookie diretamente durante render
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)?.value).toBe("/convite/tok_retorno_onboarding");
    });

    it("Home page redireciona para Route Handler /auth/return sem mutar cookies durante render", async () => {
      mockAuthClient.getSession.mockResolvedValue({
        data: { user: { id: "user-1", name: "Atleta" } },
      });
      cookieJar.set(RETURN_TO_COOKIE_NAME, { value: "/convite/tok_retorno_home" });

      const { default: Home } = await import("@/app/page");

      await expect(Home()).rejects.toThrow("NEXT_REDIRECT: /auth/return");

      // O Server Component NÃO deletou o cookie diretamente durante render
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)?.value).toBe("/convite/tok_retorno_home");
    });
  });

  describe("2. Route Handler /auth/return e Server Actions (Mutações Permitidas)", () => {
    it("Route Handler GET /auth/return consome e remove o cookie com segurança, redirecionando para o convite", async () => {
      // Route Handlers rodam com permissão de mutação de cookies
      allowCookieMutation = true;

      cookieJar.set(RETURN_TO_COOKIE_NAME, { value: "/convite/tok_destination_abc" });

      const fakeReq = new NextRequest("http://localhost:3000/auth/return");
      const response = await returnRouteHandler(fakeReq);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/convite/tok_destination_abc");

      // O cookie foi efetivamente e legalmente removido pelo Route Handler
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("Route Handler GET /auth/return redireciona para '/' se o cookie estiver vazio ou inválido", async () => {
      allowCookieMutation = true;
      cookieJar.set(RETURN_TO_COOKIE_NAME, { value: "https://evil-site.com" });

      const fakeReq = new NextRequest("http://localhost:3000/auth/return");
      const response = await returnRouteHandler(fakeReq);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/");
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();
    });

    it("Server Action setAuthReturnToAction grava o cookie em contexto de Server Action", async () => {
      allowCookieMutation = true;

      const res = await setAuthReturnToAction("/convite/tok_action_123");
      expect(res.success).toBe(true);

      const saved = cookieJar.get(RETURN_TO_COOKIE_NAME);
      expect(saved).toBeDefined();
      expect(saved.value).toBe("/convite/tok_action_123");
      expect(saved.httpOnly).toBe(true);
      expect(saved.sameSite).toBe("lax");
    });

    it("Server Action beginSignup grava o returnTo cookie junto com o intent", async () => {
      allowCookieMutation = true;
      mockCreateSignupIntent.mockResolvedValue({
        status: 201,
        data: {
          token: "intent-token-xyz",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });

      const res = await beginSignup({
        accountType: "ATHLETE",
        planCode: "ATHLETE_FREE",
        returnTo: "/convite/tok_intent_flow",
      });

      expect(res.success).toBe(true);
      expect(cookieJar.get("trainvy-signup-intent")?.value).toBe("intent-token-xyz");
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)?.value).toBe("/convite/tok_intent_flow");
    });
  });

  describe("3. Prevenção de loop de navegação e sanitização", () => {
    it("depois que o Route Handler consome o cookie, a Home page não redireciona novamente", async () => {
      allowCookieMutation = true;
      cookieJar.set(RETURN_TO_COOKIE_NAME, { value: "/convite/tok_loop_test" });

      // 1. Route Handler consome
      const fakeReq = new NextRequest("http://localhost:3000/auth/return");
      await returnRouteHandler(fakeReq);
      expect(cookieJar.get(RETURN_TO_COOKIE_NAME)).toBeUndefined();

      // 2. Agora o usuário acessa a Home
      allowCookieMutation = false; // modo render Server Component
      mockAuthClient.getSession.mockResolvedValue({
        data: { user: { id: "user-1", name: "Atleta" } },
      });
      mockGetHomeData.mockResolvedValue({
        status: 200,
        data: {
          workoutStreak: 3,
          consistencyByDay: {},
        },
      });
      mockGetUserTrainData.mockResolvedValue({
        status: 200,
        data: { weightInGrams: 75000 },
      });
      mockGetActiveWorkoutSession.mockResolvedValue({ status: 404 });

      const { default: Home } = await import("@/app/page");

      // Não deve lançar redirect para /auth/return
      const homeComponent = await Home();
      expect(homeComponent).toBeDefined();
    });
  });
});
