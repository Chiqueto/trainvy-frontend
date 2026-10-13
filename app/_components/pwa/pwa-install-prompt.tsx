"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Smartphone,
  Sparkles,
  X,
  Share,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "./pwa-provider";

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const LOCAL_STORAGE_KEY = "trainvy_pwa_prompt_dismissed_at";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwa();

  const [isVisible, setIsVisible] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Rotas restritas onde o prompt de instalação JAMAIS deve competir
  const isRestrictedRoute = Boolean(
    pathname &&
      (pathname.startsWith("/workout-sessions") ||
        pathname.startsWith("/auth") ||
        pathname === "/onboarding" ||
        pathname.startsWith("/admin"))
  );

  useEffect(() => {
    // 1. Se já está instalado ou em rota restrita, não exibe
    if (isInstalled || isRestrictedRoute) {
      setIsVisible(false);
      return;
    }

    // 2. Verifica se foi dispensado nos últimos 7 dias
    try {
      const dismissedAt = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (dismissedAt) {
        const diff = Date.now() - parseInt(dismissedAt, 10);
        if (diff < DISMISS_COOLDOWN_MS) {
          setIsVisible(false);
          return;
        }
      }
    } catch {
      // Ignora erro de acesso ao localStorage (ex: modo anônimo estrito)
    }

    // 3. Aguarda 3 segundos após o carregamento inicial para exibir suavemente
    const timer = setTimeout(() => {
      // Confirma novamente elegibilidade
      if (!isInstalled && (isInstallable || isIOS)) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstalled, isInstallable, isIOS, isRestrictedRoute]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
    } catch {
      // noop
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIosGuide((prev) => !prev);
      return;
    }

    setIsInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        setIsVisible(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isVisible || isInstalled || isRestrictedRoute) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Convite para instalar o aplicativo Trainvy"
      className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-sm z-40 rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{
        marginBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Instale o Trainvy
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[9px] font-mono font-medium text-primary">
                <Sparkles className="size-2.5" />
                App
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Acesse seus treinos mais rápido, direto da tela inicial do celular.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar convite de instalação"
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {showIosGuide && isIOS && (
        <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground animate-in fade-in duration-200">
          <p className="font-heading font-medium text-foreground flex items-center gap-1.5 mb-1.5">
            <Share className="size-3.5 text-primary" />
            Como instalar no iPhone / iPad:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
            <li>Toque no botão de <strong>Compartilhar</strong> na barra do Safari.</li>
            <li>Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Confirme no canto superior direito tocando em <strong>Adicionar</strong>.</li>
          </ol>
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2 pt-1 border-t border-border/40">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={isInstalling}
          onClick={handleInstall}
          className="flex-1 font-heading font-semibold text-xs h-9 gap-1.5"
        >
          <Download className="size-3.5" />
          {isIOS ? (showIosGuide ? "Fechar instruções" : "Ver como instalar") : "Instalar app"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="font-heading text-xs text-muted-foreground hover:text-foreground h-9 px-3"
        >
          Agora não
        </Button>
      </div>
    </aside>
  );
}
