"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Check, Dumbbell, LoaderCircle, Plus, Search, X } from "lucide-react";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import {
  ALL_MUSCLE_GROUPS,
  getMuscleGroupLabel,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CatalogFilters {
  excludeIds?: string[];
  relatedExerciseId?: string | null;
}
interface CatalogExercisePickerProps extends CatalogFilters {
  label: string;
  name?: string;
  disabled?: boolean;
  optional?: boolean;
  onSelect: (exercise: ListExercises200Item | null) => void;
}

export function CatalogExercisePicker({
  label,
  name,
  disabled,
  optional,
  onSelect,
  ...filters
}: CatalogExercisePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex min-w-0 items-center gap-1">
          <Dialog.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={`${label}: ${name || "Selecionar exercício"}`}
              className="h-auto min-h-11 min-w-0 flex-1 justify-start rounded-xl px-3 py-2 text-left whitespace-normal"
            >
              <Search className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 break-words">
                {name || "Selecionar exercício"}
              </span>
            </Button>
          </Dialog.Trigger>
          {optional && name && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`Remover ${label.toLowerCase()}`}
              onClick={() => onSelect(null)}
              className="size-11 shrink-0"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {open && (
        <CatalogDialog
          {...filters}
          title={label}
          onSelect={(exercise) => {
            onSelect(exercise);
            setOpen(false);
          }}
        />
      )}
    </Dialog.Root>
  );
}

