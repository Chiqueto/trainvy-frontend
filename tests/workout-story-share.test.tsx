import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateWorkoutAnatomySvgString,
  WorkoutAnatomyBody,
} from "../app/_components/anatomy/workout-anatomy-body";
import { calculateSessionMuscleStats } from "../app/_lib/workout-session-muscles";
import { WorkoutStoryBannerCard } from "../app/workout-sessions/[sessionId]/summary/_components/workout-story-banner-card";
import { WorkoutStoryShareModal } from "../app/workout-sessions/[sessionId]/summary/_components/workout-story-share-modal";

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Workout Story Share & Anatomy (Instagram / Strava Style)", () => {
  const dummySessionExercises = [
    {
      id: "se-1",
      exerciseNameSnapshot: "Supino Reto com Barra",
      sets: [
        { completedAt: "2026-10-27T10:00:00Z", type: "WORKING", weightInGrams: 90000, reps: 10 },
        { completedAt: "2026-10-27T10:05:00Z", type: "WORKING", weightInGrams: 90000, reps: 10 },
      ],
    },
    {
      id: "se-2",
      exerciseNameSnapshot: "Puxada Frontal",
      sets: [
        { completedAt: "2026-10-27T10:10:00Z", type: "WORKING", weightInGrams: 60000, reps: 12 },
        { completedAt: "2026-10-27T10:15:00Z", type: "WORKING", weightInGrams: 60000, reps: 10 },
      ],
    },
  ];

  const stats = calculateSessionMuscleStats(dummySessionExercises);

  it("1. WorkoutAnatomyBody renderiza visão frontal e traseira com labels", () => {
    render(<WorkoutAnatomyBody stats={stats} showLabels={true} />);

    expect(screen.getByText("Frente")).toBeDefined();
    expect(screen.getByText("Costas")).toBeDefined();
  });

  it("2. generateWorkoutAnatomySvgString gera SVG válido com FRENTE e COSTAS para Canvas", () => {
    const svgStr = generateWorkoutAnatomySvgString(stats);
    expect(svgStr).toContain("<svg");
    expect(svgStr).toContain("FRENTE");
    expect(svgStr).toContain("COSTAS");
    expect(svgStr).toContain("</svg>");
  });

  it("3. WorkoutStoryBannerCard renderiza chamada de compartilhamento e abre modal ao clicar", () => {
    render(
      <WorkoutStoryBannerCard
        workoutTitle="Treino A - Peito e Costas"
        dateFormatted="27 de Outubro"
        durationInMinutes={48}
        totalVolumeKg={5400}
        totalSetsCompleted={14}
        totalReps={140}
        stats={stats}
      />
    );

    expect(
      screen.getByText("Compartilhe seu Treino nos Stories")
    ).toBeDefined();
    expect(screen.getByText("Personalizar & Postar")).toBeDefined();
    expect(screen.getByText("Copiar Figurinha (PNG)")).toBeDefined();

    // Modal fechado inicialmente
    expect(screen.queryByRole("dialog")).toBeNull();

    // Clica para abrir modal
    fireEvent.click(screen.getByText("Personalizar & Postar"));

    // Modal aberto com acessibilidade role="dialog"
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Postar no Instagram Stories")).toBeDefined();
  });

  it("4. WorkoutStoryShareModal exibe opções de fundo e permite alternar", () => {
    const onClose = vi.fn();
    render(
      <WorkoutStoryShareModal
        isOpen={true}
        onClose={onClose}
        workoutTitle="Treino A - Peito e Costas"
        dateFormatted="27 de Outubro"
        durationInMinutes={48}
        totalVolumeKg={5400}
        totalSetsCompleted={14}
        totalReps={140}
        stats={stats}
      />
    );

    // Verifica opções de fundo
    expect(screen.getByText("✨ Transparente")).toBeDefined();
    expect(screen.getByText("🖤 Dark Carbon")).toBeDefined();
    expect(screen.getByText("🔥 Crimson Heat")).toBeDefined();
    expect(screen.getByText("⚡ Cyber Grid")).toBeDefined();
    expect(screen.getByText("Sua Foto")).toBeDefined();

    // Botões de ação
    expect(screen.getByText("Copiar Figurinha (PNG Transparente)")).toBeDefined();
    expect(screen.getByText("Baixar Story (PNG)")).toBeDefined();
    expect(screen.getByText("Compartilhar")).toBeDefined();

    // Alterna para Dark Carbon
    fireEvent.click(screen.getByText("🖤 Dark Carbon"));

    // Alterna para Crimson Heat
    fireEvent.click(screen.getByText("🔥 Crimson Heat"));

    // Botão fechar
    fireEvent.click(screen.getByLabelText("Fechar modal de compartilhamento"));
    expect(onClose).toHaveBeenCalled();
  });

  it("5. WorkoutStoryShareModal permite alternar visibilidade de métricas e músculos", () => {
    render(
      <WorkoutStoryShareModal
        isOpen={true}
        onClose={vi.fn()}
        workoutTitle="Treino B - Pernas"
        dateFormatted="27 de Outubro"
        durationInMinutes={55}
        totalVolumeKg={8200}
        totalSetsCompleted={18}
        totalReps={180}
        stats={stats}
      />
    );

    const toggleMetricsBtn = screen.getByText("✓ Métricas Visíveis");
    fireEvent.click(toggleMetricsBtn);
    expect(screen.getByText("+ Exibir Métricas")).toBeDefined();

    const toggleMusclesBtn = screen.getByText("✓ Músculos Visíveis");
    fireEvent.click(toggleMusclesBtn);
    expect(screen.getByText("+ Exibir Músculos")).toBeDefined();
  });
});
