import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";

export function TacticalSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm" />
        <Dialog.Content className="dark fixed inset-x-0 bottom-0 z-[91] flex max-h-[85dvh] flex-col rounded-t-3xl border border-white/15 bg-zinc-950 p-4 text-zinc-100 shadow-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
          <header className="flex shrink-0 items-start gap-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-zinc-400">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5"
              aria-label="Fechar painel"
            >
              <X size={18} />
            </Dialog.Close>
          </header>
          <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-4">
            {children}
          </div>
          {footer ?? (
            <Dialog.Close
              className="min-h-11 shrink-0 rounded-xl bg-cyan-300 text-sm font-semibold text-zinc-950"
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              Concluir
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
