"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Dumbbell,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";

import { Exercise3DViewer } from "@/app/_components/exercise-3d/exercise-3d-viewer";
import {
  EXERCISE_ANIMATIONS,
  type ExerciseDefinition,
  type ExerciseAnimation,
} from "@/app/_components/exercise-3d/exercises";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";
import type { GetExerciseMedia200 } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

const LAB_MEDIA_DATA: Record<ExerciseAnimation, GetExerciseMedia200> = {
  squat: {
    exerciseId: EXERCISE_ANIMATIONS.squat.id,
    hasMedia: true,
    mediaType: "IMAGE_SEQUENCE",
    startImagePath: "/exercise-media/repdb/squat-start.webp",
    endImagePath: "/exercise-media/repdb/squat-peak.webp",
    motionPath: null,
    attributionName: "Exercise data by RepDB (repdb.co)",
    attributionUrl: "https://repdb.co",
    instructions: {
      description:
        "Exercício composto multiarticular dominante de joelho e quadril, fundamental para desenvolvimento de membros inferiores e core.",
      setup:
        "Posicione a barra sobre o trapézio superior, pés alinhados na largura dos ombros com pontas ligeiramente voltadas para fora (~15° a 30°), abdômen travado com bracing.",
      execution:
        "Inicie o movimento flexionando quadris e joelhos simultaneamente, descendo de forma controlada até que as coxas quebrem a linha paralela com o solo. Suba empurrando o chão com firmeza.",
      tips: "Mantenha a coluna neutra e os joelhos alinhados na mesma direção das pontas dos pés durante todo o percurso.",
    },
  },
  "bench-press": {
    exerciseId: EXERCISE_ANIMATIONS["bench-press"].id,
    hasMedia: true,
    mediaType: "IMAGE_SEQUENCE",
    startImagePath: "/exercise-media/repdb/bench-press-start.webp",
    endImagePath: "/exercise-media/repdb/bench-press-peak.webp",
    motionPath: null,
    attributionName: "Exercise data by RepDB (repdb.co)",
    attributionUrl: "https://repdb.co",
    instructions: {
      description:
        "Exercício composto de empurrar para peitoral maior, deltoide anterior e tríceps braquial.",
      setup:
        "Deite-se no banco com os olhos sob a barra, pés firmes no solo, escápulas retraídas e pegada ligeiramente mais larga que os ombros.",
      execution:
        "Tire a barra do suporte, desça de forma controlada até o terço inferior do esterno e empurre de volta à posição inicial sem hiperestender os cotovelos.",
      tips: "Mantenha os cotovelos a aproximadamente 45° a 75° do tronco, evitando abri-los totalmente a 90°.",
    },
  },
  "incline-dumbbell-press": {
    exerciseId: EXERCISE_ANIMATIONS["incline-dumbbell-press"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: null,
  },
  "flat-dumbbell-press": {
    exerciseId: EXERCISE_ANIMATIONS["flat-dumbbell-press"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: null,
  },
};

export default function Exercise3DLab() {
  const [exercise, setExercise] = useState<ExerciseAnimation>("squat");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currentDef = EXERCISE_ANIMATIONS[exercise];

  const exerciseDetails: Record<
    ExerciseAnimation,
    {
      primary: string;
      secondary: string;
      cadence: string;
      cues: string[];
    }
  > = {
    squat: {
      primary: "Quadríceps e glúteos",
      secondary: "Adutores",
      cadence: "Descida cadenciada, pausa breve e subida controlada.",
      cues: [
        "Pés afastados na largura dos ombros com pontas levemente para fora.",
        "Joelhos acompanhando a linha dos pés durante toda a flexão.",
        "Tronco firme e peito aberto, mantendo a curvatura natural da coluna.",
      ],
    },
    "bench-press": {
      primary: "Peitoral Maior (Porção esternal e clavicular)",
      secondary: "Tríceps braquial e Deltoide anterior",
      cadence:
        "Descida cadenciada até a linha intermamilar, pausa breve e empurrão firme.",
      cues: [
        "Pés 100% plantados no chão para transferir força (leg drive).",
        "Cotovelos em ângulo de aprox. 45° a 70° em relação ao tronco.",
        "Escápulas retraídas e deprimidas fixadas no estofado do banco.",
      ],
    },
    "incline-dumbbell-press": {
      primary: "Peitoral maior — porção clavicular",
      secondary: "Peitoral médio/inferior, tríceps e deltoide anterior",
      cadence:
        "Descida controlada, pausa breve e subida suave com halteres separados no banco a 30°.",
      cues: [
        "Cabeça, costas e quadril apoiados no banco inclinado a 30°; pés firmes no solo.",
        "Halteres ao lado da parte superior do peito, com punhos alinhados aos antebraços.",
        "Suba com aproximação suave dos halteres, sem choque entre as cargas.",
      ],
    },
    "flat-dumbbell-press": {
      primary: "Peitoral maior — porção esternocostal",
      secondary: "Feixe clavicular, tríceps braquial e deltoide anterior",
      cadence:
        "Descida ampla controlada com cotovelos a 45°-70°, pausa breve e subida convergente.",
      cues: [
        "Escápulas retraídas e deprimidas no banco reto com pés firmemente plantados no solo.",
        "Desça os halteres ao lado do peitoral permitindo um alongamento seguro sem forçar o ombro.",
        "Empurre convergindo suavemente em direção ao centro do peito sem bater as cargas no topo.",
      ],
    },
  };

  const details = exerciseDetails[exercise];

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-8 px-4 py-8 sm:px-8 bg-background">
      {/* Navegação de Retorno */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-heading font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Voltar ao Trainvy</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-3 py-1 text-xs font-heading font-bold">
          <Sparkles className="size-3.5" />
          <span>Estúdio de anatomia</span>
        </span>
      </div>

      {/* Header */}
      <header className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Cinemática & Anatomia 3D
          </p>
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl text-foreground tracking-tight">
            Visualização 3D de Execução
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explore a anatomia do agachamento, supino reto com barra, supino inclinado com
          halteres e supino reto com halteres em qualquer ângulo. Aproxime os detalhes,
          acompanhe cada fase e compare os grupos musculares principais e secundários destacados em
          cada movimento.
        </p>
      </header>

      {/* Seletor de Exercícios */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Selecionar exercício"
      >
        {(
          Object.entries(EXERCISE_ANIMATIONS) as [
            ExerciseAnimation,
            ExerciseDefinition,
          ][]
        ).map(([key, item]) => {
          const isSelected = exercise === key;
          const info = exerciseDetails[key];

          return (
            <button
              type="button"
              key={key}
              aria-pressed={isSelected}
              onClick={() => setExercise(key)}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-600 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                  : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-heading text-base font-bold text-foreground">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Dumbbell className="size-3.5 text-primary" />
                    <span>{item.equipment}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-heading font-bold ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Box className="size-3" />
                  <span>3D Ativo</span>
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground font-semibold">
                    Foco:
                  </strong>{" "}
                  {info.primary}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Player 3D Interativo Hero */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
            <Box className="size-4 text-blue-600 dark:text-blue-400" />
            <span>Simulação em Tempo Real</span>
          </h2>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="rounded-xl font-heading text-xs font-semibold gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Eye className="size-3.5" />
            <span>Testar no Modal do Treino</span>
          </Button>
        </div>

        <Exercise3DViewer exercise={exercise} />
      </div>

      {/* Cartões Informativos de Biomecânica e Dicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Grupos Musculares */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-heading font-bold text-foreground">
            <Layers className="size-4 text-blue-600 dark:text-blue-400" />
            <span>Músculos em Foco Anatômico</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <span className="block font-mono text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold">
                Músculos Principais (Destaque em Cor)
              </span>
              <p className="mt-0.5 font-heading font-semibold text-foreground">
                {details.primary}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border/60 p-3">
              <span className="block font-mono text-[10px] uppercase text-muted-foreground font-bold">
                Músculos Secundários / Sinérgicos
              </span>
              <p className="mt-0.5 text-muted-foreground">
                {details.secondary}
              </p>
            </div>
          </div>
        </div>

        {/* Padrão de Movimento & Cadência */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-heading font-bold text-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Pontos Chave da Execução</span>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {details.cues.map((cue, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{cue}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 rounded-xl bg-muted/30 p-2.5 text-[11px] text-muted-foreground border border-border/40">
            <span className="font-semibold text-foreground">
              Cadência ilustrada:
            </span>{" "}
            {details.cadence}
          </div>
        </div>
      </div>

      {/* Modal de Execução para Teste Fiel ao Treino */}
      <ExerciseExecutionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        exerciseId={currentDef.id}
        exerciseName={currentDef.name}
        initialData={LAB_MEDIA_DATA[exercise]}
      />
    </main>
  );
}
