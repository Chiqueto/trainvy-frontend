import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  social: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));
vi.mock("@/app/_lib/auth-client", () => ({
  authClient: { signIn: { social: mocks.social } },
}));
vi.mock("@/app/auth/_actions", () => ({
  beginSignup: vi.fn(),
  loadCoachPlans: vi.fn(),
  finishSignup: vi.fn(),
  setAuthReturnToAction: vi.fn(),
}));
import {
  beginSignup,
  finishSignup,
  loadCoachPlans,
  setAuthReturnToAction,
} from "@/app/auth/_actions";
import { SignupForm } from "@/app/auth/_components/signup-form";
import { SignupCompletion } from "@/app/auth/_components/signup-completion";
import { SignInWithGoogle } from "@/app/auth/_components/sign-in-with-google";

const plans = [
  {
    code: "COACH",
    name: "Personal",
    description: null,
    currency: "BRL",
    monthlyPriceInCents: 4990,
    entitlements: [{ entitlement: "MANAGE_ATHLETES" as const, limitValue: 5 }],
  },
  {
    code: "COACH_AI",
    name: "Personal AI",
    description: null,
    currency: "BRL",
    monthlyPriceInCents: 8990,
    entitlements: [],
  },
];
beforeEach(() => {
  vi.resetAllMocks();
  mocks.social.mockResolvedValue({});
  vi.mocked(beginSignup).mockResolvedValue({ success: true });
  vi.mocked(loadCoachPlans).mockResolvedValue({ success: true, plans });
});
afterEach(cleanup);

describe("Account signup UI", () => {
  it("keeps signin disabled while Google is connecting", () => {
    mocks.social.mockReturnValue(new Promise(() => {}));
    render(<SignInWithGoogle />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
  });
  it("shows a recoverable signin error and preserves the invitation", async () => {
    vi.mocked(setAuthReturnToAction).mockResolvedValue({ success: true });
    mocks.social.mockResolvedValue({
      error: { message: "INTERNAL_PROVIDER_TRACE", status: 500 },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SignInWithGoogle returnTo="/convite/qa_token_123456" />);
    fireEvent.click(screen.getByRole("button"));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Tente novamente");
    expect(alert.textContent).not.toContain("INTERNAL_PROVIDER_TRACE");
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false);
    expect(setAuthReturnToAction).toHaveBeenCalledWith(
      "/convite/qa_token_123456",
    );
    expect(mocks.social).toHaveBeenCalledWith(
      expect.objectContaining({
        requestSignUp: false,
        callbackURL: expect.stringContaining(
          "returnTo=%2Fconvite%2Fqa_token_123456",
        ),
      }),
    );
    vi.mocked(console.error).mockRestore();
  });
  it("keeps the selected coach plan after OAuth fails so signup can be retried", async () => {
    mocks.social.mockResolvedValue({ error: { status: 500 } });
    render(<SignupForm initialAccountType="COACH" />);
    await screen.findByText("Personal AI");
    fireEvent.click(screen.getByRole("button", { name: /Personal AI/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    await screen.findByRole("alert");
    expect(
      screen
        .getByRole("button", { name: /Personal AI/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Continuar com Google" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
  it("blocks coach signup when no public plan is available", async () => {
    vi.mocked(loadCoachPlans).mockResolvedValue({ success: true, plans: [] });
    render(<SignupForm initialAccountType="COACH" />);
    await screen.findByText(/Nenhum plano disponível/);
    expect(
      screen
        .getByRole("button", { name: "Continuar com Google" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("opens personal plans directly from the landing page signup intent", async () => {
    render(<SignupForm initialAccountType="COACH" />);
    await screen.findByText("Personal");
    expect(loadCoachPlans).toHaveBeenCalledOnce();
    expect(
      screen
        .getByRole("button", { name: /Sou Personal/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    await waitFor(() =>
      expect(beginSignup).toHaveBeenCalledWith({
        accountType: "COACH",
        planCode: "COACH",
        returnTo: undefined,
      }),
    );
  });
  it("existing login uses OAuth without signup intent or implicit signup", async () => {
    render(<SignInWithGoogle />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(mocks.social).toHaveBeenCalledWith(
        expect.objectContaining({
          requestSignUp: false,
          callbackURL: expect.stringContaining("/auth/complete"),
        }),
      ),
    );
    expect(beginSignup).not.toHaveBeenCalled();
  });
  it("athlete defaults to free without loading paid catalogue", async () => {
    render(<SignupForm />);
    expect(screen.getByText("Grátis")).toBeTruthy();
    expect(loadCoachPlans).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    await waitFor(() =>
      expect(mocks.social).toHaveBeenCalledWith(
        expect.objectContaining({ requestSignUp: true }),
      ),
    );
    expect(beginSignup).toHaveBeenCalledWith({
      accountType: "ATHLETE",
      planCode: "ATHLETE_FREE",
    });
  });
  it("coach prices come from backend and selected plan is sent without price", async () => {
    render(<SignupForm />);
    fireEvent.click(screen.getByRole("button", { name: /Sou Personal/ }));
    expect(await screen.findByText(/49,90/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Personal AI/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    await waitFor(() =>
      expect(beginSignup).toHaveBeenCalledWith({
        accountType: "COACH",
        planCode: "COACH_AI",
      }),
    );
  });
  it("plan errors support retry", async () => {
    vi.mocked(loadCoachPlans).mockResolvedValueOnce({ success: false });
    render(<SignupForm />);
    fireEvent.click(screen.getByRole("button", { name: /Sou Personal/ }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Continuar com Google" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/49,90/)).toBeTruthy();
  });
  it("shows loading plans and blocks submit while fetching", async () => {
    vi.mocked(loadCoachPlans).mockReturnValue(new Promise(() => {}));
    render(<SignupForm />);
    fireEvent.click(screen.getByRole("button", { name: /Sou Personal/ }));
    expect(screen.getByRole("status").textContent).toContain("Carregando");
    expect(
      screen
        .getByRole("button", { name: "Continuar com Google" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("failed intent never starts OAuth", async () => {
    vi.mocked(beginSignup).mockResolvedValue({ success: false });
    render(<SignupForm />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.social).not.toHaveBeenCalled();
  });
  it("authenticated incomplete user completes without repeating OAuth", async () => {
    render(<SignupForm authenticated />);
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/auth/complete"),
    );
    expect(mocks.social).not.toHaveBeenCalled();
  });
  it("completion redirects to onboarding", async () => {
    vi.mocked(finishSignup).mockResolvedValue({
      success: true,
      destination: "/onboarding",
    });
    render(<SignupCompletion />);
    expect(screen.getByRole("status")).toBeTruthy();
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/onboarding"),
    );
  });
  it("expired intent gives a restart link", async () => {
    vi.mocked(finishSignup).mockResolvedValue({
      success: false,
      code: "SIGNUP_INTENT_EXPIRED",
    });
    render(<SignupCompletion />);
    expect((await screen.findByRole("alert")).textContent).toContain("expirou");
    expect(
      screen
        .getByRole("link", { name: "Reiniciar cadastro" })
        .getAttribute("href"),
    ).toBe("/auth/signup");
  });
});
