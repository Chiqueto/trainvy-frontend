"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Carregando tema"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 text-muted-foreground opacity-50",
          className,
        )}
      >
        <div className="size-4" />
        {showLabel && <span className="font-heading text-xs">Tema</span>}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card p-2 text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
    >
      <div className="relative size-4">
        <Sun
          className={cn(
            "size-4 transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute inset-0"
              : "rotate-0 scale-100 opacity-100 text-amber-500",
          )}
        />
        <Moon
          className={cn(
            "size-4 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-primary"
              : "-rotate-90 scale-0 opacity-0 absolute inset-0",
          )}
        />
      </div>
      {showLabel && (
        <span className="font-heading text-xs font-medium text-foreground">
          {isDark ? "Modo Escuro" : "Modo Claro"}
        </span>
      )}
    </button>
  );
}
