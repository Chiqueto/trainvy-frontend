"use client";

import { useState, useTransition } from "react";
import { Loader2, User, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { revokeStudentAction } from "../_actions";

export interface AthleteItem {
  linkId: string;
  athleteId: string;
  name: string;
  email: string;
  image?: string | null;
  acceptedAt: string;
}

interface AthletesListProps {
  athletes: AthleteItem[];
}

export function AthletesList({ athletes }: AthletesListProps) {
  const [confirmingLinkId, setConfirmingLinkId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRevoke = (linkId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await revokeStudentAction(linkId);
      if (!res.success) {
        setErrorMessage(res.error);
        setConfirmingLinkId(null);
      } else {
        setConfirmingLinkId(null);
      }
    });
  };

  if (athletes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <User className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Nenhum aluno ativo
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Seus alunos vinculados aparecerão aqui assim que aceitarem o link de convite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Alunos Ativos ({athletes.length})
        </h2>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {athletes.map((ath) => {
          const isConfirming = confirmingLinkId === ath.linkId;
          const formattedDate = new Date(ath.acceptedAt).toLocaleDateString("pt-BR");

          return (
            <div
              key={ath.linkId}
              className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={ath.image ?? undefined} alt={ath.name} />
                  <AvatarFallback className="font-heading text-xs font-bold bg-muted text-foreground">
                    {ath.name?.charAt(0)?.toUpperCase() ?? "A"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <span className="font-heading text-sm font-semibold text-foreground truncate">
                    {ath.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {ath.email}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Vinculado desde {formattedDate}
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
                      onClick={() => handleRevoke(ath.linkId)}
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
                      onClick={() => setConfirmingLinkId(null)}
                      className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
                    >
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingLinkId(ath.linkId)}
                    className="h-8 px-2.5 font-heading text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1"
                    title="Encerrar vínculo"
                  >
                    <UserX className="size-3.5" />
                    <span className="text-[11px]">Encerrar</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
