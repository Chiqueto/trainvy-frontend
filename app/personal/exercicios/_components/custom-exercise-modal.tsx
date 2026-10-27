"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Dumbbell, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ALL_MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";
import {
  createCustomExerciseAction,
  updateCustomExerciseAction,
} from "@/app/personal/_actions";
import { cn } from "@/lib/utils";

export interface CustomExerciseItem {
  id: string;
  name: string;
  isUnilateral?: boolean;
  muscles?: Array<{
    muscleGroup: string;
    role: "PRIMARY" | "SECONDARY";
  }>;
}

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseToEdit?: CustomExerciseItem | null;
  onSuccess?: () => void;
}

export function CustomExerciseModal({
  isOpen,
  onClose,
  exerciseToEdit,
  onSuccess,
}: CustomExerciseModalProps) {
  const isEditing = Boolean(exerciseToEdit);
  const [name, setName] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleGroup[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name);
      setIsUnilateral(Boolean(exerciseToEdit.isUnilateral));
      const primaries = (exerciseToEdit.muscles ?? [])
        .filter((m) => m.role === "PRIMARY")
        .map((m) => m.muscleGroup as MuscleGroup);
      const secondaries = (exerciseToEdit.muscles ?? [])
        .filter((m) => m.role === "SECONDARY")
        .map((m) => m.muscleGroup as MuscleGroup);
      setPrimaryMuscles(primaries);
      setSecondaryMuscles(secondaries);
    } else {
      setName("");
      setIsUnilateral(false);
      setPrimaryMuscles([]);
      setSecondaryMuscles([]);
    }
  }, [exerciseToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePrimary = (group: MuscleGroup) => {
    if (primaryMuscles.includes(group)) {
      setPrimaryMuscles(primaryMuscles.filter((g) => g !== group));
    } else {
      setPrimaryMuscles([...primaryMuscles, group]);
      // Remove do secundário se estiver selecionado lá
      setSecondaryMuscles(secondaryMuscles.filter((g) => g !== group));
    }
  };

  const toggleSecondary = (group: MuscleGroup) => {
    if (secondaryMuscles.includes(group)) {
      setSecondaryMuscles(secondaryMuscles.filter((g) => g !== group));
    } else {
      setSecondaryMuscles([...secondaryMuscles, group]);
      // Remove do primário se estiver selecionado lá
      setPrimaryMuscles(primaryMuscles.filter((g) => g !== group));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Informe o nome do exercício.");
      return;
    }

    startTransition(async () => {
      if (isEditing && exerciseToEdit) {
        const res = await updateCustomExerciseAction(exerciseToEdit.id, {
          name: trimmedName,
          isUnilateral,
          primaryMuscleGroups: primaryMuscles as any,
          secondaryMuscleGroups: secondaryMuscles as any,
        });

        if (res.success) {
          toast.success("Exercício atualizado com sucesso!");
          onSuccess?.();
          onClose();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createCustomExerciseAction({
          name: trimmedName,
          isUnilateral,
          primaryMuscleGroups: primaryMuscles as any,
          secondaryMuscleGroups: secondaryMuscles as any,
        });

        if (res.success) {
          toast.success("Exercício personalizado cadastrado com sucesso!");
          onSuccess?.();
          onClose();
        } else {
          toast.error(res.error);
        }
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
              <Dumbbell className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                {isEditing ? "Editar Exercício" : "Novo Exercício Personalizado"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Atualize os detalhes anatômicos e execução do exercício"
                  : "Cadastre um exercício exclusivo para uso em seus treinos e prescrições"}
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="exercise-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome do Exercício *
            </Label>
            <Input
              id="exercise-name"
              placeholder="Ex: Supino Reto Halteres Pegada Neutra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
              autoFocus
            />
          </div>

          {/* Unilateral */}
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-3.5">
            <div className="space-y-0.5">
              <Label htmlFor="is-unilateral" className="text-sm font-heading font-medium cursor-pointer">
                Execução Unilateral
              </Label>
              <p className="text-xs text-muted-foreground">
                Marque se o exercício for realizado um lado por vez (ex: Rosca Concentrada).
              </p>
            </div>
            <Switch
              id="is-unilateral"
              checked={isUnilateral}
              onCheckedChange={setIsUnilateral}
              disabled={isPending}
            />
          </div>

          {/* Músculos Primários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                Músculos Principais / Alvo
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {primaryMuscles.length} selecionado{primaryMuscles.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl border border-border/50 bg-background/50">
              {ALL_MUSCLE_GROUPS.map((mg) => {
                const isSelected = primaryMuscles.includes(mg.value);
                return (
                  <button
                    key={`pri-${mg.value}`}
                    type="button"
                    onClick={() => togglePrimary(mg.value)}
                    disabled={isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                    <span>{mg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Músculos Secundários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Músculos Secundários / Sinergistas
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {secondaryMuscles.length} selecionado{secondaryMuscles.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl border border-border/50 bg-background/50">
              {ALL_MUSCLE_GROUPS.map((mg) => {
                const isSelected = secondaryMuscles.includes(mg.value);
                return (
                  <button
                    key={`sec-${mg.value}`}
                    type="button"
                    onClick={() => toggleSecondary(mg.value)}
                    disabled={isPending}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      isSelected
                        ? "bg-secondary text-secondary-foreground font-semibold border border-primary/30"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                    <span>{mg.label}</span>
                  </button>
                );
              })}
            </div>
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
              disabled={isPending || !name.trim()}
              className="rounded-xl h-11 px-6 font-heading font-semibold"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : isEditing ? (
                "Atualizar Exercício"
              ) : (
                "Cadastrar Exercício"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
