import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeSelector } from "@/app/profile/_components/theme-selector";
import fs from "node:fs";
import path from "node:path";

// Mock next-themes
let currentTheme = "system";
let resolvedTheme = "dark";
const mockSetTheme = vi.fn((newTheme: string) => {
  currentTheme = newTheme;
  resolvedTheme = newTheme === "system" ? "dark" : newTheme;
});

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: currentTheme,
    resolvedTheme,
    setTheme: mockSetTheme,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Modo Escuro Trainvy — Cores da Landing Page", () => {
  beforeEach(() => {
    currentTheme = "system";
    resolvedTheme = "dark";
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("1. ThemeToggle", () => {
    it("renderiza o botão de alternância rápida de tema", () => {
      render(<ThemeToggle showLabel />);
      const button = screen.getByRole("button", { name: /Mudar para modo claro|Mudar para modo escuro/i });
      expect(button).toBeDefined();
      expect(screen.getByText("Modo Escuro")).toBeDefined();
    });

    it("alterna de escuro para claro ao clicar", () => {
      render(<ThemeToggle />);
      const button = screen.getByRole("button", { name: /Mudar para modo claro/i });
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("alterna de claro para escuro quando o tema atual for light", () => {
      resolvedTheme = "light";
      render(<ThemeToggle />);
      const button = screen.getByRole("button", { name: /Mudar para modo escuro/i });
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("2. ThemeSelector no Perfil", () => {
    it("renderiza os 3 modos: Modo Escuro (Landing), Modo Claro e Automático (Sistema)", () => {
      render(<ThemeSelector />);

      expect(screen.getByText("Aparência do Aplicativo")).toBeDefined();
      expect(screen.getByText("Modo Escuro")).toBeDefined();
      expect(screen.getByText("Modo Claro")).toBeDefined();
      expect(screen.getByText("Automático (Sistema)")).toBeDefined();
      expect(screen.getByText("Visual original Trainvy (Cores da Landing Page)")).toBeDefined();
    });

    it("aplica o Modo Escuro Trainvy ao clicar na opção", () => {
      render(<ThemeSelector />);

      const darkButton = screen.getByRole("radio", { name: /Modo Escuro/i });
      fireEvent.click(darkButton);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("aplica o Modo Claro ao clicar na opção correspondente", () => {
      render(<ThemeSelector />);

      const lightButton = screen.getByRole("radio", { name: /Modo Claro/i });
      fireEvent.click(lightButton);

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("aplica o Modo Sistema ao clicar na opção correspondente", () => {
      render(<ThemeSelector />);

      const systemButton = screen.getByRole("radio", { name: /Automático/i });
      fireEvent.click(systemButton);

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });
  });

  describe("3. Cores da Landing Page no globals.css", () => {
    it("o arquivo globals.css contém a paleta exata da landing page na classe .dark", () => {
      const globalsCssPath = path.resolve(__dirname, "../app/globals.css");
      const content = fs.readFileSync(globalsCssPath, "utf8");

      // Background Ink da landing (#080c11)
      expect(content).toContain("--background: #080c11;");
      // Panel/Card da landing (#10161e)
      expect(content).toContain("--card: #10161e;");
      expect(content).toContain("--popover: #10161e;");
      // Azul elétrico Trainvy da landing (#38b6ff)
      expect(content).toContain("--primary: #38b6ff;");
      // Foreground escuro de alto contraste sobre o azul (#080c11)
      expect(content).toContain("--primary-foreground: #080c11;");
      // Texto principal claro da landing (#f6f8fb)
      expect(content).toContain("--foreground: #f6f8fb;");
      // Texto secundário/muted da landing (#94a1b2)
      expect(content).toContain("--muted-foreground: #94a1b2;");
      // Linha/borda sutil da landing
      expect(content).toContain("--border: rgba(255, 255, 255, 0.08);");
    });
  });
});
