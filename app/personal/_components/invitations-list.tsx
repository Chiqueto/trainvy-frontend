"use client";

import { toast } from "sonner";

import { useState, useTransition } from "react";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelInvitationAction } from "../_actions";

export interface InvitationItem {
  id: string;
  status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
}

interface InvitationsListProps {
  invitations: InvitationItem[];
}

export function InvitationsList({ invitations }: InvitationsListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING",
  );

  if (pendingInvitations.length === 0) {
    return null;
  }

  const handleCancel = (id: string) => {
    startTransition(async () => {
      const res = await cancelInvitationAction(id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Convite cancelado.");
      setConfirmingId(null);
    });
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Convites Pendentes ({pendingInvitations.length})
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {pendingInvitations.map((inv) => {
          const isConfirming = confirmingId === inv.id;
          const expiresDate = new Date(inv.expiresAt).toLocaleDateString(
            "pt-BR",
          );

          return (
            <div
              key={inv.id}
              className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-heading text-[10px] uppercase font-semibold text-amber-500 border-amber-500/20 bg-amber-500/10"
                  >
                    Aguardando Aceite
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Expira em: {expiresDate}
                </span>
              </div>

              <div className="shrink-0 flex items-center">
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg">
                    <span className="font-heading text-[11px] font-semibold text-destructive">
                      Cancelar?
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => handleCancel(inv.id)}
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
                      onClick={() => setConfirmingId(null)}
                      className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
                    >
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingId(inv.id)}
                    className="h-7 px-2 font-heading text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1"
                    title="Cancelar convite"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="text-[11px]">Cancelar</span>
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
