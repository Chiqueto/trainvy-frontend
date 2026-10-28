"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeOption {
  key: "system" | "dark" | "light";
  label: string;
  tagline: string;
  icon: typeof Moon;
  badge?: string;
  colors: string[];
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: "dark",
    label: "Modo Escuro",
    tagline: "Visual original Trainvy (Cores da Landing Page)",
    icon: Moon,
    badge: "Oficial",
    colors: ["#080c11", "#10161e", "#38b6ff"],
  },
  {
    key: "light",
    label: "Modo Claro",
    tagline: "Visual clássico de alta luminosidade",
    icon: Sun,
    colors: ["#ffffff", "#f4f4f5", "#0284c7"],
  },
  {
    key: "system",
    label: "Automático (Sistema)",
    tagline: "Acompanha as preferências do seu aparelho",
    icon: Monitor,
    colors: ["#080c11", "#ffffff", "#38b6ff"],
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-primary/20 bg-card/60 p-4 shadow-xs backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Moon className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold leading-tight text-foreground">
              Aparência do Aplicativo
            </h2>
            <p className="font-heading text-xs text-muted-foreground">
              Escolha entre o Modo Escuro Trainvy ou Modo Claro
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          <Sparkles className="size-3" />
          <span>Landing Theme</span>
        </div>
      </div>

      {/* Grid de opções */}
      <div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Seleção de tema de aparência"
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = mounted && theme === option.key;

          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(option.key)}
              className={cn(
                "relative flex flex-col justify-between gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.98]",
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <span className="font-heading text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                </div>

                {isSelected ? (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-75 duration-150">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                ) : option.badge ? (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                    {option.badge}
                  </span>
                ) : null}
              </div>

              <p className="font-heading text-[11px] leading-relaxed text-muted-foreground">
                {option.tagline}
              </p>

              {/* Swatch de cores da paleta */}
              <div className="flex items-center gap-1.5 pt-1">
                {option.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="size-3.5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <span className="ml-1 text-[10px] font-mono text-muted-foreground">
                  {option.key === "dark" ? "Landing ink & blue" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
