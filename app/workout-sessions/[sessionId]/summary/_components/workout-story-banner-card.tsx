"use client";

import React, { useState } from "react";
import { Camera, Copy, Flame, Instagram, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { WorkoutAnatomyBody } from "@/app/_components/anatomy/workout-anatomy-body";
import type { SessionMuscleSummary } from "@/app/_lib/workout-session-muscles";
import {
  copyCanvasToClipboard,
  renderWorkoutStoryCanvas,
} from "@/app/_lib/workout-story-canvas";
import { Button } from "@/components/ui/button";

import { WorkoutStoryShareModal } from "./workout-story-share-modal";

interface WorkoutStoryBannerCardProps {
  workoutTitle: string;
  dateFormatted: string;
  durationInMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  totalReps: number;
  stats: SessionMuscleSummary;
}

export function WorkoutStoryBannerCard({
  workoutTitle,
  dateFormatted,
  durationInMinutes,
  totalVolumeKg,
  totalSetsCompleted,
  totalReps,
  stats,
}: WorkoutStoryBannerCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickCopying, setIsQuickCopying] = useState(false);

  const handleQuickCopySticker = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsQuickCopying(true);
      const canvas = await renderWorkoutStoryCanvas({
        workoutTitle,
        dateFormatted,
        durationInMinutes,
        totalVolumeKg,
        totalSetsCompleted,
        totalReps,
        stats,
        backgroundMode: "transparent",
        showStats: true,
        showMuscleChips: true,
      });

      const success = await copyCanvasToClipboard(canvas);
      if (success) {
        toast.success("Figurinha copiada! Abra o Instagram Stories e cole sobre sua foto.", {
          duration: 4000,
        });
      } else {
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setIsModalOpen(true);
    } finally {
      setIsQuickCopying(false);
    }
  };

  const topMuscleNames = stats.activeMusclesList
    .slice(0, 3)
    .map((m) => m.label)
    .join(", ");

  return (
    <>
      <section
        aria-labelledby="story-share-banner-title"
        className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-card to-card p-5 shadow-lg transition-all hover:border-red-500/50"
      >
        {/* Glow de fundo */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-red-600/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Lado Esquerdo: Textos e Chamada */}
          <div className="flex flex-1 flex-col gap-2.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
                <Sparkles className="size-3" />
                Estilo Strava • Instagram
              </span>
              {stats.topMuscleGroup && (
                <span className="hidden sm:inline-flex items-center gap-1 font-heading text-[11px] text-muted-foreground">
                  <Flame className="size-3 text-red-500" />
                  Foco: {stats.topMuscleGroup.label}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h2
                id="story-share-banner-title"
                className="font-heading text-lg font-bold text-foreground sm:text-xl"
              >
                Compartilhe seu Treino nos Stories
              </h2>
              <p className="text-xs text-muted-foreground">
                Gere um card visual com o bonequinho destacando os músculos trabalhados em vermelho e fundo transparente para colar sobre sua foto!
              </p>
            </div>

            {topMuscleNames && (
              <p className="text-[11px] font-medium text-red-400/90">
                Músculos ativos: {topMuscleNames}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-4 font-heading text-xs font-bold text-white shadow-md transition hover:brightness-110"
              >
                <Instagram className="size-3.5" />
                <span>Personalizar & Postar</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleQuickCopySticker}
                disabled={isQuickCopying}
                className="h-10 rounded-full font-heading text-xs font-semibold"
              >
                <Copy className="size-3.5" />
                <span>{isQuickCopying ? "Copiando..." : "Copiar Figurinha (PNG)"}</span>
              </Button>
            </div>
          </div>

          {/* Lado Direito: Miniatura Visual Interativa do Bonequinho */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="group relative flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-3 shadow-inner transition hover:border-red-500/40 hover:bg-black/60 shrink-0"
            title="Clique para abrir e personalizar seu Story"
          >
            <WorkoutAnatomyBody
              stats={stats}
              variant="horizontal"
              showLabels={false}
              interactive={false}
              className="scale-75 sm:scale-80 origin-center -m-4 sm:-m-2"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 font-heading text-[10px] font-bold text-white shadow">
                <Share2 className="size-3" />
                Abrir
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Interativo de Criação do Story */}
      <WorkoutStoryShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workoutTitle={workoutTitle}
        dateFormatted={dateFormatted}
        durationInMinutes={durationInMinutes}
        totalVolumeKg={totalVolumeKg}
        totalSetsCompleted={totalSetsCompleted}
        totalReps={totalReps}
        stats={stats}
      />
    </>
  );
}
