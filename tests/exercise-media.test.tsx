import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseExecutionDialog } from "@/app/_components/exercise-media/exercise-execution-dialog";
import { ExerciseMediaPreview } from "@/app/_components/exercise-media/exercise-media-preview";
import { SessionExerciseCard } from "@/app/workout-sessions/[sessionId]/_components/session-exercise-card";
import * as mediaActions from "@/app/_actions/exercise-media";

// Mock das Server Actions de Mídia
vi.mock("@/app/_actions/exercise-media", () => ({
  getExerciseMediaAction: vi.fn(),
}));

describe("Task 4.X — Exercise Media Foundation (Frontend)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. ExerciseMediaPreview (Componente de Prévia Visual)", () => {
    it("exibe duas imagens com alternância entre Posição Inicial e Pico de Contração", () => {
      render(
        <ExerciseMediaPreview
          media={{
            startImagePath: "/exercise-media/repdb/bench-press-start.webp",
            endImagePath: "/exercise-media/repdb/bench-press-peak.webp",
            mediaType: "IMAGE_SEQUENCE",
          }}
          exerciseName="Supino Reto com Barra"
        />,
      );

      // Botões de alternância
      const startBtn = screen.getByRole("button", { name: "Posição Inicial" });
      const peakBtn = screen.getByRole("button", { name: "Pico de Contração" });
      expect(startBtn).toBeDefined();
      expect(peakBtn).toBeDefined();

      // Imagem inicial visível
      const initialImg = screen.getByAltText(
        "Supino Reto com Barra — Posição Inicial",
      );
      expect(initialImg).toBeDefined();
      expect(initialImg.getAttribute("src")).toContain("bench-press-start.webp");

      // Clica em Pico de Contração
      fireEvent.click(peakBtn);

      const peakImg = screen.getByAltText(
        "Supino Reto com Barra — Posição Final",
      );
      expect(peakImg).toBeDefined();
      expect(peakImg.getAttribute("src")).toContain("bench-press-peak.webp");
    });

    it("executa animação simulada em loop entre os dois quadros e permite pausar/retomar", () => {
      vi.useFakeTimers();

      render(
        <ExerciseMediaPreview
          media={{
            startImagePath: "/exercise-media/repdb/bench-press-start.webp",
            endImagePath: "/exercise-media/repdb/bench-press-peak.webp",
            mediaType: "IMAGE_SEQUENCE",
          }}
          exerciseName="Supino Reto com Barra"
          autoPlay={true}
        />,
      );

      try {
        // Inicia em loop na posição inicial
        expect(screen.getByText("1. Posição Inicial")).toBeDefined();
        expect(screen.getByText("Loop")).toBeDefined();
        expect(screen.getByText("Pausar Loop")).toBeDefined();

        // Avança 1200ms -> alterna para o pico de contração
        act(() => {
          vi.advanceTimersByTime(1200);
        });
        expect(screen.getByText("2. Pico de Contração")).toBeDefined();

        // Avança mais 1200ms -> retorna para a posição inicial (ping-pong)
        act(() => {
          vi.advanceTimersByTime(1200);
        });
        expect(screen.getByText("1. Posição Inicial")).toBeDefined();

        // Clica em Pausar Loop
        const pauseBtn = screen.getByRole("button", { name: /Pausar Loop/i });
        fireEvent.click(pauseBtn);
        expect(screen.getByText("Animar Movimento")).toBeDefined();
        expect(screen.queryByText("Loop")).toBeNull();

        // Clica para reativar o loop
        const resumeBtn = screen.getByRole("button", { name: /Animar Movimento/i });
        fireEvent.click(resumeBtn);
        expect(screen.getByText("Pausar Loop")).toBeDefined();
        expect(screen.getByText("Loop")).toBeDefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it("exibe apenas uma imagem quando o exercício possui apenas uma posição", () => {
      render(
        <ExerciseMediaPreview
          media={{
            startImagePath: "/exercise-media/repdb/plank-start.webp",
            endImagePath: null,
            mediaType: "IMAGE_SEQUENCE",
          }}
          exerciseName="Prancha Isométrica"
        />,
      );

      // Não deve exibir botões de alternância
      expect(
        screen.queryByRole("button", { name: "Posição Inicial" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Pico de Contração" }),
      ).toBeNull();

      expect(screen.getByText("Execução")).toBeDefined();
      const img = screen.getByAltText(
        "Prancha Isométrica — Posição Inicial",
      );
      expect(img.getAttribute("src")).toContain("plank-start.webp");
    });

    it("renderiza estado vazio amigável quando o exercício não possui mídia", () => {
      render(
        <ExerciseMediaPreview
          media={null}
          exerciseName="Exercício Customizado"
        />,
      );

      expect(
        screen.getByText("Demonstração visual em preparação"),
      ).toBeDefined();
      expect(
        screen.getByText(
          /Este exercício ainda não possui ilustrações de movimento/i,
        ),
      ).toBeDefined();
    });
  });

  describe("2. ExerciseExecutionDialog (Modal e Instruções)", () => {
    it("abre, exibe loading e depois apresenta instruções estruturadas em PT-BR e crédito RepDB", async () => {
      vi.mocked(mediaActions.getExerciseMediaAction).mockResolvedValueOnce({
        success: true,
        data: {
          exerciseId: "00000000-0000-4000-8000-000000000101",
          hasMedia: true,
          mediaType: "IMAGE_SEQUENCE",
          startImagePath: "/exercise-media/repdb/bench-press-start.webp",
          endImagePath: "/exercise-media/repdb/bench-press-peak.webp",
          motionPath: null,
          instructions: {
            description: "Exercício composto de empurrar para peitoral maior.",
            setup: "Deite-se no banco com os pés firmes no chão.",
            execution: "Desça a barra de forma cadenciada até o peito.",
            tips: "Evite abrir os cotovelos a 90 graus.",
          },
          attributionName: "Exercise data by RepDB (repdb.co)",
          attributionUrl: "https://repdb.co",
        },
      });

      const handleClose = vi.fn();

      render(
        <ExerciseExecutionDialog
          isOpen={true}
          onClose={handleClose}
          exerciseId="00000000-0000-4000-8000-000000000101"
          exerciseName="Supino Reto com Barra"
        />,
      );

      // Espera carregar dados
      await waitFor(() => {
        expect(
          screen.getByText("Exercício composto de empurrar para peitoral maior."),
        ).toBeDefined();
      });

      expect(
        screen.getByText("Deite-se no banco com os pés firmes no chão."),
      ).toBeDefined();
      expect(
        screen.getByText("Desça a barra de forma cadenciada até o peito."),
      ).toBeDefined();
      expect(
        screen.getByText("Evite abrir os cotovelos a 90 graus."),
      ).toBeDefined();

      // Crédito obrigatório RepDB com link
      const repDbLink = screen.getByRole("link", { name: /repdb\.co/i });
      expect(repDbLink.getAttribute("href")).toBe("https://repdb.co");

      // Fechamento pelo botão
      const closeButton = screen.getByRole("button", {
        name: "Voltar ao Treino",
      });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it("trata falha de carregamento exibindo mensagem de erro sem crash", async () => {
      vi.mocked(mediaActions.getExerciseMediaAction).mockResolvedValueOnce({
        success: false,
        error: "Falha de conexão com a API",
      });

      render(
        <ExerciseExecutionDialog
          isOpen={true}
          onClose={vi.fn()}
          exerciseId="00000000-0000-4000-8000-000000000101"
          exerciseName="Supino"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Não foi possível carregar a demonstração"),
        ).toBeDefined();
      });
      expect(screen.getByText("Falha de conexão com a API")).toBeDefined();
    });
  });

  describe("3. Preservação de Estado durante o Treino (SessionExerciseCard)", () => {
    it("abre e fecha o diálogo de execução SEM descartar dados de séries preenchidos e SEM disparar mutações", async () => {
      vi.mocked(mediaActions.getExerciseMediaAction).mockResolvedValueOnce({
        success: true,
        data: {
          exerciseId: "00000000-0000-4000-8000-000000000101",
          hasMedia: true,
          mediaType: "IMAGE_SEQUENCE",
          startImagePath: "/exercise-media/repdb/bench-press-start.webp",
          endImagePath: "/exercise-media/repdb/bench-press-peak.webp",
          motionPath: null,
          instructions: {
            description: "Supino Reto oficial.",
            setup: "Postura no banco.",
            execution: "Empurrar barra.",
            tips: "Cotovelos a 45 graus.",
          },
          attributionName: "RepDB",
          attributionUrl: "https://repdb.co",
        },
      });

      const onMutationStart = vi.fn();
      const onMutationEnd = vi.fn();

      render(
        <SessionExerciseCard
          sessionId="session-123"
          isReadOnly={false}
          onError={vi.fn()}
          onMutationStart={onMutationStart}
          onMutationEnd={onMutationEnd}
          exercise={{
            id: "session-ex-1",
            exerciseId: "00000000-0000-4000-8000-000000000101",
            exerciseNameSnapshot: "Supino Reto com Barra",
            order: 1,
            plannedSets: 3,
            plannedReps: 10,
            plannedRestTimeInSeconds: 60,
            notes: "Carga alvo 80kg",
            sets: [
              {
                id: "set-1",
                order: 1,
                type: "WORKING",
                weightInGrams: 80000,
                reps: 10,
                rir: 2,
                durationInSeconds: null,
                notes: "Série pesada",
                completedAt: "2026-10-13T10:00:00Z",
              },
            ],
          }}
        />,
      );

      // Verifica que a série preenchida está visível nos inputs
      expect(screen.getByDisplayValue("80")).toBeDefined(); // 80 kg
      expect(screen.getByDisplayValue("10")).toBeDefined(); // 10 reps

      // Clica no botão "Ver execução"
      const verExecucaoBtn = screen.getByRole("button", {
        name: "Ver execução de Supino Reto com Barra",
      });
      fireEvent.click(verExecucaoBtn);

      // Diálogo aberto
      await waitFor(() => {
        expect(screen.getByText("Guia de Execução")).toBeDefined();
        expect(screen.getByText("Supino Reto oficial.")).toBeDefined();
      });

      // Nenhuma mutação foi disparada
      expect(onMutationStart).not.toHaveBeenCalled();
      expect(onMutationEnd).not.toHaveBeenCalled();

      // Fecha o diálogo
      const closeBtn = screen.getByRole("button", { name: "Voltar ao Treino" });
      fireEvent.click(closeBtn);

      // Diálogo fechou e dados da série continuam intactos
      expect(screen.queryByText("Guia de Execução")).toBeNull();
      expect(screen.getByDisplayValue("80")).toBeDefined();
      expect(screen.getByDisplayValue("10")).toBeDefined();
      expect(screen.getByText("Carga alvo 80kg")).toBeDefined();
    });
  });
});
