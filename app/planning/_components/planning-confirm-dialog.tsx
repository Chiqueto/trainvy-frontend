"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PlanningConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PlanningConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  isPending,
  onCancel,
  onConfirm,
}: PlanningConfirmDialogProps) {
  if (!open) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !isPending) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6"
          onEscapeKeyDown={(event) => {
            if (isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isPending) event.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <Dialog.Title className="font-heading text-base font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </div>
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              disabled={isPending}
              onClick={onCancel}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 min-w-0 rounded-full px-4 py-3 whitespace-normal sm:flex-1"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              className="h-auto min-h-11 min-w-0 rounded-full px-4 py-3 whitespace-normal sm:flex-1"
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending && <LoaderCircle className="size-4 animate-spin" />}
              {isPending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
