import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";
import { PwaInstallCard } from "@/app/_components/pwa/pwa-install-card";
import { PwaProvider } from "@/app/_components/pwa/pwa-provider";

describe("PWA — Progressive Web App Foundation", () => {
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
});
