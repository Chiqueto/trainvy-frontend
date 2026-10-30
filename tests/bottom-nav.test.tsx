import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { BottomNav } from "@/app/_components/bottom-nav";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("nuqs", () => ({
  useQueryStates: () => [
    { chat_open: false, chat_initial_message: null },
    vi.fn(),
  ],
  parseAsBoolean: { withDefault: () => ({}) },
  parseAsString: {},
}));

describe("BottomNav — Task 2.8.2 Mobile Polish & Route-derived State", () => {
  beforeEach(() => {
    mockPathname = "/";
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza todos os 5 destinos com labels visíveis e hrefs corretos", () => {
    render(<BottomNav />);

    // Labels visíveis
    expect(screen.getByText("Início")).toBeDefined();
    expect(screen.getByText("Treinos")).toBeDefined();
    expect(screen.getByText("Coach")).toBeDefined();
    expect(screen.getByText("Evolução")).toBeDefined();
    expect(screen.getByText("Perfil")).toBeDefined();

    // Hrefs dos links
    const inicioLink = screen.getByRole("link", { name: /Início/i });
    expect(inicioLink.getAttribute("href")).toBe("/");

    const planejarLink = screen.getByRole("link", { name: /Treinos/i });
    expect(planejarLink.getAttribute("href")).toBe("/planning");

    const evolucaoLink = screen.getByRole("link", { name: /Evolução/i });
    expect(evolucaoLink.getAttribute("href")).toBe("/stats");

    const perfilLink = screen.getByRole("link", { name: /Perfil/i });
    expect(perfilLink.getAttribute("href")).toBe("/profile");

    // Botão central do Coach
    const coachButton = screen.getByRole("button", { name: /Coach/i });
    expect(coachButton).toBeDefined();
  });

  it("marca 'Início' como ativo quando na rota '/'", () => {
    mockPathname = "/";
    render(<BottomNav />);

    const inicioLink = screen.getByRole("link", { name: /Início/i });
    expect(inicioLink.className).toContain("text-primary");
    expect(inicioLink.className).toContain("bg-primary/10");

    const planejarLink = screen.getByRole("link", { name: /Treinos/i });
    expect(planejarLink.className).toContain("text-muted-foreground");
  });

  it("marca 'Treinos' como ativo em rotas /planning/** e /workout-plans/**", () => {
    // 1. /planning
    mockPathname = "/planning";
    const { unmount } = render(<BottomNav />);
    let planejarLink = screen.getByRole("link", { name: /Treinos/i });
    expect(planejarLink.className).toContain("text-primary");
    expect(planejarLink.className).toContain("bg-primary/10");
    unmount();

    // 2. /planning/periodizations/123
    mockPathname = "/planning/periodizations/per-123";
    const { unmount: unmount2 } = render(<BottomNav />);
    planejarLink = screen.getByRole("link", { name: /Treinos/i });
    expect(planejarLink.className).toContain("text-primary");
    unmount2();

    // 3. /workout-plans/plan-abc/days/day-xyz
    mockPathname = "/workout-plans/plan-abc/days/day-xyz";
    render(<BottomNav />);
    planejarLink = screen.getByRole("link", { name: /Treinos/i });
    expect(planejarLink.className).toContain("text-primary");
    expect(planejarLink.className).toContain("bg-primary/10");
  });

  it("marca 'Evolução' como ativo em /stats/** e /history/**", () => {
    for (const pathname of [
      "/stats",
      "/stats/exercises/exercise-123",
      "/history",
      "/history/session-123",
    ]) {
      mockPathname = pathname;
      const { unmount } = render(<BottomNav />);

      const evolucaoLink = screen.getByRole("link", { name: /Evolução/i });
      expect(evolucaoLink.className).toContain("text-primary");
      expect(evolucaoLink.className).toContain("bg-primary/10");

      const inicioLink = screen.getByRole("link", { name: /Início/i });
      expect(inicioLink.className).toContain("text-muted-foreground");
      unmount();
    }
  });

  it("preserva o prop activePage manual se fornecido explicitamente", () => {
    mockPathname = "/workout-sessions/some-free-session";
    render(<BottomNav activePage="profile" />);

    const perfilLink = screen.getByRole("link", { name: /Perfil/i });
    expect(perfilLink.className).toContain("text-primary");
    expect(perfilLink.className).toContain("bg-primary/10");
  });

  describe("Navegação do Personal Trainer (isCoach / /personal)", () => {
    it("renderiza as abas específicas de Personal Trainer quando isCoach=true", () => {
      render(<BottomNav isCoach={true} />);

      expect(screen.getByText("Alunos")).toBeDefined();
      expect(screen.getByText("Modelos")).toBeDefined();
      expect(screen.getByText("Coach")).toBeDefined();
      expect(screen.getByText("Meu Treino")).toBeDefined();
      expect(screen.getByText("Perfil")).toBeDefined();

      const alunosLink = screen.getByRole("link", { name: /Alunos/i });
      expect(alunosLink.getAttribute("href")).toBe("/personal");

      const meuTreinoLink = screen.getByRole("link", { name: /Meu Treino/i });
      expect(meuTreinoLink.getAttribute("href")).toBe("/");
      expect(screen.getByRole("link", { name: "Modelos de treino" }).getAttribute("href")).toBe("/personal/modelos");
      expect(screen.getByRole("link", { name: "Meu planejamento" }).getAttribute("href")).toBe("/planning");
    });

    it.each(["/planning", "/planning/plans/new", "/workout-plans/plan-1"])(
      "marca o planejamento pessoal em %s sem ativar Modelos ou Meu Treino",
      (pathname) => {
        mockPathname = pathname;
        render(<BottomNav isCoach={true} />);
        expect(screen.getByRole("link", { name: "Meu planejamento" }).getAttribute("aria-current")).toBe("page");
        expect(screen.getByRole("link", { name: "Modelos de treino" }).getAttribute("aria-current")).toBeNull();
        expect(screen.getByRole("link", { name: "Meu Treino" }).getAttribute("aria-current")).toBeNull();
      },
    );

    it("ativa 'Alunos' quando na rota /personal e infere automaticamente modo coach", () => {
      mockPathname = "/personal";
      render(<BottomNav />);

      const alunosLink = screen.getByRole("link", { name: /Alunos/i });
      expect(alunosLink.className).toContain("text-primary");
      expect(alunosLink.className).toContain("bg-primary/10");
    });

    it("marca 'Meu Treino' como ativo na rota '/' quando no modo coach", () => {
      mockPathname = "/";
      render(<BottomNav isCoach={true} />);

      const meuTreinoLink = screen.getByRole("link", { name: /Meu Treino/i });
      expect(meuTreinoLink.className).toContain("text-primary");
      expect(meuTreinoLink.className).toContain("bg-primary/10");
    });
  });
});

