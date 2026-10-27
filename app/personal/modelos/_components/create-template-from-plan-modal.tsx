"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Layers, Check, Loader2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTemplateFromPlanAction } from "@/app/personal/_actions";
import { cn } from "@/lib/utils";

export interface CoachPlanOption {
  id: string;
  name: string;
  workoutDaysCount?: number;
}

interface CreateTemplateFromPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: CoachPlanOption[];
  onSuccess?: () => void;
}

export function CreateTemplateFromPlanModal({
  isOpen,
  onClose,
  plans,
  onSuccess,
}: CreateTemplateFromPlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSelectPlan = (plan: CoachPlanOption) => {
    setSelectedPlanId(plan.id);
    setName(plan.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error("Selecione um treino pessoal para importar.");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Informe um nome para o modelo.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await createTemplateFromPlanAction(selectedPlanId, {
        name: trimmedName,
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Modelo "${trimmedName}" criado com sucesso a partir do seu treino!`);
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
              <Layers className="size-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Importar de Meus Treinos
              </h2>
              <p className="text-xs text-muted-foreground">
                Transforme um dos seus treinos pessoais em um modelo pré-definido reutilizável.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Selecionar Plano */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selecione o Treino Base *
            </Label>

            {plans.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
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
                            "flex size-8 items-center justify-center rounded-lg shrink-0",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Dumbbell className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-heading text-xs font-semibold text-foreground truncate">
                            {plan.name}
                          </div>
                          {plan.workoutDaysCount !== undefined && (
                            <div className="text-[11px] text-muted-foreground">
                              {plan.workoutDaysCount} dia{plan.workoutDaysCount !== 1 ? "s" : ""} de treino
                            </div>
                          )}
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
                Você ainda não tem treinos cadastrados na aba &ldquo;Meus Treinos&rdquo;.
              </div>
            )}
          </div>

          {/* Nome do Modelo */}
          <div className="space-y-1.5">
            <Label htmlFor="model-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome do Modelo *
            </Label>
            <Input
              id="model-name"
              placeholder="Ex: ABC Hipertrofia Intermediário"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="model-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição (Opcional)
            </Label>
            <Input
              id="model-desc"
              placeholder="Ex: Foco em peito, costas e pernas com ênfase em sobrecarga progressiva"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="model-tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tags (Separadas por vírgula)
            </Label>
            <Input
              id="model-tags"
              placeholder="Ex: Hipertrofia, Intermediário, ABC"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
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
              type="submit"
              disabled={isPending || !selectedPlanId || !name.trim()}
              className="rounded-xl h-11 px-6 font-heading font-semibold"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Importando...</span>
                </div>
              ) : (
                "Salvar como Modelo"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
