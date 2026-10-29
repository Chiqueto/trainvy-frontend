"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Send, User, Check, Loader2, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { allocateTemplateAction } from "@/app/personal/_actions";
import { cn } from "@/lib/utils";

export interface AthleteOption {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description?: string | null;
  workoutDaysCount?: number;
  totalExercisesCount?: number;
}

interface AllocateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateSummary | null;
  athletes: AthleteOption[];
  onSuccess?: () => void;
}

export function AllocateTemplateModal({
  isOpen,
  onClose,
  template,
  athletes,
  onSuccess,
}: AllocateTemplateModalProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !template) return null;

  const activeAthletes = athletes.filter((a) => a.status === "ACTIVE");

  const handleAllocate = () => {
    if (!selectedAthleteId) {
      toast.error("Selecione um aluno para receber a prescrição.");
      return;
    }

    startTransition(async () => {
      const res = await allocateTemplateAction(template.id, {
        athleteId: selectedAthleteId,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        const student = athletes.find((a) => a.id === selectedAthleteId);
        toast.success(
          `Rascunho "${template.name}" criado para revisão antes de enviar a ${student?.name || "o aluno"}.`,
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Send className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Alocar Modelo para Aluno
              </h2>
              <p className="text-xs text-muted-foreground">
                Cria um rascunho. Revise e aprove a versão final antes de enviar
                ao aluno.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Resumo do Modelo */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
            <Layers className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-bold text-foreground truncate">
              {template.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {template.description || "Modelo pré-definido de treino"}
            </p>
          </div>
        </div>

        {/* Seleção do Aluno */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selecione o Aluno *
          </Label>

          {activeAthletes.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {activeAthletes.map((athlete) => {
                const isSelected = selectedAthleteId === athlete.id;
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => setSelectedAthleteId(athlete.id)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground shadow-xs"
                        : "border-border/70 bg-background/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg font-heading text-xs font-bold shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {athlete.name ? athlete.name[0].toUpperCase() : "A"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-heading text-xs font-semibold text-foreground truncate">
                          {athlete.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {athlete.email}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "size-5 rounded-full border flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Você não possui nenhum aluno ativo vinculado no momento. Convide
              um aluno na aba &ldquo;Alunos&rdquo;.
            </div>
          )}
        </div>

        {/* Orientações opcionais */}
        <div className="space-y-1.5">
          <Label
            htmlFor="template-notes"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Orientações / Notas para o Aluno (Opcional)
          </Label>
          <textarea
            id="template-notes"
            rows={3}
            placeholder="Ex: Foque no aquecimento antes de cada série pesada. Qualquer dúvida me mande mensagem!"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl h-11 px-5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAllocate}
            disabled={isPending || !selectedAthleteId}
            className="rounded-xl h-11 px-6 font-heading font-semibold"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Alocando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="size-4" />
                <span>Criar rascunho para revisão</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
