"use client";

import { useState } from "react";
import Image from "next/image";
import { Dumbbell, ImageOff } from "lucide-react";

export interface ExerciseMediaData {
  startImagePath?: string | null;
  endImagePath?: string | null;
  motionPath?: string | null;
  mediaType?: "IMAGE_SEQUENCE" | "GIF" | "VIDEO" | string | null;
}

interface ExerciseMediaPreviewProps {
  media?: ExerciseMediaData | null;
  exerciseName: string;
  className?: string;
}

export function ExerciseMediaPreview({
  media,
  exerciseName,
  className = "",
}: ExerciseMediaPreviewProps) {
  const [activePose, setActivePose] = useState<"start" | "peak">("start");
  const [imageError, setImageError] = useState(false);

  const startImage = media?.startImagePath ?? null;
  const endImage = media?.endImagePath ?? null;
  const hasBoth = Boolean(startImage && endImage);
  const singleImage = startImage || endImage;

  // Estado Vazio: nenhuma imagem disponível
  if (!media || (!startImage && !endImage) || imageError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 min-h-[220px] ${className}`}
      >
        <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
          {imageError ? (
            <ImageOff className="size-6 text-muted-foreground/70" />
          ) : (
            <Dumbbell className="size-6 text-muted-foreground/70" />
          )}
        </div>
        <p className="font-heading text-sm font-medium text-foreground">
          {imageError
            ? "Não foi possível carregar a imagem"
            : "Demonstração visual em preparação"}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          {imageError
            ? "O arquivo estático de visualização não respondeu."
            : "Este exercício ainda não possui ilustrações de movimento cadastradas no catálogo gratuito."}
        </p>
      </div>
    );
  }

  const currentImagePath =
    (activePose === "start" ? startImage : endImage) || singleImage;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Visualizador de Imagem Principal */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden border border-border/80 bg-neutral-900 flex items-center justify-center shadow-inner">
        {currentImagePath && (
          <Image
            src={currentImagePath}
            alt={`${exerciseName} — ${activePose === "start" ? "Posição Inicial" : "Posição Final"}`}
            fill
            sizes="(max-width: 640px) 100vw, 520px"
            className="object-contain p-2 transition-transform duration-300 ease-out"
            priority={false}
            onError={() => setImageError(true)}
          />
        )}

        {/* Badge da Posição Ativa */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-heading font-semibold tracking-wide bg-background/90 text-foreground border border-border/70 backdrop-blur-md shadow-sm">
            <span
              className={`size-1.5 rounded-full ${activePose === "start" ? "bg-amber-500" : "bg-emerald-500"}`}
            />
            {hasBoth
              ? activePose === "start"
                ? "1. Posição Inicial"
                : "2. Pico de Contração"
              : "Execução"}
          </span>
        </div>
      </div>

      {/* Controles de Alternância quando há duas posições */}
      {hasBoth && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActivePose("start")}
            className={`py-2 px-3 rounded-xl text-xs font-heading font-medium transition-all text-center border ${
              activePose === "start"
                ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
            }`}
          >
            Posição Inicial
          </button>
          <button
            type="button"
            onClick={() => setActivePose("peak")}
            className={`py-2 px-3 rounded-xl text-xs font-heading font-medium transition-all text-center border ${
              activePose === "peak"
                ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
            }`}
          >
            Pico de Contração
          </button>
        </div>
      )}
    </div>
  );
}
