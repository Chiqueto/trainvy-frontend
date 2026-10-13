"use client";

import { useState } from "react";
import {
  Bug,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  MessageSquarePlus,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory = "BUG" | "SUGGESTION" | "QUESTION" | "OTHER";

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [category, setCategory] = useState<FeedbackCategory>("SUGGESTION");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setErrorMessage("Por favor, descreva sua mensagem com ao menos 5 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, message }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao enviar feedback.");
      }

      setIsSuccess(true);
      setMessage("");
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar seu feedback agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquarePlus className="size-4" />
            </div>
            <h2
              id="feedback-dialog-title"
              className="font-heading text-base font-bold text-foreground"
            >
              Enviar Feedback
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar diálogo de feedback"
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in duration-200">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="font-heading font-semibold text-sm text-foreground">
              Feedback enviado com sucesso!
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Obrigado por contribuir para o aperfeiçoamento contínuo do Trainvy.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Categoria
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("BUG")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    category === "BUG"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bug className="size-3.5" />
                  Problema (Bug)
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("SUGGESTION")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    category === "SUGGESTION"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lightbulb className="size-3.5" />
                  Sugestão
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("QUESTION")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    category === "QUESTION"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HelpCircle className="size-3.5" />
                  Dúvida
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("OTHER")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    category === "OTHER"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquarePlus className="size-3.5" />
                  Outro
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Descrição
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {message.length}/2000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Descreva o que aconteceu ou como podemos melhorar..."
                className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-destructive font-medium">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-heading"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || message.trim().length < 5}
                className="text-xs font-heading font-semibold gap-1.5"
              >
                <Send className="size-3.5" />
                {isSubmitting ? "Enviando..." : "Enviar feedback"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
