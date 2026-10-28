import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
  getSession: vi.fn(),
  getCommercialContext: vi.fn(),
  getUserTrainData: vi.fn(),
  upsertUserTrainData: vi.fn(),
  readReturnToCookie: vi.fn(),
  requireAccountSetup: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: { getSession: mocks.getSession },
}));
vi.mock("@/app/_lib/require-account-setup", () => ({
  requireAccountSetup: mocks.requireAccountSetup,
}));
vi.mock("@/app/_lib/auth-return-to", () => ({
  readReturnToCookie: mocks.readReturnToCookie,
}));
vi.mock("@/app/_lib/api/fetch-generated", () => ({
  getCommercialContext: mocks.getCommercialContext,
  getUserTrainData: mocks.getUserTrainData,
  upsertUserTrainData: mocks.upsertUserTrainData,
}));
vi.mock("@/app/_components/chat", () => ({
  Chat: () => <div>Chat com IA</div>,
}));

import OnboardingPage from "@/app/onboarding/page";
import { OnboardingForm } from "@/app/onboarding/_components/onboarding-form";
import { completeOnboardingAction } from "@/app/onboarding/_actions";

const input = {
  weightKg: "75,5",
  heightCm: "175",
  age: "28",
  bodyFatPercentage: "",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ONBOARDING_AI_ENABLED", "");
  mocks.getSession.mockResolvedValue({ data: { user: { id: "athlete" } } });
  mocks.getCommercialContext.mockResolvedValue({
    status: 200,
    data: { accountType: "ATHLETE" },
  });
  mocks.getUserTrainData.mockResolvedValue({ status: 200, data: null });
  mocks.readReturnToCookie.mockResolvedValue(null);
  mocks.upsertUserTrainData.mockResolvedValue({ status: 200, data: {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("onboarding sem IA, com integração preservada", () => {
  it.each(["", "false"])(
    "usa o formulário por padrão e com flag %s",
    async (flag) => {
      vi.stubEnv("ONBOARDING_AI_ENABLED", flag);
      render(await OnboardingPage());
      expect(
        screen.getByRole("button", { name: "Concluir cadastro" }),
      ).toBeDefined();
      expect(screen.queryByText("Chat com IA")).toBeNull();
      expect(mocks.upsertUserTrainData).not.toHaveBeenCalled();
    },
  );
  it("preserva a opção de reativar o onboarding com chat", async () => {
    vi.stubEnv("ONBOARDING_AI_ENABLED", "true");
    render(await OnboardingPage());
    expect(screen.getByText("Chat com IA")).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Concluir cadastro" }),
    ).toBeNull();
  });
  it("aceita o perfil ainda não cadastrado como 404", async () => {
    mocks.getUserTrainData.mockResolvedValue({ status: 404 });
    expect((await OnboardingPage()).type).toBe(OnboardingForm);
  });
  it("preserva o fluxo de convites para quem já completou os dados", async () => {
    mocks.getUserTrainData.mockResolvedValue({
      status: 200,
      data: { age: 28 },
    });
    mocks.readReturnToCookie.mockResolvedValue("/convite/token-seguro");
    await expect(OnboardingPage()).rejects.toThrow("redirect:/auth/return");
  });
  it("não apresenta o onboarding de atleta para um treinador", async () => {
    mocks.getCommercialContext.mockResolvedValue({
      status: 200,
      data: { accountType: "COACH" },
    });
    await expect(OnboardingPage()).rejects.toThrow("redirect:/personal");
    expect(mocks.getUserTrainData).not.toHaveBeenCalled();
  });
  it("exige login e não confunde erro de leitura com perfil novo", async () => {
    mocks.getSession.mockResolvedValueOnce({ data: null });
    await expect(OnboardingPage()).rejects.toThrow("redirect:/auth");
    mocks.getUserTrainData.mockResolvedValue({ status: 500 });
    await expect(OnboardingPage()).rejects.toThrow("Não foi possível carregar");
  });
});

describe("cadastro direto pelo contrato existente", () => {
  it("converte kg com vírgula para gramas e mantém gordura opcional", async () => {
    expect(await completeOnboardingAction(input)).toEqual({
      success: true,
      destination: "/auth/return",
    });
    expect(mocks.upsertUserTrainData).toHaveBeenCalledWith({
      weightInGrams: 75500,
      heightInCentimeters: 175,
      age: 28,
      bodyFatPercentage: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });
  it.each([
    { ...input, weightKg: "inválido" },
    { ...input, heightCm: "175.5" },
    { ...input, age: "" },
    { ...input, bodyFatPercentage: "101" },
    { ...input, bodyFatPercentage: "12.5" },
  ])("rejeita dados inválidos também no servidor", async (invalid) => {
    expect((await completeOnboardingAction(invalid)).success).toBe(false);
    expect(mocks.upsertUserTrainData).not.toHaveBeenCalled();
  });
  it("só conclui após sucesso da API e trata sessão expirada", async () => {
    mocks.upsertUserTrainData.mockResolvedValue({ status: 401, data: {} });
    expect(await completeOnboardingAction(input)).toMatchObject({
      success: false,
      error: expect.stringContaining("sessão expirou"),
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("formulário inicial", () => {
  function fill() {
    fireEvent.change(screen.getByLabelText("Idade (anos)"), {
      target: { value: "28" },
    });
    fireEvent.change(screen.getByLabelText("Peso (kg)"), {
      target: { value: "75,5" },
    });
    fireEvent.change(screen.getByLabelText("Altura (cm)"), {
      target: { value: "175" },
    });
  }
  it("conclui o cadastro sem precisar de percentual de gordura ou chat", async () => {
    render(<OnboardingForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/auth/return"),
    );
    expect(mocks.upsertUserTrainData).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it("preserva campos e permite tentar novamente após falha", async () => {
    mocks.upsertUserTrainData.mockRejectedValueOnce(new Error("offline"));
    render(<OnboardingForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Seus campos foram preservados"),
    );
    expect((screen.getByLabelText("Peso (kg)") as HTMLInputElement).value).toBe(
      "75,5",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledOnce());
  });
  it("bloqueia valores inválidos antes de chamar a API", () => {
    render(<OnboardingForm />);
    fill();
    fireEvent.change(screen.getByLabelText("Peso (kg)"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    expect(screen.getByRole("alert")).toBeDefined();
    expect(mocks.upsertUserTrainData).not.toHaveBeenCalled();
  });
});
