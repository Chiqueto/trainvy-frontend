"use client";

import { useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !exerciseId) return;

    let isMounted = true;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await getExerciseMediaAction(exerciseId);
        if (!isMounted) return;
        if (res.success) {
          setData(res.data);
        } else {
          setErrorMessage(res.error);
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Falha ao carregar instruções do exercício",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, exerciseId]);

  // Fechamento via teclado (ESC)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const instructions = data?.instructions;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-xs font-heading font-medium">
                Carregando demonstração e instruções...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive space-y-2">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>Não foi possível carregar a demonstração</span>
              </div>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>
          ) : (
            <>
              {/* Prévia Visual */}
              <ExerciseMediaPreview
                media={data}
                exerciseName={exerciseName}
              />

              {/* Orientações e Instruções de Execução */}
              {instructions ? (
                <div className="space-y-3 pt-1">
                  {/* Descrição */}
                  {instructions.description && (
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/25 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <Info className="size-3.5 text-primary" />
                        <span>Sobre o Exercício</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {instructions.description}
                      </p>
                    </div>
                  )}

                  {/* Como Iniciar (Setup) */}
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

                  {/* Como Executar */}
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
