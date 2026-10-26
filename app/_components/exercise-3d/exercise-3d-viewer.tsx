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
  Gauge,
  Info,
  Layers,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
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
}: {
  exercise: ExerciseAnimation;
  compact?: boolean;
}) {
  return <Viewer key={exercise} exercise={exercise} compact={compact} />;
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
}: {
  exercise: ExerciseAnimation;
  compact?: boolean;
}) {
  const playback = useRef({ phase: 0, playing: false, speed: 1 });
  const slider = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"perspective" | "front" | "side">(
    "perspective",
  );
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // A revision invalidates a paused Canvas after scrubbing without remounting it.
  const [revision, setRevision] = useState(0);

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
    if (slider.current) {
      slider.current.value = String(Math.round(state.phase * 100));
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

  const reset = () => {
    playback.current.phase = 0;
    setCurrentPhase(0);
    if (slider.current) slider.current.value = "0";
    setRevision((n) => n + 1);
  };

  const isSquat = exercise === "squat";
  const phaseInfo = getPhaseLabel(currentPhase);
  const exerciseName = EXERCISE_ANIMATIONS[exercise].name;
  const targetMuscles = isSquat
    ? "Quadríceps (ênfase primária)"
    : "Peitoral, Tríceps e Deltoide Anterior";

  return (
    <section
      aria-label={`Demonstração 3D: ${exerciseName}`}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070b12] text-white shadow-2xl transition-all"
    >
      {/* 1. Header Overlay de Informações Anatômicas */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
            <Box className="size-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold text-white tracking-wide">
                {exerciseName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles className="size-2.5" /> 3D Interativo
              </span>
            </div>
          </div>
        </div>

        {/* Grupo Muscular em Destaque */}
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
          <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-medium text-slate-400">Em destaque:</span>
          <strong className="font-semibold text-orange-200">
            {targetMuscles}
          </strong>
        </div>
      </div>

      {/* 2. Canvas 3D Interativo com overlays de câmera e HUD */}
      <div
        className={`relative w-full ${compact ? "h-[320px] sm:h-[380px]" : "h-[360px] sm:h-[430px]"}`}
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
                  <div className="size-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-heading font-medium tracking-wide">
                    Renderizando modelo anatômico 3D...
                  </p>
                </div>
              )}
            </>
          )}
        </SceneBoundary>

        {/* HUD: Indicador Dinâmico da Fase do Movimento */}
        {loaded && !failed && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Fase · {phaseInfo.tag}
              </span>
              <span className="font-heading text-xs font-semibold text-white">
                {phaseInfo.name}
              </span>
            </div>
          </div>
        )}

        {/* Seletor Flutuante de Câmera no Canto Superior Direito */}
        {loaded && !failed && (
          <div
            className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-slate-950/80 border border-white/10 p-1 shadow-lg backdrop-blur-md"
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
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-heading font-semibold transition-all ${
                  view === val
                    ? "bg-orange-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dica de Interação no rodapé da viewport */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 border border-white/10 px-3 py-0.5 text-[10px] text-slate-400 backdrop-blur-sm hidden sm:block">
          Arraste para girar em 360° · Scroll para zoom
        </div>
      </div>

      {/* 3. Barra de Controles e Scrubbing */}
      <div className="space-y-3 border-t border-white/10 bg-slate-950/90 p-3.5 sm:p-4 backdrop-blur-md">
        {/* Slider de scrub da repetição com preenchimento visual */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-heading text-slate-400">
            <span>Posição da repetição</span>
            <span className="font-mono text-orange-300">
              {Math.round(currentPhase * 100)}%
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              ref={slider}
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              aria-label="Posição no movimento"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-orange-500 hover:bg-slate-700 transition"
              onChange={(e) => {
                play(false);
                const nextPhase = Number(e.target.value) / 100;
                playback.current.phase = nextPhase;
                setCurrentPhase(nextPhase);
                setRevision((n) => n + 1);
              }}
            />
          </div>
        </div>

        {/* Ações: Play/Pause, Reset, Velocidade */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={failed}
              onClick={() => play(!playing)}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-heading font-bold text-slate-950 shadow-md shadow-orange-500/20 hover:bg-orange-400 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {playing ? (
                <>
                  <Pause className="size-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span>Reproduzir</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={reset}
              aria-label="Reiniciar animação"
              title="Reiniciar animação para o início"
              className="grid size-9 place-items-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          {/* Seletor de Velocidade via Pills Modernas */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Gauge className="size-3" />
              <span>Velocidade:</span>
            </span>
            {[0.5, 1, 1.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playback.current.speed = val;
                  setSpeed(val);
                }}
                className={`rounded-lg px-2 py-1 text-[11px] font-heading font-semibold transition ${
                  speed === val
                    ? "bg-white/20 text-white border border-white/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {val === 1 ? "1×" : `${String(val).replace(".", ",")}×`}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Rodapé Informativo e Atribuição Obrigatória */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
          <p className="flex items-center gap-1">
            <Info className="size-3 text-orange-400 shrink-0" />
            <span>
              Movimento anatômico ilustrativo com descida controlada e pausa. Não representa medição de EMG.
            </span>
          </p>
          <a
            href="/models/exercise-3d/ATTRIBUTION.md"
            target="_blank"
            rel="noreferrer"
            className="text-orange-400 hover:underline hover:text-orange-300 transition"
          >
            Créditos do modelo CC0
          </a>
        </div>
      </div>
    </section>
  );
}
