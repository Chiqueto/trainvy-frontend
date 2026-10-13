"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dumbbell, ImageOff, Pause, Play } from "lucide-react";

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
  /** Permite iniciar pausado se necessário (padrão true para animar em loop) */
  autoPlay?: boolean;
}

export function ExerciseMediaPreview({
  media,
  exerciseName,
  className = "",
  autoPlay = true,
}: ExerciseMediaPreviewProps) {
  const [activePose, setActivePose] = useState<"start" | "peak">("start");
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [imageError, setImageError] = useState(false);

  const startImage = media?.startImagePath ?? null;
  const endImage = media?.endImagePath ?? null;
  const hasBoth = Boolean(startImage && endImage);
  const singleImage = startImage || endImage;

  // Animação em loop alternando entre Início e Pico (cadência natural de repetição)
  useEffect(() => {
    if (!isPlaying || !hasBoth) return;

    const interval = setInterval(() => {
      setActivePose((prev) => (prev === "start" ? "peak" : "start"));
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, hasBoth]);

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
      {/* Visualizador de Imagem com suporte à transição suave entre quadros */}
      <div
        role="region"
        aria-label={`Demonstração visual de ${exerciseName}`}
        onClick={() => hasBoth && setIsPlaying((prev) => !prev)}
        className={`relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden border border-border/80 bg-neutral-950 flex items-center justify-center shadow-inner select-none ${
          hasBoth ? "cursor-pointer group" : ""
        }`}
        title={
          hasBoth
            ? isPlaying
              ? "Clique para pausar a animação"
              : "Clique para reproduzir a animação contínua"
            : undefined
        }
      >
        {hasBoth ? (
          <>
            {/* Quadro 1: Posição Inicial */}
            {startImage && (
              <div
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  activePose === "start"
                    ? "opacity-100 z-10 pointer-events-auto"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={startImage}
                  alt={`${exerciseName} — Posição Inicial`}
                  fill
                  sizes="(max-width: 640px) 100vw, 520px"
                  className="object-contain p-2"
                  priority
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Quadro 2: Pico de Contração */}
            {endImage && (
              <div
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  activePose === "peak"
                    ? "opacity-100 z-10 pointer-events-auto"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={endImage}
                  alt={`${exerciseName} — Posição Final`}
                  fill
                  sizes="(max-width: 640px) 100vw, 520px"
                  className="object-contain p-2"
                  priority
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </>
        ) : (
          currentImagePath && (
            <Image
              src={currentImagePath}
              alt={`${exerciseName} — Posição Inicial`}
              fill
              sizes="(max-width: 640px) 100vw, 520px"
              className="object-contain p-2"
              priority={false}
              onError={() => setImageError(true)}
            />
          )
        )}

        {/* Badge da Posição Ativa */}
        <div className="absolute top-3 left-3 pointer-events-none z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-heading font-semibold tracking-wide bg-background/90 text-foreground border border-border/70 backdrop-blur-md shadow-sm">
            <span
              className={`size-1.5 rounded-full transition-colors duration-300 ${
                activePose === "start" ? "bg-amber-500" : "bg-emerald-500"
              } ${isPlaying ? "animate-pulse" : ""}`}
            />
            {hasBoth
              ? activePose === "start"
                ? "1. Posição Inicial"
                : "2. Pico de Contração"
              : "Execução"}
            {hasBoth && isPlaying && (
              <span className="text-[10px] text-primary font-mono ml-0.5 px-1.5 py-0.5 rounded bg-primary/10 tracking-tight">
                Loop
              </span>
            )}
          </span>
        </div>

        {/* Botão flutuante de Play/Pause no canto do player */}
        {hasBoth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying((prev) => !prev);
            }}
            aria-label={isPlaying ? "Pausar repetição no visor" : "Reproduzir repetição no visor"}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-background/90 hover:bg-background text-foreground border border-border/70 backdrop-blur-md shadow-md transition-all active:scale-95 z-20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {isPlaying ? (
              <Pause className="size-3.5 text-primary" />
            ) : (
              <Play className="size-3.5 text-primary fill-primary" />
            )}
          </button>
        )}

        {/* Barra de ritmo da repetição */}
        {hasBoth && isPlaying && (
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-muted/40 z-20 overflow-hidden">
            <div
              className={`h-full bg-primary transition-all duration-1000 ease-in-out ${
                activePose === "start" ? "w-1/2 ml-0" : "w-1/2 ml-auto"
              }`}
            />
          </div>
        )}
      </div>

      {/* Controles de Alternância e Animação */}
      {hasBoth && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Botão Principal de Animação (Loop) */}
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-heading font-medium transition-all border ${
              isPlaying
                ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
            }`}
          >
            {isPlaying ? (
              <Pause className="size-3.5 shrink-0" />
            ) : (
              <Play className="size-3.5 shrink-0 fill-current" />
            )}
            <span>{isPlaying ? "Pausar Loop" : "Animar Movimento"}</span>
          </button>

          {/* Seletores individuais de pose */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActivePose("start");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-heading font-medium transition-all text-center border ${
                !isPlaying && activePose === "start"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                  : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
              }`}
            >
              Posição Inicial
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActivePose("peak");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-heading font-medium transition-all text-center border ${
                !isPlaying && activePose === "peak"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                  : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
              }`}
            >
              Pico de Contração
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
