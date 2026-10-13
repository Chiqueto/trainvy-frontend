"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Share,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { usePwa } from "./pwa-provider";

export function PwaInstallCard() {
  const { isInstalled, isIOS, promptInstall } = usePwa();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return (
      <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between text-left shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-semibold text-foreground">
              Trainvy Instalado
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Você já está usando a versão nativa PWA no seu dispositivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide((prev) => !prev);
      return;
    }

    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 space-y-3 text-left shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Instalar o Trainvy
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary">
                <Sparkles className="size-2.5" />
                PWA
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Abra em tela cheia, sem barra de navegação e acesse rápido direto da sua tela inicial.
            </p>
          </div>
        </div>
      </div>

      {showIosGuide && isIOS && (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-heading font-medium text-foreground flex items-center gap-1.5">
            <Share className="size-3.5 text-primary" />
            Como instalar no iPhone / iPad:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
            <li>Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.</li>
            <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
          </ol>
        </div>
      )}

      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isInstalling}
        onClick={handleInstallClick}
        className="w-full font-heading font-semibold text-xs gap-1.5"
      >
        <Download className="size-3.5" />
        {isIOS
          ? showIosGuide
            ? "Ocultar Instruções"
            : "Como Instalar no iOS"
          : "Instalar Aplicativo Agora"}
      </Button>
    </div>
  );
}
