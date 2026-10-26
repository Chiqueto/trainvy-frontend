"use client";

import Link from "next/link";
import { Users, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachPerspectiveSwitcherProps {
  currentPerspective: "coach" | "athlete";
  className?: string;
}

export function CoachPerspectiveSwitcher({
  currentPerspective,
  className,
}: CoachPerspectiveSwitcherProps) {
  const isPersonal = currentPerspective === "coach";

  return (
    <div
      role="region"
      aria-label="Alternador de visão: Personal Trainer ou Treino Pessoal"
      className={cn(
        "flex items-center justify-between p-1 rounded-2xl bg-muted/60 border border-border/80 shadow-xs",
        className,
      )}
    >
      <Link
        href="/personal"
        prefetch={true}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-heading transition-all cursor-pointer",
          isPersonal
            ? "bg-card text-foreground shadow-xs border border-border/70 font-bold"
            : "text-muted-foreground hover:text-foreground font-medium",
        )}
      >
        <Users className={cn("size-3.5", isPersonal ? "text-primary" : "text-muted-foreground")} />
        <span>Gestão de Alunos</span>
        <span
          className={cn(
            "rounded-full text-[9px] px-1.5 py-0.2 font-mono font-bold uppercase",
            isPersonal
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          Pro
        </span>
      </Link>

      <Link
        href="/"
        prefetch={true}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-heading transition-all cursor-pointer",
          !isPersonal
            ? "bg-card text-foreground shadow-xs border border-border/70 font-bold"
            : "text-muted-foreground hover:text-foreground font-medium",
        )}
      >
        <Dumbbell className={cn("size-3.5", !isPersonal ? "text-emerald-500" : "text-muted-foreground")} />
        <span>Meu Treino</span>
        <span
          className={cn(
            "rounded-full text-[9px] px-1.5 py-0.2 font-mono font-bold uppercase",
            !isPersonal
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          Atleta
        </span>
      </Link>
    </div>
  );
}
