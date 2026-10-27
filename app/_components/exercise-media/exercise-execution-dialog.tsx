"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { getExerciseMediaAction } from "@/app/_actions/exercise-media";
import type { GetExerciseMedia200 } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ExerciseMediaPreview } from "./exercise-media-preview";
import { getExerciseAnimation, type ExerciseAnimation } from "../exercise-3d/exercises";

const Exercise3DViewer = dynamic(
  () =>
    import("../exercise-3d/exercise-3d-viewer").then(
      (module) => module.Exercise3DViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-950/80 text-muted-foreground border border-white/10">
        <div className="flex items-center gap-2 text-xs font-heading font-medium text-slate-300">
          <Loader2 className="size-4 animate-spin text-blue-500" />
          <span>Carregando estúdio 3D...</span>
        </div>
      </div>
    ),
  },
);

interface ExerciseExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId?: string | null;
  exerciseName: string;
  initialData?: GetExerciseMedia200 | null;
}

const FALLBACK_3D_INSTRUCTIONS: Record<
  ExerciseAnimation,
  NonNullable<GetExerciseMedia200["instructions"]>
> = {
  squat: {
    description:
      "Exercício composto multiarticular dominante de joelho e quadril, fundamental para desenvolvimento de membros inferiores e core.",
    setup:
      "Posicione a barra sobre o trapézio superior, pés alinhados na largura dos ombros com pontas ligeiramente voltadas para fora (~15° a 30°), abdômen travado com bracing.",
    execution:
      "Inicie o movimento flexionando quadris e joelhos simultaneamente, descendo de forma controlada até que as coxas quebrem a linha paralela com o solo. Suba empurrando o chão com firmeza.",
    tips: "Mantenha a coluna neutra e os joelhos alinhados na mesma direção das pontas dos pés durante todo o percurso.",
  },
  "bench-press": {
    description:
      "Exercício composto de empurrar para peitoral maior, deltoide anterior e tríceps braquial.",
    setup:
      "Deite-se no banco com os olhos sob a barra, pés firmes no solo, escápulas retraídas e pegada ligeiramente mais larga que os ombros.",
    execution:
      "Tire a barra do suporte, desça de forma controlada até o terço inferior do esterno e empurre de volta à posição inicial sem hiperestender os cotovelos.",
    tips: "Mantenha os cotovelos a aproximadamente 45° a 75° do tronco, evitando abri-los totalmente a 90°.",
  },
  "incline-dumbbell-press": {
    description: "Movimento de empurrar com dois halteres no banco inclinado. A ilustração destaca a porção clavicular do peitoral, tríceps e deltoide anterior.",
    setup: "Apoie costas e cabeça no encosto inclinado a 45°, mantenha os pés firmes no chão e um halter em cada mão, com punhos alinhados aos antebraços.",
    execution: "Desça os halteres com controle ao lado da parte superior do peito, mantendo os cotovelos abaixo das mãos. Após uma pausa breve, empurre para cima com uma aproximação suave, sem bater os halteres.",
    tips: "Mantenha o apoio das escápulas e do quadril, evite abrir excessivamente os cotovelos e não force a extensão dos punhos. O ângulo e a amplitude mostrados são ilustrativos.",
  },
};

