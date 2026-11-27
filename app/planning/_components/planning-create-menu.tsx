"use client";
import { AiFeature } from "@/app/_components/ai-availability-provider";

import { useState } from "react";
import Link from "next/link";
import { CalendarRange, Crown, Dumbbell, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PlanningQuotaSummary {
  planLimit: number | null;
  dayLimit: number | null;
  selfPlansCount: number;
  hasReachedPlanLimit: boolean;
  canUsePeriodizations: boolean;
}

export function PlanningCreateMenu({
  quota,
}: {
  quota?: PlanningQuotaSummary;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="gap-1.5 rounded-full font-heading text-xs font-semibold shadow-sm"
      >
        <Plus className="size-3.5" />
        <span>Novo</span>
      </Button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
          >
            <AiFeature capability="chat">
              <Link
                role="menuitem"
                href="/planning?chat_open=true&chat_initial_message=Crie%20um%20treino%20para%20mim"
                onClick={() => setIsOpen(false)}
                className="flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold hover:bg-accent"
              >
                <Sparkles className="size-4 text-primary" /> Gerar treino com IA
              </Link>
            </AiFeature>
            <AiFeature capability="planning">
              <Link
                role="menuitem"
                href="/planning/plans/new?ai=true"
                onClick={() => setIsOpen(false)}
                className="flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-left font-heading text-xs font-medium transition hover:bg-accent border border-primary/20 bg-primary/5 mb-1"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <span>Criar com IA / Ficha</span>
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary uppercase">
                      Novo
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Por voz ou ficha PDF
                  </span>
                </span>
              </Link>
            </AiFeature>

            <Link
              role="menuitem"
              href={
                quota?.hasReachedPlanLimit
                  ? "/assinatura"
                  : "/planning/plans/new"
              }
              onClick={() => setIsOpen(false)}
              className="flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-left font-heading text-xs font-medium transition hover:bg-accent"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {quota?.hasReachedPlanLimit ? (
                  <Crown className="size-4" />
                ) : (
                  <Dumbbell className="size-4" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">Novo plano</span>
                <span className="text-[10px] text-muted-foreground">
                  {quota?.hasReachedPlanLimit
                    ? "Limite grátis atingido · Ver Atleta Pro"
                    : quota?.planLimit != null
                      ? `${quota.selfPlansCount}/${quota.planLimit} plano próprio usado`
                      : "Plano standalone"}
                </span>
              </span>
            </Link>

            <Link
              role="menuitem"
              href={
                quota && !quota.canUsePeriodizations
                  ? "/assinatura"
                  : "/planning/periodizations/new"
              }
              onClick={() => setIsOpen(false)}
              className="flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-left font-heading text-xs font-medium transition hover:bg-accent"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {quota && !quota.canUsePeriodizations ? (
                  <Crown className="size-4" />
                ) : (
                  <CalendarRange className="size-4" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span>Nova periodização</span>
                  {quota && !quota.canUsePeriodizations && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                      Pro
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Ciclo de treino
                </span>
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
