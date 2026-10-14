"use client";

import { useState, useTransition } from "react";
import { Dumbbell, Loader2, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { revokeCoachAction } from "@/app/convite/[token]/_actions";

interface MyCoachSectionProps {
  relationship: {
    linkId: string;
    coachId: string;
    coachName: string;
    coachEmail: string;
    coachImage?: string | null;
    acceptedAt: string;
  } | null;
}

export function MyCoachSection({ relationship }: MyCoachSectionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!relationship) {
    return (
      <div className="w-full rounded-2xl border border-border/70 bg-card p-4 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground shrink-0">
            <Dumbbell className="size-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading text-xs font-semibold text-foreground">
              Meu Treinador
            </span>
            <span className="text-[11px] text-muted-foreground">
              Nenhum treinador vinculado. Você treina de forma autônoma.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleRevoke = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await revokeCoachAction(relationship.linkId);
      if (!res.success) {
        setErrorMessage(res.error);
        setIsConfirming(false);
      } else {
        setIsConfirming(false);
      }
    });
  };

  const formattedDate = new Date(relationship.acceptedAt).toLocaleDateString("pt-BR");

  return (
    <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3 shadow-xs text-left">
      <div className="flex items-center justify-between">
        <span className="font-heading text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <UserCheck className="size-3.5" />
          Meu Treinador
        </span>
        <span className="text-[10px] text-muted-foreground">
          Desde {formattedDate}
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-11 shrink-0 border border-primary/30">
            <AvatarImage
              src={relationship.coachImage ?? undefined}
              alt={relationship.coachName}
            />
            <AvatarFallback className="font-heading text-xs font-bold bg-muted text-foreground">
              {relationship.coachName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0">
            <span className="font-heading text-sm font-bold text-foreground truncate">
              {relationship.coachName}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {relationship.coachEmail}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          {isConfirming ? (
            <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg animate-in fade-in duration-150">
              <span className="font-heading text-[11px] font-semibold text-destructive">
                Encerrar?
              </span>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={handleRevoke}
                className="h-6 px-2 font-heading text-[11px] font-bold rounded-md"
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Sim"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => setIsConfirming(false)}
                className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
              >
                Não
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsConfirming(true)}
              className="h-8 px-2.5 font-heading text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1"
              title="Encerrar vínculo com treinador"
            >
              <UserX className="size-3.5" />
              <span className="text-[11px]">Encerrar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
