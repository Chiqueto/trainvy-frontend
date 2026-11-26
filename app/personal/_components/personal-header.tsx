"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCheck, Settings, Users, Layers, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PersonalHeaderProps {
  title?: string;
  description?: string;
  activeTab?: "athletes" | "templates" | "exercises" | "subscription";
  utilityActions?: ReactNode;
  actions?: ReactNode;
}

export function PersonalHeader({
  title,
  description,
  activeTab,
  utilityActions,
  actions,
}: PersonalHeaderProps) {
  const pathname = usePathname();

  const currentTab =
    activeTab ??
    (pathname.startsWith("/personal/modelos")
      ? "templates"
      : pathname.startsWith("/personal/exercicios")
        ? "exercises"
        : pathname.startsWith("/personal/assinatura")
          ? "subscription"
          : "athletes");

  const tabs = [
    {
      id: "athletes",
      label: "Alunos",
      href: "/personal",
      icon: Users,
    },
    {
      id: "templates",
      label: "Modelos",
      href: "/personal/modelos",
      icon: Layers,
    },
    {
      id: "exercises",
      label: "Exercícios",
      href: "/personal/exercicios",
      icon: Dumbbell,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 rounded-3xl border border-border/70 bg-card p-4 sm:p-7 shadow-xs">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <Badge
          variant="secondary"
          className="self-start flex items-center gap-1.5 px-3 py-1 font-heading text-xs font-semibold text-primary bg-primary/10 border-primary/20"
        >
          <UserCheck className="size-3.5 shrink-0" />
          <span>Trainvy Pro · Gestão de Treinadores</span>
        </Badge>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {utilityActions}
          <Link
            href="/profile"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 text-xs font-heading font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Configurações do Perfil"
          >
            <Settings className="size-3.5 shrink-0" />
            <span>Configurações</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title ?? "Painel do Personal"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            {description ??
              "Gerencie seus alunos, acompanhe execuções e crie modelos reutilizáveis de treino."}
          </p>
        </div>
        {actions && <div className="w-full md:w-auto shrink-0">{actions}</div>}
      </div>

      {/* Navegação Rápida entre Alunos, Modelos e Exercícios */}
      <div
        data-tour="personal-tabs"
        className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center border-t border-border/50 pt-4"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              prefetch={true}
              className={cn(
                "inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 py-2 sm:px-3.5 rounded-xl text-xs sm:text-sm font-heading font-medium transition-all whitespace-nowrap min-w-0",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
