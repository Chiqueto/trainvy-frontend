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
import { Pause, Play, RotateCcw } from "lucide-react";
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
      <p role="alert" className="p-6 text-sm text-white">
        Não foi possível carregar o 3D. Use as ilustrações ou recarregue a
        página para tentar novamente.
      </p>
    ) : (
      this.props.children
    );
  }
}

export function Exercise3DViewer({
  exercise,
}: {
  exercise: ExerciseAnimation;
}) {
  return <Viewer key={exercise} exercise={exercise} />;
}

function Viewer({ exercise }: { exercise: ExerciseAnimation }) {
  const playback = useRef({ phase: 0, playing: false, speed: 1 });
  const slider = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"perspective" | "front" | "side">(
    "perspective",
  );
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
    play(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !document.hidden,
    );
  }, [play]);
  const tick = useCallback((delta: number) => {
    const state = playback.current;
    if (state.playing)
      state.phase =
        (state.phase + (Math.min(delta, 0.05) * state.speed) / 4) % 1;
    if (slider.current)
      slider.current.value = String(Math.round(state.phase * 100));
    return state.phase;
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (media.matches) play(false);
    };
    const visibility = () => {
      if (document.hidden) play(false);
    };
    media.addEventListener("change", reduce);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [play]);
  const reset = () => {
    playback.current.phase = 0;
    setRevision((n) => n + 1);
  };
  return (
    <section
      aria-label={`Demonstração 3D: ${EXERCISE_ANIMATIONS[exercise].name}`}
      className="overflow-hidden rounded-2xl border border-border bg-[#101722] text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 text-xs">
        <span className="font-semibold text-orange-300">
          Animação 3D · Experimental
        </span>
        <span className="w-full text-slate-200">
          Em destaque:{" "}
          {exercise === "squat"
            ? "quadríceps"
            : "peitoral, tríceps e deltoide anterior"}
        </span>
        <span className="w-full text-slate-400">
          Descida controlada e uma breve pausa no ponto baixo.
        </span>
        <span className="text-slate-400">
          Arraste para girar · Pinça para zoom
        </span>
      </div>
      <div
        className="relative h-[340px] sm:h-[440px]"
        data-pose-revision={revision}
      >
        <SceneBoundary>
          {failed ? (
            <p role="alert" className="p-6 text-sm">
              A visualização 3D foi interrompida. Reabra a demonstração para
              tentar novamente.
            </p>
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
                <p
                  role="status"
                  className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300"
                >
                  Carregando personagem 3D...
                </p>
              )}
            </>
          )}
        </SceneBoundary>
      </div>
      <div className="space-y-3 border-t border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={failed}
            onClick={() => play(!playing)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? "Pausar" : "Reproduzir"}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reiniciar animação"
            className="grid min-h-10 min-w-10 place-items-center rounded-lg bg-white/10"
          >
            <RotateCcw size={16} />
          </button>
          <label className="ml-auto text-xs text-slate-300">
            Velocidade{" "}
            <select
              aria-label="Velocidade da animação"
              value={speed}
              onChange={(e) => {
                const next = Number(e.target.value);
                playback.current.speed = next;
                setSpeed(next);
              }}
              className="ml-1 min-h-10 rounded-lg bg-slate-800 px-2 text-white"
            >
              <option value={0.5}>0,5×</option>
              <option value={1}>1×</option>
              <option value={1.5}>1,5×</option>
            </select>
          </label>
        </div>
        <label className="block text-xs text-slate-300">
          Posição no movimento
          <input
            ref={slider}
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            aria-label="Posição no movimento"
            className="mt-2 block h-6 w-full accent-orange-400"
            onChange={(e) => {
              play(false);
              playback.current.phase = Number(e.target.value) / 100;
              setRevision((n) => n + 1);
            }}
          />
        </label>
        <div className="flex gap-2" aria-label="Ângulo da câmera">
          {(
            [
              ["perspective", "Perspectiva"],
              ["front", "Frente"],
              ["side", "Lateral"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`min-h-10 flex-1 rounded-lg border px-2 text-xs ${view === value ? "border-orange-400/60 bg-orange-400/10 text-orange-200" : "border-white/10 text-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Movimento ilustrativo. As cores mostram a anatomia, sem medir ativação
          muscular.{" "}
          <a
            href="/models/exercise-3d/ATTRIBUTION.md"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Créditos do personagem
          </a>
        </p>
      </div>
    </section>
  );
}
