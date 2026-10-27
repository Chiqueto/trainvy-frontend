"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCheck, Settings, Users, Layers, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PersonalHeaderProps {
  title?: string;
  description?: string;
  activeTab?: "athletes" | "templates" | "exercises";
}

export function PersonalHeader({
  title,
  description,
  activeTab,
}: PersonalHeaderProps) {
  const pathname = usePathname();

  const currentTab =
    activeTab ??
    (pathname.startsWith("/personal/modelos")
      ? "templates"
      : pathname.startsWith("/personal/exercicios")
        ? "exercises"
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
      label: "Modelos de Treino",
      href: "/personal/modelos",
      icon: Layers,
    },
    {
      id: "exercises",
      label: "Exercícios Personalizados",
      href: "/personal/exercicios",
      icon: Dumbbell,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card p-5 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1 font-heading text-xs font-semibold text-primary bg-primary/10 border-primary/20"
        >
          <UserCheck className="size-3.5" />
          Trainvy Pro · Gestão de Treinadores
        </Badge>

        <Link
          href="/profile"
          className="flex items-center gap-1.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
          title="Configurações do Perfil"
        >
          <Settings className="size-3.5" />
          <span>Configurações</span>
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title ?? "Painel do Personal"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
          {description ??
            "Gerencie seus alunos, acompanhe execuções e crie modelos reutilizáveis de treino."}
        </p>
      </div>

      {/* Navegação Rápida entre Alunos, Modelos e Exercícios */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/50 pt-4 -mx-1 px-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={true}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-heading font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              <Icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