export function CatalogExerciseBatchPicker({
  onSelect,
  disabled,
  ...filters
}: CatalogFilters & {
  onSelect: (exercises: ListExercises200Item[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          disabled={disabled}
          className="min-h-11 rounded-xl"
        >
          <Plus className="size-4" />
          Adicionar exercícios
        </Button>
      </Dialog.Trigger>
      {open && (
        <CatalogDialog
          {...filters}
          title="Montar sequência de exercícios"
          onSelectMany={(exercises) => {
            onSelect(exercises);
            setOpen(false);
          }}
        />
      )}
    </Dialog.Root>
  );
}

function CatalogDialog({
  title,
  onSelect,
  onSelectMany,
  excludeIds = [],
  relatedExerciseId,
}: CatalogFilters & {
  title: string;
  onSelect?: (exercise: ListExercises200Item) => void;
  onSelectMany?: (exercises: ListExercises200Item[]) => void;
}) {
  const { search, exercises, isSyncing, refresh } = useExerciseCatalog({
    autoSync: false,
  });
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "global" | "mine">("all");
  const [muscle, setMuscle] = useState<MuscleGroup | "" | undefined>();
  const [limit, setLimit] = useState(40);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ListExercises200Item[]>([]);
  const related = exercises.find(
    (exercise) => exercise.id === relatedExerciseId,
  );
  const suggestedMuscle = related?.muscles.find(
    (entry) => entry.role === "PRIMARY",
  )?.muscleGroup;
  const muscleFilter = muscle ?? suggestedMuscle ?? "";
  const mineCount = exercises.filter(
    (exercise) => exercise.ownerUserId != null,
  ).length;
  useEffect(() => {
    let active = true;
    void refresh().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [refresh]);
  const results = search(query, muscleFilter).filter(
    (exercise) =>
      !excludeIds.includes(exercise.id) &&
      (source === "all" ||
        (source === "mine"
          ? exercise.ownerUserId != null
          : exercise.ownerUserId == null)),
  );
  function toggle(exercise: ListExercises200Item) {
    setSelected((current) =>
      current.some((entry) => entry.id === exercise.id)
        ? current.filter((entry) => entry.id !== exercise.id)
        : [...current, exercise],
    );
  }
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-xs" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[141] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 p-5 pb-4">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Biblioteca Trainvy
            </p>
            <Dialog.Title className="font-heading text-lg font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {onSelectMany
                ? "Selecione vários exercícios, na ordem em que o aluno vai executar."
                : "Escolha um exercício cadastrado para sua prescrição."}
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar catálogo"
              className="size-11 shrink-0 rounded-full"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>
        </div>
        <div className="space-y-3 border-b border-border px-5 pb-4">
          <div
            role="group"
            aria-label="Origem dos exercícios"
            className="flex gap-1 rounded-xl bg-muted p-1"
          >
            {(
              [
                { value: "all", label: "Todos" },
                { value: "global", label: "Catálogo Trainvy" },
                { value: "mine", label: `Meus exercícios (${mineCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={source === tab.value}
                onClick={() => {
                  setSource(tab.value);
                  setLimit(40);
                }}
                className={`min-h-10 min-w-0 flex-1 rounded-lg px-2 text-xs font-semibold transition ${source === tab.value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
            <Input
              autoFocus
              aria-label="Buscar exercícios"
              placeholder="Busque um exercício ou grupo muscular…"
              className="h-11 rounded-xl pl-10"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(40);
              }}
            />
          </div>
          <div
            role="group"
            aria-label="Filtrar por grupo muscular"
            className="flex gap-1.5 overflow-x-auto pb-1 sm:max-h-28 sm:flex-wrap sm:overflow-y-auto"
          >
            {[
              { value: "" as const, label: "Todos os grupos" },
              ...ALL_MUSCLE_GROUPS,
            ].map((group) => (
              <button
                key={group.value}
                type="button"
                aria-pressed={muscleFilter === group.value}
                onClick={() => {
                  setMuscle(group.value);
                  setLimit(40);
                }}
                className={`min-h-8 shrink-0 rounded-full border px-3 text-xs transition ${muscleFilter === group.value ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
              >
                {group.label}
              </button>
            ))}
          </div>
          {related && (
            <p className="text-xs text-muted-foreground">
              Filtro inicial pelo grupo de {related.name}. Confira a adequação
              da alternativa ao aluno.
            </p>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <p
            role="status"
            className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"
          >
            {isSyncing && <LoaderCircle className="size-4 animate-spin" />}
            {isSyncing
              ? "Atualizando catálogo…"
              : `${results.length} exercícios encontrados`}
          </p>
          {error && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              Não foi possível atualizar o catálogo.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setError(false);
                  void refresh(true).catch(() => setError(true));
                }}
              >
                Tentar novamente
              </button>
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.slice(0, limit).map((exercise) => {
              const selectedIndex = selected.findIndex(
                (entry) => entry.id === exercise.id,
              );
              return (
                <button
                  key={exercise.id}
                  type="button"
                  aria-label={`Selecionar ${exercise.name}`}
                  aria-pressed={onSelectMany ? selectedIndex !== -1 : undefined}
                  onClick={() =>
                    onSelectMany ? toggle(exercise) : onSelect?.(exercise)
                  }
                  className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedIndex !== -1 ? "border-primary bg-primary/10" : "border-border bg-background/50 hover:bg-primary/5"}`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {selectedIndex !== -1 ? (
                      <span className="text-sm font-bold">
                        {selectedIndex + 1}
                      </span>
                    ) : (
                      <Dumbbell className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold">
                      {exercise.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {exercise.muscles
                        .filter((entry) => entry.role === "PRIMARY")
                        .map((entry) => getMuscleGroupLabel(entry.muscleGroup))
                        .join(" · ") || "Exercício do catálogo"}
                    </span>
                    {exercise.ownerUserId != null && (
                      <span className="mt-1 block text-[10px] font-medium text-primary">
                        Criado por você
                      </span>
                    )}
                  </span>
                  {selectedIndex !== -1 && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          {results.length > limit && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => setLimit((current) => current + 40)}
            >
              Mostrar mais exercícios
            </Button>
          )}
          {!results.length && !isSyncing && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <Dumbbell className="mx-auto mb-3 size-7 opacity-50" />
              <p>
                {source === "mine" && mineCount === 0
                  ? "Você ainda não tem exercícios próprios. Cadastre-os em Meus exercícios no painel do personal."
                  : "Nenhum exercício encontrado com esses filtros. Experimente outro grupo ou nome."}
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  setQuery("");
                  setMuscle("");
                  setSource("all");
                  setLimit(40);
                }}
              >
                Limpar filtros
              </Button>
              {!exercises.length && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setError(false);
                    void refresh(true).catch(() => setError(true));
                  }}
                >
                  Atualizar catálogo
                </Button>
              )}
            </div>
          )}
        </div>
        {onSelectMany && (
          <div className="shrink-0 space-y-3 border-t border-border bg-background/80 p-4">
            {selected.length > 0 && (
              <div
                aria-label="Sequência selecionada"
                className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto"
              >
                {selected.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => toggle(exercise)}
                    aria-label={`Retirar ${exercise.name} da seleção`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary"
                  >
                    <span className="font-bold">{index + 1}.</span>
                    {exercise.name}
                    <X className="size-3 shrink-0" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span role="status" className="text-xs text-muted-foreground">
                {selected.length} selecionados · ordem de seleção
              </span>
              <Button
                type="button"
                disabled={!selected.length}
                onClick={() => onSelectMany(selected)}
                className="min-h-11 rounded-xl"
              >
                Adicionar {selected.length || ""} ao treino
              </Button>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
