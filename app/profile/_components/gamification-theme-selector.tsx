"use client";

import { useState, useTransition } from "react";
import {
  GAMIFICATION_THEMES,
  type GamificationThemeKey,
} from "@/app/_lib/gamification/theme-engine";
import { updateUserThemeAction } from "../_actions";
import { Palette, Check, Loader2 } from "lucide-react";

interface GamificationThemeSelectorProps {
  currentTheme?: string;
}

export function GamificationThemeSelector({
  currentTheme = "ALL",
}: GamificationThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<GamificationThemeKey>(
    (currentTheme as GamificationThemeKey) in GAMIFICATION_THEMES
      ? (currentTheme as GamificationThemeKey)
      : "ALL"
  );
  const [isPending, startTransition] = useTransition();
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSelect = (themeKey: GamificationThemeKey) => {
    if (themeKey === selectedTheme && !isPending) return;

    setSelectedTheme(themeKey);
    setSavedFeedback(null);

    startTransition(async () => {
      const res = await updateUserThemeAction(themeKey);
      if (res.success) {
        setSavedFeedback("Tema atualizado com sucesso!");
        setTimeout(() => setSavedFeedback(null), 3500);
      } else {
        setSavedFeedback(res.error);
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-primary/20 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Palette className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold leading-tight text-foreground">
              Tema de Conclusão de Treino
            </h2>
            <p className="font-heading text-xs text-muted-foreground">
              Personalize os elogios e comparações de carga ao finalizar treinos
            </p>
          </div>
        </div>

        {isPending && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {savedFeedback && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary animate-in fade-in">
          {savedFeedback}
        </div>
      )}

      {/* Grid de Seleção de Temas */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(Object.keys(GAMIFICATION_THEMES) as GamificationThemeKey[]).map(
          (key) => {
            const theme = GAMIFICATION_THEMES[key];
            const isSelected = selectedTheme === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                disabled={isPending}
                className={`relative flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                    : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label={theme.label}>
                    {theme.emoji}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {theme.label}
                    </span>
                    <span className="font-heading text-[11px] text-muted-foreground">
                      {theme.tagline}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
