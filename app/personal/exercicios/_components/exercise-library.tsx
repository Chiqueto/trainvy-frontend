"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "radix-ui";
import { saveExerciseDemonstrationAction } from "@/app/_actions/exercise-media";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media";
import { youtubeVideoId } from "@/app/_lib/youtube";
import {
  DemonstrationFields,
  type DemonstrationValue,
} from "./demonstration-fields";
import { CustomExercisesList } from "./custom-exercises-list";
import type { CustomExerciseItem } from "./custom-exercise-modal";

export function ExerciseLibrary({
  customExercises,
  globalExercises,
}: {
  customExercises: CustomExerciseItem[];
  globalExercises: CustomExerciseItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("custom");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CustomExerciseItem | null>(null);
  const [preview, setPreview] = useState<CustomExerciseItem | null>(null);
  const [value, setValue] = useState<DemonstrationValue>({
    youtubeUrl: "",
    animationKey: "",
  });
  const [pending, startTransition] = useTransition();
  const filtered = globalExercises.filter((exercise) =>
    exercise.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );

  function save() {
    if (!editing) return;
    if (value.youtubeUrl.trim() && !youtubeVideoId(value.youtubeUrl.trim())) {
      toast.error("Informe um link válido de vídeo do YouTube.");
      return;
    }
    startTransition(async () => {
      const result = await saveExerciseDemonstrationAction(editing.id, {
        youtubeUrl: value.youtubeUrl.trim() || null,
        animationKey: value.animationKey || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Demonstração atualizada para seus alunos.");
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div
        className="flex gap-2"
        role="group"
        aria-label="Biblioteca de exercícios"
      >
        <Button
          variant={tab === "custom" ? "default" : "outline"}
          onClick={() => setTab("custom")}
        >
          Meus exercícios
        </Button>
        <Button
          variant={tab === "global" ? "default" : "outline"}
          onClick={() => setTab("global")}
        >
          Biblioteca Trainvy
        </Button>
      </div>
      {tab === "custom" ? (
        <CustomExercisesList initialExercises={customExercises} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <h2 className="font-heading font-semibold">
              Sua demonstração, nos exercícios da biblioteca
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione um vídeo ou uma demonstração visual. A personalização
              aparece para você e seus alunos com vínculo ativo.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar exercício da biblioteca"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar exercício da biblioteca..."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} exercícios encontrados. Exibindo até 30
            resultados.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.slice(0, 30).map((exercise) => (
              <div
                key={exercise.id}
                className="space-y-3 rounded-2xl border border-border bg-card p-4"
              >
                <h3 className="font-heading font-semibold">{exercise.name}</h3>
                {exercise.demonstration && (
                  <p className="text-xs text-primary">
                    Demonstração personalizada
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(exercise);
                      setValue({
                        youtubeUrl: exercise.demonstration?.youtubeUrl ?? "",
                        animationKey:
                          exercise.demonstration?.animationKey ?? "",
                      });
                    }}
                  >
                    <Video className="mr-2 size-4" />
                    Personalizar execução
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreview(exercise)}
                  >
                    Ver execução
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {!filtered.length && (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum exercício encontrado.
            </p>
          )}
        </div>
      )}
      <Dialog.Root
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !pending) setEditing(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xs" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] max-h-[90svh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="space-y-2">
              <Dialog.Title className="font-heading text-lg font-bold">
                {editing?.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Configure a demonstração para seus alunos. Limpe os campos e
                salve para restaurar a demonstração padrão.
              </Dialog.Description>
            </div>
            <DemonstrationFields
              value={value}
              onChange={setValue}
              disabled={pending}
              name={editing?.name ?? "Exercício"}
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={pending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button disabled={pending} onClick={save}>
                {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Salvar demonstração
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ExerciseExecutionDialog
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        exerciseId={preview?.id}
        exerciseName={preview?.name ?? ""}
      />
    </div>
  );
}