export function ExerciseExecutionDialog({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  initialData,
}: ExerciseExecutionDialogProps) {
  const [data, setData] = useState<GetExerciseMedia200 | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(
    Boolean(isOpen && exerciseId && !initialData),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<"3d" | "2d">("3d");

  // Armazena a chave de rastreamento para limpar dados síncronamente durante a renderização se mudar o exercício ou status de abertura
  const dialogKey = `${isOpen ? "open" : "closed"}-${exerciseId ?? ""}`;
  const [prevDialogKey, setPrevDialogKey] = useState(dialogKey);

  if (dialogKey !== prevDialogKey) {
    setPrevDialogKey(dialogKey);
    setData(initialData ?? null);
    setErrorMessage(null);
    setIsLoading(Boolean(isOpen && exerciseId && !initialData));
    setMediaTab("3d");
  }

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Gerenciamento de foco ao abrir e fechar o diálogo
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      const timer = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Carregamento de dados com cancelamento estrito de requisição assíncrona antiga
  useEffect(() => {
    if (!isOpen || !exerciseId || initialData) {
      return;
    }

    let isCurrent = true;
    const requestedId = exerciseId;

    getExerciseMediaAction(requestedId)
      .then((res) => {
        // Se o componente desmontou ou o exerciseId mudou enquanto a requisição estava em voo, descarta
        if (!isCurrent) return;
        if (res.success) {
          setData(res.data);
        } else {
          setErrorMessage(res.error);
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Falha ao carregar instruções do exercício",
        );
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, exerciseId]);

  // Fechamento via teclado (ESC) e contenção básica de foco
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Tab trap simples para conter foco no modal
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length > 0) {
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const animation = getExerciseAnimation(exerciseId, exerciseName);
  const instructions =
    data?.instructions ??
    (animation ? FALLBACK_3D_INSTRUCTIONS[animation] : undefined);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={cn(
          "w-full max-h-[88vh] sm:max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-all",
          animation ? "max-w-2xl sm:max-w-3xl" : "max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="execution-dialog-title"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="space-y-0.5 pr-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
              Guia de Execução
            </span>
            <div className="flex items-center gap-2">
              <h2
                id="execution-dialog-title"
                className="font-heading text-base sm:text-lg font-bold text-foreground leading-tight line-clamp-1"
              >
                {exerciseName}
              </h2>
              {animation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
                  <Box className="size-3" /> 3D
                </span>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar guia de execução"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className={cn("flex-1 overflow-y-auto", animation ? "p-3.5 sm:p-4 space-y-3" : "p-4 sm:p-5 space-y-4")}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-xs font-heading font-medium">
                Carregando demonstração e instruções...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              <p className="text-xs font-heading font-semibold text-destructive">
                Não foi possível carregar a demonstração
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {errorMessage}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (exerciseId) {
                    setIsLoading(true);
                    setErrorMessage(null);
                    getExerciseMediaAction(exerciseId)
                      .then((res) => {
                        if (res.success) setData(res.data);
                        else setErrorMessage(res.error);
                      })
                      .catch((e) =>
                        setErrorMessage(
                          e instanceof Error ? e.message : "Erro desconhecido",
                        ),
                      )
                      .finally(() => setIsLoading(false));
                  }
                }}
                className="mt-2 text-xs"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {/* Alternador de Modo (3D vs 2D) quando o exercício possui modelagem 3D */}
              {animation && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setMediaTab("3d")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer",
                      mediaTab === "3d"
                        ? "bg-card text-foreground shadow-xs border border-border/60 font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Box className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Simulação 3D</span>
                    <span className="rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] px-1.5 py-0.2 font-mono">
                      Interativo
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaTab("2d")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-heading font-semibold transition-all cursor-pointer",
                      mediaTab === "2d"
                        ? "bg-card text-foreground shadow-xs border border-border/60 font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ImageIcon className="size-3.5" />
                    <span>Guia Ilustrado (2D)</span>
                  </button>
                </div>
              )}

              {/* Visualização Ativa: 3D ou Sequência 2D */}
              {animation && mediaTab === "3d" ? (
                <Exercise3DViewer
                  key={dialogKey}
                  exercise={animation}
                  inDialog={true}
                  compact={true}
                />
              ) : data ? (
                <ExerciseMediaPreview
                  media={data}
                  exerciseName={exerciseName}
                  autoPlay={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-border/60 bg-muted/20 text-muted-foreground space-y-2">
                  <ImageIcon className="size-8 opacity-40" />
                  <p className="text-xs font-heading font-medium text-foreground">
                    Guia ilustrado 2D em sincronização
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    A demonstração 3D interativa está ativa na aba &ldquo;Simulação 3D&rdquo;.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMediaTab("3d")}
                    className="mt-1 text-xs"
                  >
                    <Box className="size-3.5 text-blue-600 dark:text-blue-400 mr-1.5" />
                    Ver Simulação 3D
                  </Button>
                </div>
              )}

              {/* Instruções Detalhadas em PT-BR */}
              {instructions ? (
                <div className="space-y-3 pt-2">
                  {/* Padrão de Movimento */}
                  {instructions.description && (
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <Info className="size-3.5 text-primary" />
                        <span>Padrão do Movimento</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {instructions.description}
                      </p>
                    </div>
                  )}

                  {/* Preparação e Postura */}
                  {instructions.setup && (
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <CheckCircle2 className="size-3.5 text-blue-500" />
                        <span>Posicionamento Inicial</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {instructions.setup}
                      </p>
                    </div>
                  )}

                  {/* Execução */}
                  {instructions.execution && (
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <Sparkles className="size-3.5 text-emerald-500" />
                        <span>Como Executar o Movimento</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {instructions.execution}
                      </p>
                    </div>
                  )}

                  {/* Cuidados e Dicas */}
                  {instructions.tips && (
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <ShieldAlert className="size-3.5 text-sky-500" />
                        <span>Cuidados & Dicas de Segurança</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {instructions.tips}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Atribuição da Fonte (Obrigatória e visível) */}
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Ilustrações por{" "}
                  <strong className="font-semibold text-foreground/80">
                    RepDB Free
                  </strong>
                </span>
                <a
                  href="https://repdb.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <span>repdb.co</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Rodapé de Ação */}
        <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl font-heading font-semibold text-xs h-10 hover:bg-muted"
          >
            Voltar ao Treino
          </Button>
        </div>
      </div>
    </div>
  );
}
