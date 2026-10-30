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
  "hip-thrust": {
    exerciseId: EXERCISE_ANIMATIONS["hip-thrust"].id, hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["hip-thrust"].instructions,
  },
  stiff: {
    exerciseId: EXERCISE_ANIMATIONS.stiff.id, hasMedia: false, mediaType: null,
    startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS.stiff.instructions,
  },
  "horizontal-leg-press": {
    exerciseId: EXERCISE_ANIMATIONS["horizontal-leg-press"].id, hasMedia: false, mediaType: null,
    startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["horizontal-leg-press"].instructions,
  },
  "leg-press-45": {
    exerciseId: EXERCISE_ANIMATIONS["leg-press-45"].id, hasMedia: false, mediaType: null,
    startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["leg-press-45"].instructions,
  },
  "hack-squat": {
    exerciseId: EXERCISE_ANIMATIONS["hack-squat"].id,
    hasMedia: false, mediaType: null,
    startImagePath: null, endImagePath: null, motionPath: null,
    attributionName: null, attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["hack-squat"].instructions,
  },
  "prone-leg-curl": { exerciseId: EXERCISE_ANIMATIONS["prone-leg-curl"].id, hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["prone-leg-curl"].instructions },
  "seated-leg-curl": { exerciseId: EXERCISE_ANIMATIONS["seated-leg-curl"].id, hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["seated-leg-curl"].instructions },
  "leg-extension": { exerciseId: EXERCISE_ANIMATIONS["leg-extension"].id, hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["leg-extension"].instructions },
  "flat-dumbbell-fly": { exerciseId: EXERCISE_ANIMATIONS["flat-dumbbell-fly"].id, hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["flat-dumbbell-fly"].instructions },
  "machine-chest-press": {
    exerciseId: EXERCISE_ANIMATIONS["machine-chest-press"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["machine-chest-press"].instructions,
  },
  "machine-fly": { exerciseId: "6ca42bbc-3724-45ec-98ed-36fb53af260a", hasMedia: false, mediaType: null, startImagePath: null, endImagePath: null, motionPath: null, attributionName: null, attributionUrl: null, instructions: EXERCISE_ANIMATIONS["machine-fly"].instructions },
  "pec-deck": {
    exerciseId: EXERCISE_ANIMATIONS["pec-deck"].id,hasMedia:false,mediaType:null,
    startImagePath:null,endImagePath:null,motionPath:null,attributionName:null,attributionUrl:null,
    instructions:EXERCISE_ANIMATIONS["pec-deck"].instructions,
  },
  "smith-squat": {
    exerciseId: EXERCISE_ANIMATIONS["smith-squat"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["smith-squat"].instructions ?? null,
  },
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
  "incline-bench-press": {
    exerciseId: EXERCISE_ANIMATIONS["incline-bench-press"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: null,
  },
  "smith-bench-press": {
    exerciseId: EXERCISE_ANIMATIONS["smith-bench-press"].id,
    hasMedia: false,
    mediaType: null,
    startImagePath: null,
    endImagePath: null,
    motionPath: null,
    attributionName: null,
    attributionUrl: null,
    instructions: EXERCISE_ANIMATIONS["smith-bench-press"].instructions,
  },
  "decline-bench-press": {
    exerciseId: EXERCISE_ANIMATIONS["decline-bench-press"].id,
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
    "hip-thrust": {
      primary: EXERCISE_ANIMATIONS["hip-thrust"].muscles.primary.join(", "),
      secondary: EXERCISE_ANIMATIONS["hip-thrust"].muscles.secondary.join(", "),
      cadence: "Descida controlada, pausa breve e extensão suave do quadril.",
      cues: ["Apoie a parte superior das costas no banco firme.", "Mantenha os pés inteiros no chão e estabilize a barra acolchoada.", "Alinhe tronco e coxas no alto sem arquear a lombar."],
    },
    stiff: {
      primary: EXERCISE_ANIMATIONS.stiff.muscles.primary.join(", "),
      secondary: EXERCISE_ANIMATIONS.stiff.muscles.secondary.join(", "),
      cadence: "Descida controlada, pausa breve e extensão suave do quadril.",
      cues: ["Leve o quadril para trás, mantendo a leve flexão dos joelhos.", "Barra próxima das pernas, braços alongados e pés apoiados.", "Limite a descida ao controle do tronco; não hiperestenda no topo."],
    },
    "horizontal-leg-press": {
      primary: EXERCISE_ANIMATIONS["horizontal-leg-press"].muscles.primary.join(", "),
      secondary: EXERCISE_ANIMATIONS["horizontal-leg-press"].muscles.secondary.join(", "),
      cadence: "Retorno controlado, pausa breve e extensão suave.",
      cues: ["Costas e pelve apoiadas no banco fixo.", "Pés inteiros acompanham a plataforma horizontal.", "Joelhos na direção dos pés; não bata as placas da torre."],
    },
    "leg-press-45": {
      primary: EXERCISE_ANIMATIONS["leg-press-45"].muscles.primary.join(", "),
      secondary: EXERCISE_ANIMATIONS["leg-press-45"].muscles.secondary.join(", "),
      cadence: "Retorno controlado, pausa breve e extensão suave de joelhos e quadris.",
      cues: ["Costas e pelve apoiadas.", "Pés inteiros na plataforma e joelhos na direção dos pés.", "Limite a descida sem arredondar a lombar ou levantar o quadril."],
    },
    "hack-squat": {
      primary: EXERCISE_ANIMATIONS["hack-squat"].muscles.primary.join(", "),
      secondary: EXERCISE_ANIMATIONS["hack-squat"].muscles.secondary.join(", "),
      cadence: "Descida controlada, pausa breve e subida suave.",
      cues: [
        "Costas e ombros apoiados no trenó.",
        "Pés inteiros na plataforma e joelhos na direção dos pés.",
        "Suba sem travar os joelhos e use as travas ao terminar.",
      ],
    },
    "prone-leg-curl": {
      primary: "Isquiotibiais — bíceps femoral, semitendíneo e semimembranáceo",
      secondary: "Gastrocnêmio, sartório e grácil",
      cadence: "Descida controlada, pausa breve na extensão e flexão suave dos joelhos.",
      cues: ["Tronco e quadril apoiados no banco; joelhos alinhados ao eixo e livres na borda.", "Rolo acima dos calcanhares, sem encostar na articulação do tornozelo.", "Flexione sem levantar o quadril ou usar a lombar para mover a carga."],
    },
    "seated-leg-curl": {
      primary: "Isquiotibiais — bíceps femoral, semitendíneo e semimembranáceo",
      secondary: "Gastrocnêmio, sartório e grácil",
      cadence: "Extensão controlada, pausa breve e flexão suave dos joelhos.",
      cues: ["Alinhe os joelhos ao eixo e ajuste o apoio sobre as coxas.", "Rolo atrás das pernas, acima dos calcanhares.", "Mantenha costas, quadril e coxas estáveis, sem puxar com o tronco."],
    },
    "leg-extension": {
      primary: "Quadríceps — reto femoral e vastos lateral, medial e intermédio",
      secondary: "Bíceps femoral — coativação estabilizadora, sem esforço equivalente",
      cadence: "Retorno controlado, pausa breve na flexão e extensão suave dos joelhos.",
      cues: ["Alinhe os joelhos ao eixo da máquina.", "Costas e quadril apoiados; mãos nas alças laterais.", "Rolo acima dos tornozelos; estenda sem impulso ou travamento brusco."],
    },
    "machine-fly": { primary: "Peitoral maior", secondary: "Deltoide anterior e bíceps braquial", cadence: "Abertura controlada, pausa breve e fechamento suave.", cues: ["Costas no encosto e pés no chão.", "Segure os pegadores, sem apoio de antebraço.", "Mantenha os cotovelos levemente flexionados durante todo o arco."] },
    "flat-dumbbell-fly": { primary: "Peitoral maior", secondary: "Deltoide anterior e bíceps braquial", cadence: "Abertura controlada, pausa breve e fechamento suave.", cues: ["Tronco e pés apoiados.", "Abra os braços em arco com cotovelos levemente flexionados.", "Retorne pela mesma trajetória sem bater os halteres."] },
    "machine-chest-press": {
      primary: "Peitoral maior (porções esternocostal e clavicular)",
      secondary: "Tríceps braquial e Deltoide anterior",
      cadence: "Empurre horizontal convergente controlado, extensão suave e retorno cadenciado.",
      cues: [
        "Ajuste a altura do assento para que as manoplas alinhem à linha média do tórax.",
        "Mantenha as costas e cabeça apoiadas no encosto, com pés firmemente plantados no chão.",
        "Cotovelos em ângulo de ~45° a 60° no plano escapular, empurrando à frente sem travar os cotovelos.",
      ],
    },
    "pec-deck": {
      primary: "Peitoral maior — porções clavicular e esternocostal, sem predominância regional definida",
      secondary: "Deltoide anterior",
      cadence: "Abertura controlada, pausa breve e fechamento por adução dos braços.",
      cues: ["Costas apoiadas no encosto e pés firmes no chão.","Cotovelos flexionados e antebraços apoiados nas almofadas.","Aproxime os apoios sem bater; retorne até a abertura confortável, sem levar os braços excessivamente para trás."],
    },
    "smith-squat": {
      primary: "Quadríceps e Glúteos (ênfase no glúteo máximo)",
      secondary: "Adutores da coxa",
      cadence:
        "Descida cadenciada (2s), pausa breve no fundo (paralela) e subida fluida e potente.",
      cues: [
        "Barra apoiada confortavelmente sobre o trapézio superior em posição high-bar.",
        "Trilhos guias verticais direcionam o movimento, permitindo postura mais ereta do tronco.",
        "Pés posicionados ligeiramente à frente da linha da barra (~10 a 15 cm) com joelhos alinhados com a ponta dos pés.",
        "Travas de segurança ajustadas logo abaixo da profundidade pretendida.",
      ],
    },
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
      primary: "Peitoral Maior (feixes esternal e clavicular)",
      secondary: "Tríceps braquial e Deltoide anterior",
      cadence:
        "Descida cadenciada até o terço inferior do esterno, pausa breve e empurrão firme.",
      cues: [
        "Antebraços rigorosamente verticais sob a barra no fundo, sustentando a carga sem sobrecarga no tríceps.",
        "Cotovelos em ângulo de aprox. 45° a 70° em relação ao tronco no plano escapular.",
        "Escápulas retraídas e deprimidas fixadas no estofado, com pés firmemente plantados no solo.",
      ],
    },
    "incline-dumbbell-press": {
      primary: "Peitoral maior — porção clavicular",
      secondary: "Peitoral médio/inferior, tríceps e deltoide anterior",
      cadence:
        "Descida controlada com peso sobre o antebraço, pausa breve e subida por adução dos cotovelos.",
      cues: [
        "Foco na adução dos cotovelos na subida concêntrica, aproximando os cotovelos sem encostá-los.",
        "Pesos apoiados verticalmente sobre os antebraços em toda a trajetória, sem juntar os halteres no topo.",
        "Banco a 30° comprovado para feixe clavicular sem sobrecarga na cápsula anterior do ombro.",
      ],
    },
    "flat-dumbbell-press": {
      primary: "Peitoral maior — porção esternocostal",
      secondary: "Feixe clavicular, tríceps braquial e deltoide anterior",
      cadence:
        "Descida ampla controlada com cotovelos a 45°-70°, pausa breve e subida por aproximação dos cotovelos.",
      cues: [
        "O objetivo é aproximar os cotovelos para contração máxima do peitoral, e não bater os halteres.",
        "Halteres mantidos apoiados verticalmente sobre os antebraços, aliviando o esforço desnecessário do tríceps.",
        "Cotovelos aproximam-se na adução sem colidir e sem hiperextensão articular no topo.",
      ],
    },
    "incline-bench-press": {
      primary: "Peitoral maior — porção clavicular",
      secondary: "Peitoral médio/inferior, tríceps e deltoide anterior",
      cadence:
        "Descida cadenciada ao terço superior do peito no banco a 30°, pausa breve e empurrão estável.",
      cues: [
        "Banco inclinado a 30° para maximizar recrutamento clavicular e proteger a articulação do ombro.",
        "Antebraço vertical perpendicular ao chão no ponto mais baixo, apoiando a barra diretamente sobre a estrutura óssea.",
        "Pegada média na barra olímpica com escápulas travadas no encosto.",
      ],
    },
    "smith-bench-press": {
      primary: "Peitoral maior (porções esternocostal e clavicular)",
      secondary: "Tríceps braquial e Deltoide anterior",
      cadence:
        "Descida linear vertical estritamente guiada até a altura do esterno, pausa breve e empurrão firme.",
      cues: [
        "Barra guiada em trilhos verticais fixos, eliminando oscilações laterais e poupando estabilizadores secundários.",
        "Banco plano posicionado para que a barra desça alinhada ao terço médio/inferior do esterno com antebraços verticais.",
        "Giro de punhos no topo para travar ou destravar os ganchos da barra com máxima segurança.",
      ],
    },
  "decline-bench-press": {
      primary: "Peitoral maior — porção esternocostal e inferior",
      secondary: "Feixe clavicular, tríceps braquial e deltoide anterior",
      cadence:
        "Descida controlada à linha inferior do tórax/esterno no banco a -18°, pausa breve e empurrão.",
      cues: [
        "Banco declinado a -18° com pernas e tornozelos travados com firmeza nos roletes de apoio.",
        "Antebraços verticais sustentando o peso da barra no terço inferior do esterno.",
        "Cotovelos abaixo da linha dos ombros; a barra desce ao peito, sem acompanhar o rosto.",
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
          Explore os exercícios disponíveis em qualquer ângulo. Aproxime os
          detalhes, acompanhe os movimentos e seus apoios e compare os grupos
          musculares destacados em cada execução.
        </p>
      </header>

      {/* Seletor de Exercícios */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
