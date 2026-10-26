"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Check,
  Dumbbell,
  Eye,
  Loader2,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";

import { getExerciseAnimation } from "@/app/_components/exercise-3d/exercises";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";

import type {
  CreateExerciseBodyPrimaryMuscleGroupsItem,
  CreateExerciseBodySecondaryMuscleGroupsItem,
  ListExercises200Item,
} from "@/app/_lib/api/fetch-generated";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import {
  ALL_MUSCLE_GROUPS,
  getMuscleGroupLabel,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  createExerciseAction,
  updateExerciseMusclesAction,
} from "../_actions";

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => Promise<void>;
}

type ModalView = "LIST" | "CREATE_CUSTOM" | "EDIT_MUSCLES";

export function ExerciseSelectorModal({
  isOpen,
  onClose,
  onSelectExercise,
}: ExerciseSelectorModalProps) {
  const [view, setView] = useState<ModalView>("LIST");
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmittingTransition] = useTransition();

  const {
    exercises: allExercises,
    search,
    isSyncing,
    hasNewUpdate,
    dismissUpdateNotice,
    addCustomExercise,
    updateExerciseInCache,
  } = useExerciseCatalog({ autoSync: isOpen });

  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleGroup | "">("");
  const [only3D, setOnly3D] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Busca instantânea em memória (0 ms)
  const exercises = useMemo(() => {
    const list = search(query, selectedMuscleFilter);
    if (only3D) {
      return list.filter((ex) => getExerciseAnimation(ex.id) !== null);
    }
    return list;
  }, [search, query, selectedMuscleFilter, only3D]);

  const isLoading = allExercises.length === 0 && isSyncing;

  // Estados do formulário de criação / edição de músculos
  const [customName, setCustomName] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup | "">("");
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [editingExercise, setEditingExercise] = useState<ListExercises200Item | null>(null);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const hasExactMatch = allExercises.some(
    (ex) => ex.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const resetForm = () => {
    setCustomName("");
    setIsUnilateral(false);
    setPrimaryMuscle("");
    setSecondaryMuscles([]);
    setEditingExercise(null);
    setErrorMessage(null);
    setSelectedMuscleFilter("");
  };

  const handleClose = () => {
    setQuery("");
    resetForm();
    setView("LIST");
    onClose();
  };

  const handleSelect = (exerciseId: string) => {
    if (isSubmitting) return;
    setErrorMessage(null);
    startSubmittingTransition(async () => {
      try {
        await onSelectExercise(exerciseId);
        handleClose();
      } catch (err: unknown) {
        setErrorMessage(
          (err as Error)?.message || "Erro ao adicionar exercício",
        );
      }
    });
  };

  const openCreateForm = (initialName?: string) => {
    resetForm();
    setCustomName(initialName ?? trimmedQuery);
    setView("CREATE_CUSTOM");
  };

  const openEditMuscles = (exercise: ListExercises200Item, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetForm();
    setEditingExercise(exercise);
    const primary = exercise.muscles?.find((m) => m.role === "PRIMARY");
    const secondaries =
      exercise.muscles
        ?.filter((m) => m.role === "SECONDARY")
        .map((m) => m.muscleGroup as MuscleGroup) ?? [];

    setPrimaryMuscle((primary?.muscleGroup as MuscleGroup) || "");
    setSecondaryMuscles(secondaries);
    setView("EDIT_MUSCLES");
  };

  const toggleSecondaryMuscle = (muscle: MuscleGroup) => {
    if (secondaryMuscles.includes(muscle)) {
      setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
    } else {
      setSecondaryMuscles([...secondaryMuscles, muscle]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = customName.trim();
    if (!trimmed) {
      setErrorMessage("Nome do exercício é obrigatório.");
      return;
    }

    if (!primaryMuscle) {
      setErrorMessage("Selecione o músculo principal do exercício.");
      return;
    }

    setErrorMessage(null);
    startSubmittingTransition(async () => {
      const createRes = await createExerciseAction({
        name: trimmed,
        isUnilateral,
        primaryMuscleGroups: [
          primaryMuscle as CreateExerciseBodyPrimaryMuscleGroupsItem,
        ],
        secondaryMuscleGroups:
          secondaryMuscles.length > 0
            ? (secondaryMuscles as CreateExerciseBodySecondaryMuscleGroupsItem[])
            : undefined,
      });

      if (!createRes.success) {
        setErrorMessage(createRes.error);
        return;
      }

      addCustomExercise({
        id: createRes.data.id,
        name: createRes.data.name,
        ownerUserId: createRes.data.ownerUserId,
        isUnilateral: createRes.data.isUnilateral,
        hasMedia: false,
        muscles: createRes.data.muscles,
      });

      try {
        await onSelectExercise(createRes.data.id);
        handleClose();
      } catch (err: unknown) {
        setErrorMessage(
          (err as Error)?.message || "Erro ao adicionar exercício criado",
        );
      }
    });
  };

  const handleEditMusclesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !editingExercise) return;

    if (!primaryMuscle) {
      setErrorMessage("Selecione pelo menos um músculo principal.");
      return;
    }

    setErrorMessage(null);
    startSubmittingTransition(async () => {
      const updateRes = await updateExerciseMusclesAction(editingExercise.id, {
        primaryMuscleGroups: [primaryMuscle],
        secondaryMuscleGroups:
          secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
      });

      if (!updateRes.success) {
        setErrorMessage(updateRes.error);
        return;
      }

      // Atualiza no cache local de exercícios
      updateExerciseInCache({
        ...editingExercise,
        muscles: updateRes.data.muscles,
      });

      resetForm();
      setView("LIST");
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-selector-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pb-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================== VIEW: LISTA ===================== */}
        {view === "LIST" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="size-5 text-primary" />
                <h2
                  id="exercise-selector-title"
                  className="font-heading text-lg font-bold text-foreground"
                >
                  Adicionar Exercício
                </h2>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                    <Loader2 className="size-3 animate-spin text-primary" />
                    <span className="hidden sm:inline">Atualizando...</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            {/* Aviso de catálogo atualizado em segundo plano */}
            {hasNewUpdate && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-heading font-medium text-emerald-500 animate-in fade-in">
                <span>✨ Catálogo de exercícios atualizado</span>
                <button
                  type="button"
                  onClick={dismissUpdateNotice}
                  className="rounded p-0.5 hover:bg-emerald-500/20"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Fechar aviso</span>
                </button>
              </div>
            )}

            {/* Input de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar exercício..."
                disabled={isSubmitting}
                className="h-11 pl-9 pr-8 rounded-xl font-heading text-sm"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Limpar busca</span>
                </button>
              )}
            </div>

            {/* Chips Rápidos de Filtro por Grupo Muscular e 3D */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedMuscleFilter("");
                  setOnly3D(false);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-heading font-semibold transition shrink-0 cursor-pointer ${
                  selectedMuscleFilter === "" && !only3D
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setOnly3D(!only3D)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-heading font-semibold transition shrink-0 cursor-pointer ${
                  only3D
                    ? "bg-orange-500 text-slate-950 shadow-xs font-bold"
                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25 hover:bg-orange-500/20"
                }`}
              >
                <Box className="size-3" />
                <span>Com 3D</span>
              </button>
              {ALL_MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg.value}
                  type="button"
                  onClick={() => {
                    setSelectedMuscleFilter(
                      selectedMuscleFilter === mg.value ? "" : mg.value,
                    );
                    setOnly3D(false);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-heading font-semibold transition shrink-0 cursor-pointer ${
                    selectedMuscleFilter === mg.value && !only3D
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {mg.label}
                </button>
              ))}
            </div>

            {/* Mensagem de Erro Inline */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive font-heading text-xs font-semibold"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Opção de Criar Exercício Personalizado com Músculos */}
            {trimmedQuery.length > 0 && !hasExactMatch && (
              <Button
                type="button"
                variant="outline"
                onClick={() => openCreateForm(trimmedQuery)}
                disabled={isSubmitting}
                className="w-full justify-start rounded-xl border-dashed border-primary/40 bg-primary/5 py-5 font-heading text-sm font-semibold text-primary hover:bg-primary/10"
              >
                <span className="flex items-center gap-2 truncate">
                  <Plus className="size-4 shrink-0" />
                  Criar &quot;{trimmedQuery}&quot; (com músculos)
                </span>
              </Button>
            )}

            {/* Lista de Exercícios */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 pr-1 max-h-60 sm:max-h-72">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    Nenhum exercício encontrado
                  </p>
                  {trimmedQuery.length > 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode criá-lo como exercício personalizado acima.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite para buscar ou crie um novo exercício.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreateForm()}
                    className="mt-3 text-primary text-xs"
                  >
                    <Plus className="size-3.5 mr-1" /> Criar novo personalizado
                  </Button>
                </div>
              ) : (
                exercises.map((exercise) => {
                  const hasMuscles =
                    exercise.muscles && exercise.muscles.length > 0;
                  const primaryMuscleObj = exercise.muscles?.find(
                    (m) => m.role === "PRIMARY",
                  );
                  const isCustom = exercise.ownerUserId !== null;

                  return (
                    <div
                      key={exercise.id}
                      role="button"
                      aria-label={exercise.name}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(exercise.id);
                        }
                      }}
                      className="w-full text-left py-3 px-2 flex items-center justify-between hover:bg-muted/50 rounded-xl transition-colors group cursor-pointer"
                      onClick={() => handleSelect(exercise.id)}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {exercise.name}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {hasMuscles ? (
                            <>
                              <span className="text-[11px] font-semibold text-primary">
                                {getMuscleGroupLabel(
                                  primaryMuscleObj?.muscleGroup,
                                )}
                              </span>
                              {exercise.muscles!.filter((m) => m.role === "SECONDARY").length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  •{" "}
                                  {exercise.muscles!
                                    .filter((m) => m.role === "SECONDARY")
                                    .map((m) =>
                                      getMuscleGroupLabel(m.muscleGroup),
                                    )
                                    .join(", ")}
                                </span>
                              )}
                            </>
                          ) : isCustom ? (
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label="Definir grupo muscular"
                              onClick={(e) => openEditMuscles(exercise, e)}
                              className="text-[10px] font-medium text-muted-foreground hover:text-primary underline underline-offset-2 cursor-pointer"
                            >
                              Definir grupo muscular
                            </span>
                          ) : null}

                          {isCustom && (
                            <span className="rounded-full bg-secondary/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                              Próprio
                            </span>
                          )}

                          {exercise.isUnilateral && (
                            <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[9px] font-semibold">
                              Unilateral
                            </span>
                          )}

                          {getExerciseAnimation(exercise.id) !== null ? (
                            <span
                              title="Demonstração 3D interativa disponível"
                              className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-bold"
                            >
                              <Box className="size-2.5" />
                              <span>3D</span>
                            </span>
                          ) : exercise.hasMedia ? (
                            <span
                              title="Demonstração visual disponível"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium"
                            >
                              <Eye className="size-2.5" />
                              <span>Demo</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Botão de Ver Execução / 3D direto do catálogo */}
                        <button
                          type="button"
                          title={getExerciseAnimation(exercise.id) !== null ? "Ver demonstração 3D" : "Ver demonstração"}
                          aria-label={getExerciseAnimation(exercise.id) !== null ? "Ver demonstração 3D" : "Ver demonstração"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewExercise({ id: exercise.id, name: exercise.name });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-heading font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50 transition-colors cursor-pointer"
                        >
                          {getExerciseAnimation(exercise.id) !== null ? (
                            <Box className="size-3 text-orange-500" />
                          ) : (
                            <Eye className="size-3" />
                          )}
                          <span className="hidden sm:inline">
                            {getExerciseAnimation(exercise.id) !== null ? "Ver 3D" : "Ver guia"}
                          </span>
                        </button>

                        {isCustom && hasMuscles && (
                          <span
                            role="button"
                            tabIndex={0}
                            title="Editar classificação"
                            aria-label="Editar classificação"
                            onClick={(e) => openEditMuscles(exercise, e)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 cursor-pointer"
                          >
                            <Tag className="size-3.5" />
                          </span>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={isSubmitting}
                          title="Adicionar ao treino"
                          className="size-8 rounded-full text-muted-foreground group-hover:text-primary"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ===================== VIEW: CRIAR PERSONALIZADO ===================== */}
        {view === "CREATE_CUSTOM" && (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[calc(85vh-5rem)] pr-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("LIST");
                    setErrorMessage(null);
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-5" />
                  <span className="sr-only">Voltar</span>
                </button>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Novo Exercício
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            {/* Mensagem de Erro Inline */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive font-heading text-xs font-semibold"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campo Nome * */}
            <div className="space-y-1.5">
              <label
                htmlFor="custom-exercise-name"
                className="font-heading text-xs font-semibold text-foreground"
              >
                Nome do exercício *
              </label>
              <Input
                id="custom-exercise-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Supino Inclinado com Halteres"
                className="h-11 rounded-xl text-sm"
                autoFocus
                required
              />
            </div>

            {/* Campo Músculo Principal * */}
            <div className="space-y-1.5">
              <label
                htmlFor="custom-exercise-primary-muscle"
                className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Músculo principal *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Série direta
                </span>
              </label>
              <select
                id="custom-exercise-primary-muscle"
                value={primaryMuscle}
                onChange={(e) => {
                  const val = e.target.value as MuscleGroup | "";
                  setPrimaryMuscle(val);
                  // Remove do secundário se foi escolhido como primário
                  if (val && secondaryMuscles.includes(val)) {
                    setSecondaryMuscles(
                      secondaryMuscles.filter((m) => m !== val),
                    );
                  }
                }}
                required
                className="w-full h-11 px-3 rounded-xl border border-input bg-background font-heading text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione o músculo principal...</option>
                {ALL_MUSCLE_GROUPS.map((mg) => (
                  <option key={mg.value} value={mg.value}>
                    {mg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Músculos Auxiliares */}
            <div className="space-y-1.5">
              <label className="font-heading text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Músculos auxiliares (opcional)</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Série indireta
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/50 rounded-xl bg-muted/20">
                {ALL_MUSCLE_GROUPS.filter(
                  (mg) => mg.value !== primaryMuscle,
                ).map((mg) => {
                  const isSelected = secondaryMuscles.includes(mg.value);
                  return (
                    <button
                      key={mg.value}
                      type="button"
                      onClick={() => toggleSecondaryMuscle(mg.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-heading transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {isSelected && <Check className="size-3" />}
                      {mg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo Exercício Unilateral */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-xs font-semibold text-foreground">
                  Exercício unilateral
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Executado um lado por vez (volume ×2)
                </span>
              </div>
              <Switch
                checked={isUnilateral}
                onCheckedChange={setIsUnilateral}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setView("LIST");
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !customName.trim() || !primaryMuscle}
                className="flex-1 rounded-xl font-heading font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  "Salvar e Adicionar"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* ===================== VIEW: EDITAR CLASSIFICAÇÃO ===================== */}
        {view === "EDIT_MUSCLES" && editingExercise && (
          <form onSubmit={handleEditMusclesSubmit} className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("LIST");
                    setErrorMessage(null);
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-5" />
                  <span className="sr-only">Voltar</span>
                </button>
                <div className="flex flex-col">
                  <h2 className="font-heading text-base font-bold text-foreground">
                    Classificar Músculos
                  </h2>
                  <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                    {editingExercise.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            {/* Mensagem de Erro Inline */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive font-heading text-xs font-semibold"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campo Músculo Principal * */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-exercise-primary-muscle"
                className="font-heading text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Músculo principal *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Série direta
                </span>
              </label>
              <select
                id="edit-exercise-primary-muscle"
                value={primaryMuscle}
                onChange={(e) => {
                  const val = e.target.value as MuscleGroup | "";
                  setPrimaryMuscle(val);
                  if (val && secondaryMuscles.includes(val)) {
                    setSecondaryMuscles(
                      secondaryMuscles.filter((m) => m !== val),
                    );
                  }
                }}
                required
                className="w-full h-11 px-3 rounded-xl border border-input bg-background font-heading text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione o músculo principal...</option>
                {ALL_MUSCLE_GROUPS.map((mg) => (
                  <option key={mg.value} value={mg.value}>
                    {mg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Músculos Auxiliares */}
            <div className="space-y-1.5">
              <label className="font-heading text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Músculos auxiliares (opcional)</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Série indireta
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/50 rounded-xl bg-muted/20">
                {ALL_MUSCLE_GROUPS.filter(
                  (mg) => mg.value !== primaryMuscle,
                ).map((mg) => {
                  const isSelected = secondaryMuscles.includes(mg.value);
                  return (
                    <button
                      key={mg.value}
                      type="button"
                      onClick={() => toggleSecondaryMuscle(mg.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-heading transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {isSelected && <Check className="size-3" />}
                      {mg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setView("LIST");
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !primaryMuscle}
                className="flex-1 rounded-xl font-heading font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  "Salvar Classificação"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Diálogo de Prévia de Execução e 3D acionado do catálogo */}
      <ExerciseExecutionDialog
        isOpen={previewExercise !== null}
        onClose={() => setPreviewExercise(null)}
        exerciseId={previewExercise?.id}
        exerciseName={previewExercise?.name ?? ""}
      />
    </div>
  );
}
