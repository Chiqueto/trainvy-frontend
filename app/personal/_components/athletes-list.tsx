"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Search, User, UserX, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingLinkId, setConfirmingLinkId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter(
      (ath) =>
        ath.name.toLowerCase().includes(q) ||
        ath.email.toLowerCase().includes(q),
    );
  }, [athletes, searchQuery]);

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

      {/* Busca em tempo real por nome do aluno */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar aluno por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 text-xs placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Limpar campo de busca"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
          {errorMessage}
        </div>
      )}

      {filteredAthletes.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-6 text-center flex flex-col items-center gap-2">
          <p className="font-heading text-xs text-muted-foreground">
            Nenhum aluno encontrado para &quot;<strong>{searchQuery}</strong>&quot;
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-7 text-xs font-heading text-primary"
          >
            Limpar busca
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredAthletes.map((ath) => {
            const isConfirming = confirmingLinkId === ath.linkId;
            const formattedDate = new Date(ath.acceptedAt).toLocaleDateString("pt-BR");

            return (
              <div
                key={ath.linkId}
                className="group relative rounded-xl border border-border/70 bg-card p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                {/* Link clicável cobrindo as informações do aluno para navegar para /personal/alunos/[athleteId] */}
                <Link
                  href={`/personal/alunos/${ath.athleteId}`}
                  className="flex items-center gap-3 min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                >
                  <Avatar className="size-11 shrink-0 border border-border/50">
                    <AvatarImage src={ath.image ?? undefined} alt={ath.name} />
                    <AvatarFallback className="font-heading text-xs font-bold bg-muted text-foreground">
                      {ath.name?.charAt(0)?.toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {ath.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {ath.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Vinculado em {formattedDate}
                    </span>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mr-1" />
                </Link>

                {/* Ações isoladas (Encerramento de vínculo) fora do link principal */}
                <div className="shrink-0 flex items-center border-l border-border/40 pl-2">
                  {isConfirming ? (
                    <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg animate-in fade-in duration-150">
                      <span className="font-heading text-[11px] font-semibold text-destructive">
                        Encerrar?
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevoke(ath.linkId);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingLinkId(null);
                        }}
                        className="h-6 px-1.5 font-heading text-[11px] text-muted-foreground hover:text-foreground rounded-md"
                      >
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingLinkId(ath.linkId);
                      }}
                      className="h-8 px-2 font-heading text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1"
                      title="Encerrar vínculo"
                    >
                      <UserX className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
