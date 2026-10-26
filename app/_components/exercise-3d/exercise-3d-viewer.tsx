"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Compass,
  Info,
  Layers,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { EXERCISE_ANIMATIONS, type ExerciseAnimation } from "./exercises";

const Scene = dynamic(() => import("./exercise-scene"), { ssr: false });

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div
        role="alert"
        className="flex h-full min-h-[320px] flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2 bg-slate-950/60 rounded-2xl"
      >
        <p className="text-sm font-semibold text-white">
          Não foi possível carregar a visualização 3D neste momento.
        </p>
        <p className="text-xs text-slate-400 max-w-sm">
          Seu navegador ou dispositivo pode estar com recursos WebGL limitados.
          Você pode consultar as ilustrações completas do exercício.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function Exercise3DViewer({
  exercise,
  compact = false,
  inDialog = false,
}: {
  exercise: ExerciseAnimation;
  compact?: boolean;
  inDialog?: boolean;
}) {
  return (
    <Viewer
      key={exercise}
      exercise={exercise}
      compact={compact}
      inDialog={inDialog}
    />
  );
}

function getPhaseLabel(phase: number): { name: string; tag: string } {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.04) {
    return { name: "Extensão Completa", tag: "Lockout" };
  }
  if (p < 0.48) {
    return { name: "Descida Controlada", tag: "Excêntrica" };
  }
  if (p < 0.54) {
    return { name: "Pausa no Ponto Baixo", tag: "Isometria" };
  }
  if (p < 0.96) {
    return { name: "Subida Firme", tag: "Concêntrica" };
  }
  return { name: "Extensão Completa", tag: "Lockout" };
}

