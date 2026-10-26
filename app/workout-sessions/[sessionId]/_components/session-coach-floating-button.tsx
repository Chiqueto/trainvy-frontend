"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SessionCoachFloatingButtonProps {
  onClick: () => void;
  coachImage?: string | null;
  coachName?: string | null;
  unreadCount?: number;
}

export function SessionCoachFloatingButton({
  onClick,
  coachImage,
  coachName,
  unreadCount = 0,
}: SessionCoachFloatingButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  // Oculta tooltip inicial após 5 segundos para não poluir a tela
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const displayName = coachName ? coachName.split(" ")[0] : "Coach";

  return (
    <div className="fixed right-4 sm:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 z-40 flex items-center gap-2 select-none">
      {/* Tooltip flutuante discreto */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 border border-primary/30 text-[11px] font-heading font-semibold text-foreground shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-300">
          <Sparkles className="size-3 text-primary animate-pulse" />
          <span>Falar com o {displayName}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="ml-1 text-muted-foreground hover:text-foreground text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Botão Flutuante (FAB) com a cara do Coach */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        aria-label={`Abrir assistente de treino com ${displayName}`}
        className="group relative flex size-14 sm:size-16 items-center justify-center rounded-full bg-card p-1 shadow-2xl shadow-primary/30 border-2 border-primary/60 ring-4 ring-primary/10 hover:ring-primary/25 hover:border-primary transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        {/* Halo luminoso sutil pulsante */}
        <span className="absolute -inset-1 rounded-full bg-primary/20 blur-xs opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

        {/* Avatar com a cara do Coach */}
        <Avatar className="size-full rounded-full border border-border/80 shadow-inner overflow-hidden">
          {coachImage ? (
            <AvatarImage
              src={coachImage}
              alt={coachName || "Coach"}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="size-full bg-gradient-to-tr from-primary/30 via-primary/10 to-primary/40 flex items-center justify-center text-primary font-heading font-black">
            {coachName ? (
              <span className="text-sm font-bold tracking-tight">
                {coachName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <div className="flex flex-col items-center justify-center text-primary">
                <Bot className="size-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
            )}
          </AvatarFallback>
        </Avatar>

        {/* Indicador de Status Ativo (Ponto verde pulsando online) */}
        <span className="absolute bottom-0 right-0 flex size-3.5 items-center justify-center rounded-full bg-background border-2 border-background">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
        </span>

        {/* Badge de Destaque / Não lidas */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-heading font-black text-primary-foreground shadow-md">
            {unreadCount}
          </span>
        ) : (
          <span className="absolute -top-1.5 -left-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-heading font-bold text-primary-foreground shadow-sm">
            <Sparkles className="size-2.5" />
            <span>IA</span>
          </span>
        )}
      </button>
    </div>
  );
}
