"use client";

import { useState, useTransition } from "react";
import {
  GAMIFICATION_THEMES,
  getWorkoutThematicSummary,
  type GamificationThemeKey,
} from "@/app/_lib/gamification/theme-engine";
import { updateUserThemeAction } from "@/app/profile/_actions";
import { Palette, Scale, Quote, Check } from "lucide-react";
import { ThemeSticker } from "./theme-sticker";

interface ThematicCelebrationCardProps {
  totalVolumeKg: number;
  initialTheme?: string;
  sessionId: string;
}

const THEME_ACCENTS: Record<
  GamificationThemeKey,
  { border: string; bg: string; badge: string; text: string }
> = {
  ALL: {
    border: "border-primary/40",
    bg: "from-primary/15 via-purple-500/10 to-card",
    badge: "bg-primary/20 text-primary border-primary/30",
    text: "text-primary",
  },
  ANIMES: {
    border: "border-orange-500/40",
    bg: "from-orange-500/15 via-amber-500/10 to-card",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    text: "text-orange-400",
  },
  VEHICLES: {
    border: "border-red-500/40",
    bg: "from-red-500/15 via-rose-500/10 to-card",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    text: "text-red-400",
  },
  ANIMALS: {
    border: "border-emerald-500/40",
    bg: "from-emerald-500/15 via-teal-500/10 to-card",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    text: "text-emerald-400",
  },
  MOVIES_SERIES: {
    border: "border-amber-400/40",
    bg: "from-amber-400/15 via-yellow-500/10 to-card",
    badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    text: "text-amber-300",
  },
  GAMES: {
    border: "border-indigo-500/40",
    bg: "from-indigo-500/15 via-violet-500/10 to-card",
    badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    text: "text-indigo-400",
  },
  MAROMBA_BR: {
    border: "border-lime-500/40",
    bg: "from-lime-500/15 via-emerald-500/10 to-card",
    badge: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    text: "text-lime-400",
  },
};

export function ThematicCelebrationCard({
  totalVolumeKg,
  initialTheme = "ALL",
  sessionId,
}: ThematicCelebrationCardProps) {
  const [activeTheme, setActiveTheme] = useState<GamificationThemeKey>(
    (initialTheme as GamificationThemeKey) in GAMIFICATION_THEMES
      ? (initialTheme as GamificationThemeKey)
      : "ALL"
  );
  const [savedTheme, setSavedTheme] = useState<GamificationThemeKey>(activeTheme);
  const [isPending, startTransition] = useTransition();

  // Usa sessionId como seed determinístico para variar a frase
  const seed = sessionId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const summary = getWorkoutThematicSummary(totalVolumeKg, activeTheme, seed);
  const themeStyle = THEME_ACCENTS[activeTheme] ?? THEME_ACCENTS.ALL;

  const handleSwitchTheme = (newTheme: GamificationThemeKey) => {
    setActiveTheme(newTheme);
    startTransition(async () => {
      const res = await updateUserThemeAction(newTheme);
      if (res.success) {
        setSavedTheme(newTheme);
      }
    });
  };

  return (
    <section className="flex flex-col gap-3">
      {/* Seletor Compacto de Tema */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Palette className="size-3.5 text-primary" />
          <span>Tema do Feedback:</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-muted/40 p-1">
          {(Object.keys(GAMIFICATION_THEMES) as GamificationThemeKey[]).map(
            (key) => {
              const theme = GAMIFICATION_THEMES[key];
              const isSelected = activeTheme === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSwitchTheme(key)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={theme.tagline}
                >
                  <span>{theme.emoji}</span>
                  <span className="hidden sm:inline">{theme.label.split(" ")[0]}</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Card Principal Temático */}
      <div
        className={`relative overflow-hidden rounded-3xl border ${themeStyle.border} bg-gradient-to-br ${themeStyle.bg} p-5 shadow-md transition-all`}
      >
        <div className="flex flex-col gap-4">
          {/* Badge do Tema */}
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider ${themeStyle.badge}`}
            >
              <span>{summary.themeInfo.emoji}</span>
              <span>Modo {summary.themeInfo.label}</span>
            </div>

            {savedTheme === activeTheme ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Check className="size-3 text-emerald-500" />
                Tema salvo
              </span>
            ) : isPending ? (
              <span className="text-[11px] text-muted-foreground">Salvando...</span>
            ) : null}
          </div>

          {/* Figurinha Temática Especial Colecionável */}
          <div className="flex items-center justify-center py-1">
            <ThemeSticker theme={activeTheme} />
          </div>

          {/* Elogio Thematic Praise */}
          <div className="flex items-start gap-3 rounded-2xl bg-card/60 p-3.5 backdrop-blur-sm">
            <Quote className={`mt-0.5 size-5 shrink-0 ${themeStyle.text}`} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Elogio do Treinador
              </span>
              <p className="font-heading text-base font-bold leading-snug text-foreground sm:text-lg">
                &ldquo;{summary.praise}&rdquo;
              </p>
            </div>
          </div>

          {/* Equivalência de Peso / Volume Thematic Comparison */}
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-sm">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Equivalência de Carga
              </span>
              <h3 className="font-heading text-sm font-bold leading-tight text-foreground sm:text-base">
                {summary.weightComparisonTitle}
              </h3>
              <p className="font-heading text-xs text-muted-foreground leading-relaxed">
                {summary.weightComparisonDetail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
