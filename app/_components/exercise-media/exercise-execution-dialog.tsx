"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { getExerciseMediaAction } from "@/app/_actions/exercise-media";
import type { GetExerciseMedia200 } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

import { ExerciseMediaPreview } from "./exercise-media-preview";
import { Exercise3DPreview } from "../exercise-3d/exercise-3d-preview";
import { getExerciseAnimation } from "../exercise-3d/exercises";

interface ExerciseExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId?: string | null;
  exerciseName: string;
}

export function ExerciseExecutionDialog({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
}: ExerciseExecutionDialogProps) {
  const [data, setData] = useState<GetExerciseMedia200 | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(isOpen && exerciseId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Armazena a chave de rastreamento para limpar dados síncronamente durante a renderização se mudar o exercício ou status de abertura
  const dialogKey = `${isOpen ? "open" : "closed"}-${exerciseId ?? ""}`;
  const [prevDialogKey, setPrevDialogKey] = useState(dialogKey);

  if (dialogKey !== prevDialogKey) {
    setPrevDialogKey(dialogKey);
    setData(null);
    setErrorMessage(null);
    setIsLoading(Boolean(isOpen && exerciseId));
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
    if (!isOpen || !exerciseId) {
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

  const instructions = data?.instructions;
  const animation = getExerciseAnimation(exerciseId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
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
            <h2
              id="execution-dialog-title"
              className="font-heading text-base sm:text-lg font-bold text-foreground leading-tight line-clamp-1"
            >
              {exerciseName}
            </h2>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {animation && <Exercise3DPreview key={dialogKey} exercise={animation} />}
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
              {/* Visualizador de Imagens */}
              <ExerciseMediaPreview
                media={data}
                exerciseName={exerciseName}
                autoPlay={true}
              />

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
                        <CheckCircle2 className="size-3.5 text-amber-500" />
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
