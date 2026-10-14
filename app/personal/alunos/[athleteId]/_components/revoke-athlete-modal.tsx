"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldAlert, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeStudentAction } from "@/app/personal/_actions";

interface RevokeAthleteModalProps {
  linkId: string;
  athleteName: string;
}

export function RevokeAthleteModal({
  linkId,
  athleteName,
}: RevokeAthleteModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleConfirmRevoke = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await revokeStudentAction(linkId);
      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setIsOpen(false);
        router.push("/personal");
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpen}
        className="w-full h-11 rounded-xl font-heading font-semibold text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 transition-all flex items-center justify-center gap-2"
      >
        <UserX className="size-4" />
        Encerrar Vínculo com Aluno
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <ShieldAlert className="size-5" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Encerrar Vínculo
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                Tem certeza de que deseja encerrar o acompanhamento de{" "}
                <strong className="text-foreground">{athleteName}</strong>?
              </p>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2 text-foreground/90">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span>
                  O acesso às informações deste aluno será invalidado imediatamente.
                  O aluno manterá a posse de todos os seus treinos e histórico.
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={handleConfirmRevoke}
                className="w-full h-11 rounded-xl font-heading font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Encerrando vínculo...
                  </>
                ) : (
                  <>
                    <UserX className="size-4" />
                    Sim, Encerrar Vínculo
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={handleClose}
                className="w-full h-10 font-heading text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
