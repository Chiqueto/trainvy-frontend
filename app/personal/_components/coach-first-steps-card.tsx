"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Box,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachFirstStepsCardProps {
  isFull: boolean;
}

export function CoachFirstStepsCard({ isFull }: CoachFirstStepsCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-lg space-y-4">
      {/* Halo de destaque visual */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/15 blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
            <Sparkles className="size-3" />
            <span>Primeiros Passos</span>
          </div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Comece sua Consultoria no Trainvy
          </h2>
          <p className="font-heading text-xs text-muted-foreground leading-relaxed">
            Siga o roteiro rápido para conectar seus alunos e prescrever treinos de alto nível:
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground p-1 transition-colors"
          title="Ocultar guia de primeiros passos"
        >
          ✕
        </button>
      </div>

      {/* 3 Passos Essenciais do Personal */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {/* Passo 1 */}
        <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-1.5 backdrop-blur-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-heading text-xs font-bold">
                1
              </span>
              <h3 className="font-heading text-xs font-bold text-foreground">
                Convide seu 1º Aluno
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Gere um link exclusivo e envie pelo WhatsApp. O aluno se conecta na hora.
            </p>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-1.5 backdrop-blur-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-heading text-xs font-bold">
                2
              </span>
              <h3 className="font-heading text-xs font-bold text-foreground">
                Prescreva com IA
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Crie rotinas e periodizações completas em segundos com seu assistente.
            </p>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-1.5 backdrop-blur-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-heading text-xs font-bold">
                3
              </span>
              <h3 className="font-heading text-xs font-bold text-foreground">
                Acompanhe a Execução
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Veja séries concluídas, cargas e histórico em tempo real de cada aluno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
