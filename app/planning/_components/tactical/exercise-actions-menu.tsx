"use client";
import { DropdownMenu } from "radix-ui";
import { Ellipsis, ListPlus, Settings2, Sparkles, Trash2 } from "lucide-react";
import type { ExercisePanelTab } from "./exercise-configuration";
export function ExerciseActionsMenu({
  open,
  onOpenChange,
  onConfigure,
  onRemove,
  onAdd,
  ignoreOutside,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigure: (tab: ExercisePanelTab) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  ignoreOutside?: () => boolean;
}) {
  const cls =
    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs outline-none focus:bg-cyan-300/10";
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Opções do exercício"
          title="Opções · botão direito ou mantenha pressionado"
          className="no-card-drag flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10"
        >
          <Ellipsis size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          onInteractOutside={(event) => {
            if (ignoreOutside?.()) event.preventDefault();
          }}
          aria-label="Ações do exercício"
          sideOffset={6}
          align="end"
          className="z-[120] min-w-60 rounded-xl border border-white/15 bg-slate-950 p-1.5 text-white shadow-2xl"
        >
          {onAdd && (
            <DropdownMenu.Item className={cls} onSelect={onAdd}>
              <ListPlus size={14} />
              Adicionar ao treino
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className={cls}
            onSelect={() => onConfigure("prescription")}
          >
            <Settings2 size={14} />
            Prescrição avançada
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cls}
            onSelect={() => onConfigure("techniques")}
          >
            <Sparkles size={14} />
            Configurar técnicas
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={cls}
            onSelect={() => onConfigure("alternatives")}
          >
            <ListPlus size={14} />
            Exercícios substitutos
          </DropdownMenu.Item>
          {onRemove && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
              <DropdownMenu.Item
                className={`${cls} text-rose-300`}
                onSelect={onRemove}
              >
                <Trash2 size={14} />
                Remover do treino
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
