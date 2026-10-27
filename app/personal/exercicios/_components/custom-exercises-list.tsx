"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Dumbbell,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMuscleGroupLabel, type MuscleGroup } from "@/app/_lib/muscle-labels";
import { deleteCustomExerciseAction } from "@/app/personal/_actions";
import {
  CustomExerciseModal,
  type CustomExerciseItem,
} from "./custom-exercise-modal";
import { cn } from "@/lib/utils";

interface CustomExercisesListProps {
  initialExercises: CustomExerciseItem[];
}

const FILTER_CHIPS = [
  { id: "ALL", label: "Todos" },
  { id: "CHEST", label: "Peito" },
  { id: "BACK", label: "Costas" },
  { id: "LEGS", label: "Pernas" },
  { id: "SHOULDERS", label: "Ombros" },
  { id: "ARMS", label: "Braços" },
  { id: "CORE", label: "Core / Abdômen" },
];

export function CustomExercisesList({ initialExercises }: CustomExercisesListProps) {
  const [exercises, setExercises] = useState<CustomExerciseItem[]>(initialExercises);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<CustomExerciseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setExerciseToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exercise: CustomExerciseItem) => {
    setExerciseToEdit(exercise);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o exercício "${name}"?`)) return;

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteCustomExerciseAction(id);
      if (res.success) {
        toast.success("Exercício excluído com sucesso.");
        setExercises((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error(res.error);
      }
      setDeletingId(null);
    });
  };

  // Filtragem
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === "ALL") return true;

    const muscles = (ex.muscles ?? []).map((m) => m.muscleGroup);

    if (selectedFilter === "LEGS") {
      return muscles.some((m) =>
        ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ADDUCTORS", "HIP_ABDUCTORS"].includes(m),
      );
    }
    if (selectedFilter === "ARMS") {
      return muscles.some((m) => ["BICEPS", "TRICEPS", "FOREARMS"].includes(m));
    }
    return muscles.includes(selectedFilter);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Barra Superior de Ações e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card border-border/70 text-sm"
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-11 rounded-2xl px-5 font-heading font-semibold text-sm flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="size-4" />
          <span>Novo Exercício</span>
        </Button>
      </div>

      {/* Chips de Filtro por Grupo Muscular */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = selectedFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedFilter(chip.id)}
              className={cn(
                "inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-all whitespace-nowrap",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Contagem e Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando <strong className="text-foreground">{filteredExercises.length}</strong> de{" "}
          <strong className="text-foreground">{exercises.length}</strong> exercícios personalizados
        </span>
      </div>

      {/* Grid de Exercícios */}
      {filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredExercises.map((exercise) => {
            const primaryMuscles = (exercise.muscles ?? []).filter((m) => m.role === "PRIMARY");
            const secondaryMuscles = (exercise.muscles ?? []).filter((m) => m.role === "SECONDARY");
            const isDeleting = deletingId === exercise.id;

            return (
              <div
                key={exercise.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Dumbbell className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {exercise.name}
                        </h3>
                        {exercise.isUnilateral && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                            <Activity className="size-3" />
                            <span>Unilateral</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(exercise)}
                        disabled={isDeleting}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar exercício"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exercise.id, exercise.name)}
                        disabled={isDeleting}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir exercício"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Badges de Grupos Musculares */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {primaryMuscles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted-foreground/80 mr-1">
                          Alvo:
                        </span>
                        {primaryMuscles.map((m, idx) => (
                          <Badge
                            key={`pri-${idx}`}
                            variant="secondary"
                            className="bg-primary/15 text-primary border-primary/25 font-heading text-[11px] px-2 py-0.5"
                          >
                            {getMuscleGroupLabel(m.muscleGroup)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {secondaryMuscles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted-foreground/80 mr-1">
                          Sinergistas:
                        </span>
                        {secondaryMuscles.map((m, idx) => (
                          <Badge
                            key={`sec-${idx}`}
                            variant="outline"
                            className="text-muted-foreground border-border/80 text-[11px] px-2 py-0.5"
                          >
                            {getMuscleGroupLabel(m.muscleGroup)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/80 bg-card/40 p-10 sm:p-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {search || selectedFilter !== "ALL"
                ? "Nenhum exercício encontrado"
                : "Nenhum exercício personalizado ainda"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {search || selectedFilter !== "ALL"
                ? "Tente ajustar seus termos de busca ou filtros de grupos musculares."
                : "Cadastre seus próprios exercícios, variações exclusivas com halteres, máquinas ou execuções específicas para utilizar em suas prescrições e modelos."}
            </p>
          </div>
          {search || selectedFilter !== "ALL" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setSelectedFilter("ALL");
              }}
              className="rounded-xl h-10 px-4 text-xs font-heading font-medium"
            >
              Limpar filtros
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreate}
              className="rounded-2xl h-11 px-6 text-sm font-heading font-semibold shadow-xs"
            >
              <Plus className="size-4 mr-2" />
              Cadastrar Primeiro Exercício
            </Button>
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <CustomExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exerciseToEdit={exerciseToEdit}
        onSuccess={() => {
          // Atualiza a página
          window.location.reload();
        }}
      />
    </div>
  );
}
