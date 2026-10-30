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
import { RotateCcw, Expand, Pause, Play, Rotate3D } from "lucide-react";
import { toast } from "sonner";
import { EXERCISE_ANIMATIONS, type ExerciseAnimation } from "./exercises";
import { ANATOMY_COLORS } from "./anatomy-material";
import { FeatureConsentGate } from "../feature-consent";

const Scene = dynamic(() => import("./exercise-scene"), { ssr: false });
type View = "perspective" | "front" | "side" | "back";

function Fallback() {
  return (
    <div
      role="alert"
      className="flex h-full min-h-64 items-center justify-center px-8 text-center text-sm leading-relaxed text-slate-300"
    >
      Não foi possível abrir a visualização 3D. As ilustrações e as instruções
      do exercício continuam disponíveis.
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

export function Exercise3DViewer(props: {
  exercise: ExerciseAnimation;
  compact?: boolean;
  inDialog?: boolean;
}) {
  return <FeatureConsentGate key={props.exercise} feature="EXERCISE_3D" context={`exercise-3d:${props.exercise}`}><Viewer {...props} /></FeatureConsentGate>;
}

function phaseLabel(phase: number, exercise: ExerciseAnimation) {
  if(exercise === "pec-deck" || exercise === "machine-fly" || exercise === "flat-dumbbell-fly") {
    if(phase<0.04||phase>=0.99) return "Posição fechada";
    if(phase<0.48) return "Abertura controlada";
    if(phase<0.54) return "Pausa na abertura";
    return "Fechamento controlado";
  }
  if (phase < 0.04 || phase >= 0.99) return "Posição inicial";
  if (phase < 0.48) return "Descida controlada";
  if (phase < 0.54) return "Pausa no ponto baixo";
  return "Subida controlada";
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
  const container = useRef<HTMLElement>(null);
  const playback = useRef({
    phase: 0,
    playing: false,
    speed: 1,
    displayStep: -1,
  });
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<View>("perspective");
  const [highlighted, setHighlighted] = useState(true);
  const [phase, setPhase] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const definition = EXERCISE_ANIMATIONS[exercise];

  const play = useCallback((value: boolean) => {
    playback.current.playing = value;
    setPlaying(value);
  }, []);
  const onError = useCallback(() => {
    setFailed(true);
    play(false);
  }, [play]);
  const onReady = useCallback(() => {
    setLoaded(true);
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    play(!reduced && !document.hidden);
  }, [play]);
  const tick = useCallback((delta: number) => {
    const state = playback.current;
    if (state.playing)
      state.phase =
        (state.phase + (Math.min(delta, 0.05) * state.speed) / 5.5) % 1;
    const step = Math.floor(state.phase * 100);
    if (step !== state.displayStep) {
      state.displayStep = step;
      setPhase(state.phase);
    }
    return state.phase;
  }, []);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
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

  function seek(value: number) {
    play(false);
    playback.current.phase = value;
    playback.current.displayStep = -1;
    setPhase(value);
    setRevision((current) => current + 1);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.current?.requestFullscreen)
        await container.current.requestFullscreen();
      else toast.info("Amplie a visualização usando o zoom do navegador.");
    } catch {
      toast.error("Não foi possível ampliar a visualização.");
    }
  }

  return (
    <section
      ref={container}
      aria-label={`Demonstração 3D: ${definition.name}`}
      className="group/anatomy isolate flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f17] text-white shadow-xl [&:fullscreen]:justify-center [&:fullscreen]:rounded-none"
    >
      {!inDialog && (
        <header className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[.22em] text-slate-500">
              Trainvy · Anatomia em movimento
            </p>
            <h3 className="font-heading text-base font-semibold tracking-tight">
              {definition.name}
            </h3>
          </div>
          <Rotate3D className="size-5 text-slate-500" />
        </header>
      )}

      <div
        className={`relative w-full ${inDialog ? "h-[320px] sm:h-[440px]" : compact ? "h-[380px] sm:h-[460px]" : "h-[430px] sm:h-[560px]"} group-[:fullscreen]/anatomy:h-[70vh]`}
        data-pose-revision={revision}
      >
        <SceneBoundary>
          {failed ? (
            <Fallback />
          ) : (
            <>
              <Scene
                exercise={exercise}
                tick={tick}
                playing={playing}
                view={view}
                highlighted={highlighted}
                onReady={onReady}
                onError={onError}
                revision={revision}
              />
              {!loaded && (
                <div
                  role="status"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0b0f17]"
                >
                  <span className="size-8 animate-spin rounded-full border border-stone-500 border-t-transparent" />
                  <p className="text-xs text-stone-400">
                    Preparando a visualização…
                  </p>
                </div>
              )}
            </>
          )}
        </SceneBoundary>
        {loaded && !failed && (
          <>
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/8 bg-[#10151c]/80 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md">
              <span
                className={`size-1.5 rounded-full ${playing ? "bg-emerald-400" : "bg-slate-500"}`}
              />
              {phaseLabel(phase, exercise)}
            </div>
            <button
              type="button"
              onClick={fullscreen}
              aria-label="Ampliar visualização"
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-[#10151c]/80 p-2 text-slate-300 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Expand className="size-4" />
            </button>
            <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] tracking-wide text-slate-500">
              Arraste para girar · Aproxime para ver os detalhes
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 border-t border-white/8 bg-[#10151c] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!loaded || failed}
              onClick={() => play(!playing)}
              aria-label={playing ? "Pausar movimento" : "Reproduzir movimento"}
              className="flex size-9 items-center justify-center rounded-full bg-stone-200 text-stone-900 transition hover:bg-white disabled:opacity-40"
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </button>
            <button
              type="button"
              disabled={!loaded || failed}
              onClick={() => seek(0)}
              aria-label="Reiniciar movimento"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="size-4" />
            </button>
            <select
              aria-label="Velocidade do movimento"
              value={speed}
              onChange={(event) => {
                const value = Number(event.target.value);
                playback.current.speed = value;
                setSpeed(value);
              }}
              className="rounded-lg border border-white/10 bg-[#161d26] px-2 py-1.5 text-xs text-slate-300"
            >
              <option value={0.5}>0,5×</option>
              <option value={0.75}>0,75×</option>
              <option value={1}>1×</option>
            </select>
          </div>
          <div
            role="group"
            aria-label="Ângulo da câmera"
            className="flex rounded-xl border border-white/8 bg-black/15 p-1"
          >
            {(
              [
                ["perspective", "360°"],
                ["front", "Frente"],
                ["side", "Lateral"],
                ["back", "Costas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] transition ${view === value ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="range"
          aria-label="Posição do movimento"
          min={0}
          max={1000}
          step={1}
          value={Math.round(phase * 1000)}
          onChange={(event) => seek(Number(event.target.value) / 1000)}
          disabled={!loaded || failed}
          className="block h-1 w-full cursor-pointer accent-stone-300 disabled:opacity-30"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => setHighlighted((value) => !value)}
            aria-pressed={highlighted}
            className={`rounded-lg border px-2.5 py-1.5 transition ${highlighted ? "border-stone-500/40 bg-stone-500/10 text-stone-200" : "border-white/10 text-slate-400"}`}
          >
            {highlighted ? "Músculos do exercício" : "Anatomia neutra"}
          </button>
          {highlighted && (
            <>
              <span className="flex items-center gap-2">
                <i
                  className="size-2 rounded-full"
                  style={{ background: ANATOMY_COLORS.primary }}
                />
                {definition.muscles.primary.join(" · ")}
              </span>
              <span className="flex items-center gap-2">
                <i
                  className="size-2 rounded-full"
                  style={{ background: ANATOMY_COLORS.secondary }}
                />
                {definition.muscles.secondary.join(" · ")}
              </span>
            </>
          )}
        </div>
        <details className="border-t border-white/6 pt-3 text-[10px] leading-relaxed text-slate-500">
          <summary className="cursor-pointer select-none hover:text-slate-300">
            Sobre esta visualização
          </summary>
          <p className="mt-2 max-w-2xl">
            Visualização desenvolvida para o Trainvy. O vermelho identifica
            grupos principais e o vermelho mais claro, grupos secundários. Os demais
            músculos permanecem neutros. A representação é ilustrativa; as cores
            não são uma medição de ativação muscular.
          </p>
          <p className="mt-2 max-w-2xl">
            Anatomia adaptada de{" "}
            <a
              href="https://github.com/LluisV/Z-Anatomy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Z-Anatomy
            </a>
            , por Gauthier Kervyn e Lluís Vinent Juanico, derivada de
            BodyParts3D © The Database Center for Life Science / Kousaku Okubo.
            Cabeça com base MakeHuman (CC0). Montagem, materiais e articulação:
            Trainvy. Modelo sob{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
        </details>
      </div>
    </section>
  );
}
