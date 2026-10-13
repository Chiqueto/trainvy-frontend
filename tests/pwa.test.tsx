import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import manifest from "@/app/manifest";
import { PwaInstallCard } from "@/app/_components/pwa/pwa-install-card";
import { PwaProvider } from "@/app/_components/pwa/pwa-provider";

describe("PWA — Progressive Web App Foundation (Task 4.X.1 Hardening)", () => {
  describe("1. Web App Manifest (manifest.ts)", () => {
    it("gera manifesto com propriedades essenciais para instalabilidade PWA", () => {
      const data = manifest();

      expect(data.name).toBe("Trainvy — Treinos & Performance");
      expect(data.short_name).toBe("Trainvy");
      expect(data.display).toBe("standalone");
      expect(data.start_url).toBe("/");
      expect(data.scope).toBe("/");
      expect(data.orientation).toBe("portrait");
      expect(data.background_color).toBe("#09090b");
      expect(data.theme_color).toBe("#09090b");

      // Ícones 192x192 e 512x512
      const icons = data.icons ?? [];
      expect(icons.length).toBeGreaterThanOrEqual(2);

      const icon192 = icons.find((i) => i.sizes === "192x192");
      const icon512 = icons.find((i) => i.sizes === "512x512");

      expect(icon192).toBeDefined();
      expect(icon192?.src).toBe("/icon-192.png");

      expect(icon512).toBeDefined();
      expect(icon512?.src).toBe("/icon-512.png");

      // Shortcuts
      expect(data.shortcuts?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("2. PwaInstallCard Component", () => {
    it("renderiza o card de instalação quando o app está sendo executado no navegador", () => {
      render(
        <PwaProvider>
          <PwaInstallCard />
        </PwaProvider>,
      );

      expect(screen.getByText("Instalar o Trainvy")).toBeDefined();
      expect(screen.getByText("PWA")).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Instalar Aplicativo Agora|Como Instalar no iOS/i }),
      ).toBeDefined();
    });
  });

  describe("3. Service Worker Security & Privacy-First Cache (sw.js & offline.html)", () => {
    const swPath = path.resolve(__dirname, "../public/sw.js");
    const offlinePath = path.resolve(__dirname, "../public/offline.html");

    it("arquivo offline.html existe e é genérico sem dados pessoais", () => {
      expect(fs.existsSync(offlinePath)).toBe(true);
      const content = fs.readFileSync(offlinePath, "utf8");
      expect(content).toContain("Sem conexão com a internet");
      expect(content).toContain("Trainvy");
      expect(content).not.toContain("password");
      expect(content).not.toContain("token");
    });

    it("sw.js utiliza versão v2 e purga caches legados na ativação", () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const content = fs.readFileSync(swPath, "utf8");

      expect(content).toContain("trainvy-static-v2");
      expect(content).toContain("caches.delete");
      // Previne precache de páginas HTML privadas
      expect(content).not.toMatch(/PRECACHE_ASSETS\s*=\s*\[[^\]]*"\/"/);
      expect(content).not.toMatch(/PRECACHE_ASSETS\s*=\s*\[[^\]]*"\/profile"/);
      expect(content).not.toMatch(/PRECACHE_ASSETS\s*=\s*\[[^\]]*"\/admin"/);
      expect(content).toContain('"/offline.html"');
    });

    it("sw.js bloqueia expressamente cache para /backend/, /api/, Better Auth e Server Actions", () => {
      const content = fs.readFileSync(swPath, "utf8");

      expect(content).toContain('url.pathname.startsWith("/backend/")');
      expect(content).toContain('url.pathname.startsWith("/api/")');
      expect(content).toContain('url.searchParams.has("_rsc")');
      expect(content).toContain('request.headers.get("RSC") === "1"');
      expect(content).toContain('request.headers.has("Next-Action")');
    });

    it("sw.js utiliza network-only para navegações e serve /offline.html somente em caso de erro", () => {
      const content = fs.readFileSync(swPath, "utf8");

      expect(content).toContain('request.mode === "navigate"');
      expect(content).toContain('caches.match("/offline.html")');
    });
  });

  describe("4. PwaProvider Service Worker Registration Lifecycle", () => {
    it("registra o Service Worker imediatamente se document.readyState já for 'complete'", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalReadyState = document.readyState;
      const registerMock = vi.fn().mockResolvedValue({});

      // @ts-expect-error override readonly
      process.env.NODE_ENV = "production";
      Object.defineProperty(document, "readyState", {
        value: "complete",
        configurable: true,
      });
      Object.defineProperty(navigator, "serviceWorker", {
        value: { register: registerMock },
        configurable: true,
      });

      render(
        <PwaProvider>
          <div>Conteúdo</div>
        </PwaProvider>,
      );

      expect(registerMock).toHaveBeenCalledWith("/sw.js");

      // Cleanup
      // @ts-expect-error restore
      process.env.NODE_ENV = originalEnv;
      Object.defineProperty(document, "readyState", {
        value: originalReadyState,
        configurable: true,
      });
    });
  });
});
