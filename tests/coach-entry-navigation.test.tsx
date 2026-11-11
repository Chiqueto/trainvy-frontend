import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  context: vi.fn(),
  home: vi.fn(),
  train: vi.fn(),
  active: vi.fn(),
  jar: new Map<string, { value: string }>(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ cookie: "better-auth.session_token=fictitious-session" }),
  cookies: async () => ({
    get: (key: string) => mocks.jar.get(key),
    delete: (key: string) => mocks.jar.delete(key),
  }),
}));
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: { getSession: mocks.session },
}));
vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: vi.fn(),
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: mocks.context,
  getHomeData: mocks.home,
  getUserTrainData: mocks.train,
  getActiveWorkoutSession: mocks.active,
  completeSignup: vi.fn(),
  createSignupIntent: vi.fn(),
  listPublicPlans: vi.fn(),
}));
import Home from "@/app/page";
import MyWorkoutPage from "@/app/meu-treino/page";
import AuthPage from "@/app/auth/page";
import { finishSignup } from "@/app/auth/_actions";
import { WebEntry } from "@/app/_components/landing/web-entry";

describe("Entrada do personal e acesso explícito ao treino próprio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.jar.clear();
    mocks.session.mockResolvedValue({
      data: { user: { id: "coach", name: "Personal" } },
    });
    mocks.context.mockResolvedValue({
      status: 200,
      data: {
        accountType: "COACH",
        accountSetupCompletedAt: "2026-01-01",
        entitlements: [],
      },
    });
    mocks.home.mockResolvedValue({
      status: 200,
      data: { consistencyByDay: {} },
    });
    mocks.train.mockResolvedValue({ status: 200, data: { age: 30 } });
    mocks.active.mockResolvedValue({ status: 404 });
  });

  it("abre em Alunos sem carregar o treino pessoal, inclusive sem assinatura liberada", async () => {
    await expect(Home()).rejects.toThrow("redirect:/personal");
    expect(mocks.home).not.toHaveBeenCalled();
    expect(mocks.train).not.toHaveBeenCalled();
    expect(mocks.active).not.toHaveBeenCalled();
  });

  it("permite abrir Meu Treino sem voltar ao painel", async () => {
    expect((await MyWorkoutPage()).type).toBe("div");
    expect(mocks.home).toHaveBeenCalledOnce();
  });

  it("preserva a home de treino do atleta", async () => {
    mocks.context.mockResolvedValue({
      status: 200,
      data: { accountType: "ATHLETE", accountSetupCompletedAt: "2026-01-01" },
    });
    expect((await Home()).type).toBe("div");
    expect(mocks.home).toHaveBeenCalledOnce();
  });

  it("preserva o retorno pendente antes de escolher a entrada por perfil", async () => {
    mocks.jar.set("trainvy-return-to", { value: "/convite/fictitious-invite" });
    await expect(Home()).rejects.toThrow("redirect:/auth/return");
    expect(mocks.home).not.toHaveBeenCalled();
  });

  it("mantém a entrada pública e pede login no destino privado de treino", async () => {
    mocks.session.mockResolvedValue({ data: null });
    expect((await Home()).type).toBe(WebEntry);
    await expect(MyWorkoutPage()).rejects.toThrow("redirect:/auth");
  });

  it("login já autenticado leva o personal direto para Alunos", async () => {
    await expect(
      AuthPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect:/personal");
  });

  it("conclusão do login de personal existente retorna Alunos", async () => {
    expect(await finishSignup()).toEqual({
      success: true,
      destination: "/personal",
    });
  });
});