function Viewer({
  exercise,
  compact = false,
  inDialog = false,
}: {
  exercise: ExerciseAnimation;
  compact?: boolean;
  inDialog?: boolean;
}) {
  const playback = useRef({ phase: 0, playing: false, speed: 1 });
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<"perspective" | "front" | "side">(
    "perspective",
  );
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // A revision invalidates a paused Canvas after scrubbing without remounting it.
  const [revision] = useState(0);

  const onError = useCallback(() => {
    setFailed(true);
    setPlaying(false);
    playback.current.playing = false;
  }, []);

  const play = useCallback((value: boolean) => {
    playback.current.playing = value;
    setPlaying(value);
  }, []);

  const onReady = useCallback(() => {
    setLoaded(true);
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    play(!prefersReducedMotion && !document.hidden);
  }, [play]);

  const tick = useCallback((delta: number) => {
    const state = playback.current;
    if (state.playing) {
      state.phase =
        (state.phase + (Math.min(delta, 0.05) * state.speed) / 4) % 1;
    }
    setCurrentPhase(state.phase);
    return state.phase;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (media.matches) play(false);
    };
    const visibility = () => {
      if (document.hidden) play(false);
    };
    media.addEventListener?.("change", reduce);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener?.("change", reduce);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [play]);

  const isSquat = exercise === "squat";
  const phaseInfo = getPhaseLabel(currentPhase);
  const exerciseName = EXERCISE_ANIMATIONS[exercise].name;
  const targetMuscles = isSquat
    ? "Quadríceps (ênfase primária)"
    : "Peitoral, Tríceps e Deltoide Anterior";

  return (
    <section
      aria-label={`Demonstração 3D: ${exerciseName}`}
      className="relative flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-[#070b12] text-white shadow-lg overflow-hidden isolate"
      style={{
        borderRadius: "1rem",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        transform: "translateZ(0)",
      }}
    >
      {/* 1. Header Overlay de Informações Anatômicas (oculto quando em modal, pois o modal já possui cabeçalho) */}
      {!inDialog && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Box className="size-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold text-white tracking-wide">
                  {exerciseName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                  <Sparkles className="size-2.5" /> 3D Interativo
                </span>
              </div>
            </div>
          </div>

          {/* Grupo Muscular em Destaque */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium text-slate-400">Em destaque:</span>
            <strong className="font-semibold text-blue-200">
              {targetMuscles}
            </strong>
          </div>
        </div>
      )}

      {/* 2. Canvas 3D Interativo com overlays de câmera e HUD não-colidentes */}
      <div
        className={`relative w-full ${inDialog ? "h-[220px] sm:h-[260px]" : compact ? "h-[300px] sm:h-[360px]" : "h-[360px] sm:h-[430px]"}`}
        data-pose-revision={revision}
      >
        <SceneBoundary>
          {failed ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-300">
              <p>
                A visualização 3D foi interrompida. Reabra a demonstração para
                tentar novamente.
              </p>
            </div>
          ) : (
            <>
              <Scene
                exercise={exercise}
                tick={tick}
                playing={playing}
                view={view}
                onReady={onReady}
                onError={onError}
                revision={revision}
              />

              {!loaded && (
                <div
                  role="status"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-sm text-slate-200"
                >
                  <div className="size-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-heading font-medium tracking-wide">
                    Renderizando modelo anatômico 3D...
                  </p>
                </div>
              )}
            </>
          )}
        </SceneBoundary>

        {/* HUD: Indicador Dinâmico da Fase do Movimento (Canto Superior Esquerdo - sem sobreposição) */}
        {loaded && !failed && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-slate-950/85 border border-white/10 px-3 py-1.5 shadow-md backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {phaseInfo.tag} ·
              </span>
              <span className="font-heading text-xs font-semibold text-white">
                {phaseInfo.name}
              </span>
            </div>
          </div>
        )}

        {/* HUD: Grupo Muscular em Destaque (Canto Inferior Esquerdo) */}
        {loaded && !failed && (
          <div className="pointer-events-none absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-slate-950/85 border border-white/10 px-2.5 py-1 text-[10px] text-slate-300 shadow-md backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium text-slate-400">Destaque:</span>
            <strong className="font-semibold text-blue-200">{targetMuscles}</strong>
          </div>
        )}

        {/* Seletor Flutuante de Câmera (Canto Inferior Direito - totalmente separado do topo) */}
        {loaded && !failed && (
          <div
            className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-slate-950/85 border border-white/10 p-1 shadow-lg backdrop-blur-md z-10"
            aria-label="Ângulo da câmera"
          >
            {(
              [
                ["perspective", "360°", Compass],
                ["front", "Frente", Layers],
                ["side", "Lateral", Maximize2],
              ] as const
            ).map(([val, label, Icon]) => (
              <button
                key={val}
                type="button"
                aria-pressed={view === val}
                onClick={() => setView(val)}
                title={`Mudar para vista ${label}`}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-heading font-semibold transition-all cursor-pointer ${
                  view === val
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dica de Interação sutil no centro */}
        {!inDialog && (
          <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-slate-950/70 border border-white/10 px-3 py-1 text-[10px] text-slate-400 backdrop-blur-sm hidden sm:block">
            Arraste 360° · Scroll zoom
          </div>
        )}
      </div>

      {/* 3. Linha Sutil de Progresso da Repetição */}
      <div className="h-0.5 w-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-[width] duration-75"
          style={{ width: `${Math.round(currentPhase * 100)}%` }}
        />
      </div>

      {/* 4. Rodapé Informativo Clean com Bordas Arredondadas */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 text-[11px] text-slate-400 border-t border-white/5 rounded-b-2xl sm:rounded-b-3xl">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="size-3 text-blue-400 shrink-0" />
          <span className="text-[11px]">
            Movimento anatômico ilustrativo com descida controlada e pausa.
          </span>
        </div>
        <a
          href="/models/exercise-3d/ATTRIBUTION.md"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-mono text-blue-400 hover:text-blue-300 hover:underline shrink-0 ml-2"
        >
          Créditos CC0
        </a>
      </div>
    </section>
  );
}
