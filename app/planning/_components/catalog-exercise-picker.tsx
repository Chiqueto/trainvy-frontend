"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Dumbbell, LoaderCircle, Search, X } from "lucide-react";

import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CatalogExercisePickerProps {
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
          onSelect={(exercise) => {
            onSelect(exercise);
            setOpen(false);
          }}
        />
      )}
    </Dialog.Root>
  );
}

function CatalogDialog({
  onSelect,
}: {
  onSelect: (exercise: ListExercises200Item) => void;
}) {
  const { search, exercises, isSyncing, refresh } = useExerciseCatalog({
    autoSync: false,
  });
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void refresh().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  const results = search(query);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <Dialog.Title className="font-heading text-lg font-semibold">
              Selecionar exercício
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Pesquise por nome ou grupo muscular no catálogo cadastrado.
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
        <div className="shrink-0 px-5 pb-3">
          <Input
            autoFocus
            aria-label="Buscar exercícios"
            placeholder="Ex.: supino, agachamento, costas…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(40);
            }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          <p
            role="status"
            className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"
          >
            {isSyncing && <LoaderCircle className="size-4 animate-spin" />}
            {isSyncing
              ? "Atualizando catálogo…"
              : `${results.length} exercícios encontrados`}
          </p>
          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.slice(0, limit).map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    aria-label={`Selecionar ${exercise.name}`}
                    onClick={() => onSelect(exercise)}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background/50 p-4 text-left transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Dumbbell className="size-5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">
                        {exercise.name}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {exercise.muscles
                          .filter((muscle) => muscle.role === "PRIMARY")
                          .map((muscle) =>
                            getMuscleGroupLabel(muscle.muscleGroup),
                          )
                          .join(" · ") || "Exercício do catálogo"}
                      </span>
                    </span>
                  </button>
                ))}
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
            </>
          ) : (
            !isSyncing && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <p>
                  {error
                    ? "Não foi possível carregar o catálogo."
                    : exercises.length
                      ? "Nenhum exercício encontrado. Tente outro nome ou grupo muscular."
                      : "Nenhum exercício disponível. Atualize o catálogo para tentar novamente."}
                </p>
                {(error || !exercises.length) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setError(false);
                      void refresh(true).catch(() => setError(true));
                    }}
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            )
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
