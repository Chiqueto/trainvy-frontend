"use client";

import { Dialog } from "radix-ui";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";

export function LegalDocumentReader({
  document,
}: {
  document: { title: string; version: string; contentMd: string };
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="w-full cursor-pointer break-words text-left text-sm font-medium underline underline-offset-4">
        {document.title}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border bg-background p-5 shadow-xl">
          <Dialog.Title className="pr-2 text-lg font-semibold">
            {document.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Documento completo · Versão {document.version}
          </Dialog.Description>
          <div
            className="min-h-0 overflow-y-auto overscroll-contain break-words text-sm leading-relaxed"
            tabIndex={0}
          >
            <Streamdown mode="static">{document.contentMd}</Streamdown>
          </div>
          <Dialog.Close asChild>
            <Button variant="outline" className="shrink-0 self-end">
              Fechar leitura
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
