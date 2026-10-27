"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  Copy,
  Download,
  Flame,
  Layers,
  Share2,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { WorkoutAnatomyBody } from "@/app/_components/anatomy/workout-anatomy-body";
import { type MuscleGroup } from "@/app/_lib/muscle-labels";
import type { SessionMuscleSummary } from "@/app/_lib/workout-session-muscles";
import {
  copyCanvasToClipboard,
  downloadCanvasAsPng,
  renderWorkoutStoryCanvas,
  type StoryBackgroundMode,
} from "@/app/_lib/workout-story-canvas";
import { Button } from "@/components/ui/button";

interface WorkoutStoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutTitle: string;
  dateFormatted: string;
  durationInMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  totalReps: number;
  stats: SessionMuscleSummary;
}

export function WorkoutStoryShareModal({
  isOpen,
  onClose,
  workoutTitle,
  dateFormatted,
  durationInMinutes,
  totalVolumeKg,
  totalSetsCompleted,
  totalReps,
  stats,
}: WorkoutStoryShareModalProps) {
  const [backgroundMode, setBackgroundMode] =
    useState<StoryBackgroundMode>("transparent");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.5);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [showMuscleChips, setShowMuscleChips] = useState<boolean>(true);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPhotoUrl(url);
      setBackgroundMode("custom-photo");
      toast.success("Foto carregada com sucesso!");
    }
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const canvas = await renderWorkoutStoryCanvas({
        workoutTitle,
        dateFormatted,
        durationInMinutes,
        totalVolumeKg,
        totalSetsCompleted,
        totalReps,
        stats,
        backgroundMode,
        customPhotoUrl,
        photoOverlayOpacity: overlayOpacity,
        showStats,
        showMuscleChips,
      });

      const cleanDate = dateFormatted.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      downloadCanvasAsPng(canvas, `trainvy-story-${cleanDate}.png`);
      toast.success("Story baixado em alta resolução (1080x1920)!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar imagem para download.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySticker = async () => {
    try {
      setIsExporting(true);
      // Sempre exporta com fundo transparente para figurinha
      const canvas = await renderWorkoutStoryCanvas({
        workoutTitle,
        dateFormatted,
        durationInMinutes,
        totalVolumeKg,
        totalSetsCompleted,
        totalReps,
        stats,
        backgroundMode: "transparent",
        showStats,
        showMuscleChips,
      });

      const success = await copyCanvasToClipboard(canvas);
      if (success) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3000);
        toast.success("Figurinha copiada! Abra o Instagram Stories e cole sobre sua foto.", {
          duration: 5000,
        });
      } else {
        // Fallback: faz download se clipboard não suportado
        downloadCanvasAsPng(canvas, "trainvy-sticker-transparente.png");
        toast.info("Figurinha salva na galeria para colar no Instagram!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível copiar. Use o botão Baixar.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsExporting(true);
      const canvas = await renderWorkoutStoryCanvas({
        workoutTitle,
        dateFormatted,
        durationInMinutes,
        totalVolumeKg,
        totalSetsCompleted,
        totalReps,
        stats,
        backgroundMode,
        customPhotoUrl,
        photoOverlayOpacity: overlayOpacity,
        showStats,
        showMuscleChips,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Falha ao preparar imagem.");
          setIsExporting(false);
          return;
        }

        const file = new File([blob], "trainvy-workout-story.png", {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Treino Concluído: ${workoutTitle}`,
            text: "Treino registrado no Trainvy! 💪 #Trainvy",
          });
          toast.success("Compartilhado com sucesso!");
        } else {
          // Fallback para download
          downloadCanvasAsPng(canvas, "trainvy-workout-story.png");
          toast.info("Compartilhamento nativo indisponível. Imagem baixada!");
        }
        setIsExporting(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      toast.error("Compartilhamento cancelado.");
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative flex w-full max-w-4xl flex-col lg:flex-row items-center justify-between gap-6 rounded-3xl border border-white/10 bg-card p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full bg-muted/80 text-foreground transition hover:bg-muted"
          aria-label="Fechar modal de compartilhamento"
        >
          <X className="size-4" />
        </button>

        {/* Lado Esquerdo: Live 9:16 Story Phone Preview */}
        <div className="flex w-full flex-col items-center justify-center lg:w-1/2">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Prévia do Instagram Stories (9:16)</span>
          </div>

          {/* Moldura de Smartphone / Stories */}
          <div className="relative flex aspect-[9/16] h-[520px] sm:h-[580px] w-auto flex-col overflow-hidden rounded-[36px] border-4 border-white/20 shadow-2xl transition-all">
            {/* Background Render */}
            {backgroundMode === "transparent" ? (
              <div
                className="absolute inset-0 bg-neutral-950"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #18181b 25%, transparent 25%),
                    linear-gradient(-45deg, #18181b 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #18181b 75%),
                    linear-gradient(-45deg, transparent 75%, #18181b 75%)
                  `,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              />
            ) : backgroundMode === "custom-photo" && customPhotoUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${customPhotoUrl})` }}
              >
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: overlayOpacity }}
                />
              </div>
            ) : backgroundMode === "crimson-pulse" ? (
              <div className="absolute inset-0 bg-gradient-to-b from-[#3f0a17] via-[#1a0409] to-[#080204]" />
            ) : backgroundMode === "cyber-grid" ? (
              <div className="absolute inset-0 bg-[#090d16]">
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                  }}
                />
              </div>
            ) : (
              // dark-carbon padrão
              <div className="absolute inset-0 bg-gradient-to-b from-[#18181c] via-[#0d0d10] to-[#070709]">
                <div className="absolute -top-12 left-1/2 size-48 -translate-x-1/2 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
              </div>
            )}

            {/* Conteúdo interno do Story */}
            <div
              className={`relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 select-none ${
                backgroundMode === "transparent"
                  ? "bg-black/80 m-2.5 rounded-[28px] border border-white/15 backdrop-blur-md"
                  : ""
              }`}
            >
              {/* Header: Logo Trainvy + Badge Treino Feito */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative size-7 shrink-0">
                    <Image
                      src="/symbol.png"
                      alt="Trainvy"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span
                    className="font-anton text-lg tracking-wider text-white uppercase"
                    style={{ fontFamily: "var(--font-anton)" }}
                  >
                    TRAINVY
                  </span>
                </div>

                <div className="rounded-full bg-primary px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                  Treino Feito
                </div>
              </div>

              {/* Data & Nome do Treino */}
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="font-heading text-[9px] font-semibold tracking-wider text-white/60 uppercase">
                  {dateFormatted}
                </span>
                <h3 className="line-clamp-1 font-heading text-base font-extrabold tracking-tight text-white sm:text-lg">
                  {workoutTitle}
                </h3>
              </div>

              {/* Centro: Bonequinho Anatômico com os Músculos em Vermelho */}
              <div className="my-auto flex flex-col items-center justify-center py-1">
                <WorkoutAnatomyBody
                  stats={stats}
                  variant="horizontal"
                  isTransparentBg={backgroundMode === "transparent"}
                  className="scale-95 sm:scale-100"
                  showLabels={true}
                  selectedMuscle={hoveredMuscle}
                  onHoverMuscle={setHoveredMuscle}
                />

                {/* Músculo hovered ou top */}
                {hoveredMuscle ? (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 font-heading text-[10px] font-bold text-primary ring-1 ring-primary/40 animate-in fade-in duration-150">
                    <Flame className="size-3" />
                    <span>
                      {stats.muscles[hoveredMuscle]?.label}: {stats.muscles[hoveredMuscle]?.totalSets} séries
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Músculos em Destaque */}
              {showMuscleChips && stats.activeMusclesList.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1 py-1">
                  {stats.activeMusclesList.slice(0, 3).map((m) => (
                    <span
                      key={m.muscleGroup}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                      {m.label} ({m.totalSets})
                    </span>
                  ))}
                </div>
              )}

              {/* Métricas Strava-Style */}
              {showStats && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/60">
                      Duração
                    </span>
                    <span className="font-heading text-sm font-extrabold text-white">
                      {durationInMinutes}{" "}
                      <span className="text-[10px] font-semibold text-primary">MIN</span>
                    </span>
                  </div>

                  <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/60">
                      Volume
                    </span>
                    <span className="font-heading text-sm font-extrabold text-white">
                      {totalVolumeKg.toLocaleString("pt-BR")}{" "}
                      <span className="text-[10px] font-semibold text-primary">KG</span>
                    </span>
                  </div>

                  <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/60">
                      Séries
                    </span>
                    <span className="font-heading text-sm font-extrabold text-white">
                      {totalSetsCompleted}{" "}
                      <span className="text-[10px] font-semibold text-primary">SETS</span>
                    </span>
                  </div>

                  <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/60">
                      Repetições
                    </span>
                    <span className="font-heading text-sm font-extrabold text-white">
                      {totalReps}{" "}
                      <span className="text-[10px] font-semibold text-primary">REPS</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Rodapé: Watermark Trainvy */}
              <div className="pt-2 text-center">
                <span className="text-[8px] font-semibold tracking-widest text-white/40 uppercase">
                  trainvy.com • seu treino. sua evolução.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Opções de Personalização e Ações */}
        <div className="flex w-full flex-col gap-5 lg:w-1/2">
          <div>
            <h2
              id="story-modal-title"
              className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              Postar no Instagram Stories
            </h2>
            <p className="text-xs text-muted-foreground">
              Estilo Strava com os músculos trabalhados pintados de vermelho conforme o volume da sua sessão.
            </p>
          </div>

          {/* Seletor de Fundo */}
          <div className="flex flex-col gap-2.5">
            <span className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="size-3.5 text-primary" />
              Estilo do Fundo
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBackgroundMode("transparent")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition ${
                  backgroundMode === "transparent"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <span className="text-xs font-bold text-foreground">✨ Transparente</span>
                <span className="text-[10px] text-muted-foreground">
                  Sem fundo, cola como figurinha sobre sua foto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode("dark-carbon")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition ${
                  backgroundMode === "dark-carbon"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <span className="text-xs font-bold text-foreground">🖤 Dark Carbon</span>
                <span className="text-[10px] text-muted-foreground">
                  Preto fosco estético de academia
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode("crimson-pulse")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition ${
                  backgroundMode === "crimson-pulse"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <span className="text-xs font-bold text-foreground">🔥 Crimson Heat</span>
                <span className="text-[10px] text-muted-foreground">
                  Gradiente quente avermelhado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode("cyber-grid")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition ${
                  backgroundMode === "cyber-grid"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <span className="text-xs font-bold text-foreground">⚡ Cyber Grid</span>
                <span className="text-[10px] text-muted-foreground">
                  Grade geométrica minimalista
                </span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition col-span-2 sm:col-span-1 ${
                  backgroundMode === "custom-photo"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <Camera className="size-3 text-primary" />
                  Sua Foto
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Carregue uma foto da galeria
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Slider de Opacidade caso foto selecionada */}
            {backgroundMode === "custom-photo" && customPhotoUrl && (
              <div className="flex flex-col gap-1 rounded-2xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Escurecer Foto:</span>
                  <span>{Math.round(overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.85"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Opções de Elementos no Story */}
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sliders className="size-3.5 text-primary" />
              Opções do Card
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  showStats
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {showStats ? "✓ Métricas Visíveis" : "+ Exibir Métricas"}
              </button>

              <button
                type="button"
                onClick={() => setShowMuscleChips(!showMuscleChips)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  showMuscleChips
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {showMuscleChips ? "✓ Músculos Visíveis" : "+ Exibir Músculos"}
              </button>
            </div>
          </div>

          {/* Dica para Instagram Stories */}
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-xs text-foreground">
            <p className="font-semibold text-primary">💡 Dica do Instagram:</p>
            <p className="mt-0.5 text-muted-foreground">
              Com o fundo <strong>Transparente</strong>, clique em <strong>Copiar Figurinha</strong>, abra os Stories do Instagram com uma foto sua e toque em <strong>Colar</strong> para colar o mapa e métricas como sticker flutuante!
            </p>
          </div>

          {/* Ações de Compartilhamento & Exportação */}
          <div className="flex flex-col gap-2.5 pt-2">
            {/* Copiar Figurinha Transparente */}
            <Button
              type="button"
              onClick={handleCopySticker}
              disabled={isExporting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 font-heading text-sm font-bold text-white shadow-lg transition hover:brightness-110"
            >
              {copiedSuccess ? (
                <>
                  <Check className="size-4.5" />
                  <span>Figurinha Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4.5" />
                  <span>Copiar Figurinha (PNG Transparente)</span>
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {/* Baixar Imagem 9:16 */}
              <Button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                variant="outline"
                className="h-11 rounded-2xl font-heading text-xs font-semibold"
              >
                <Download className="size-4" />
                <span>Baixar Story (PNG)</span>
              </Button>

              {/* Compartilhar direto */}
              <Button
                type="button"
                onClick={handleNativeShare}
                disabled={isExporting}
                variant="secondary"
                className="h-11 rounded-2xl font-heading text-xs font-semibold"
              >
                <Share2 className="size-4 text-primary" />
                <span>Compartilhar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
