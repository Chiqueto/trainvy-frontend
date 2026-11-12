"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManagedStudentAction } from "../_actions";

export function CreateStudentModal({ isFull }: { isFull: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setOpen(value);
          setError(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button disabled={isFull} className="h-10 gap-2 rounded-xl text-xs">
          <UserPlus className="size-4" />
          Cadastrar aluno
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold">
            Cadastrar aluno
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Comece a montar os treinos agora. O aluno pode criar sua conta
            depois e aceitar seu convite para receber as fichas.
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await createManagedStudentAction(name.trim());
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                setName("");
                router.push(`/personal/alunos/${result.data.athleteId}`);
                router.refresh();
              });
            }}
          >
            <label className="block space-y-2 text-sm">
              Nome do aluno
              <Input
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={pending}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Este cadastro ocupa uma vaga do seu plano. Nenhuma conta de acesso
              será criada para o aluno.
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={pending || name.trim().length < 2}
              >
                {pending ? "Cadastrando…" : "Cadastrar e montar treino"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
