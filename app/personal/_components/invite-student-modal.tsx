"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  Link as LinkIcon,
  Loader2,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInvitationAction } from "../_actions";

interface InviteStudentModalProps {
  isFull: boolean;
}

export function InviteStudentModal({ isFull }: InviteStudentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setGeneratedToken(null);
    setExpiresAt(null);
    setCopied(false);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleGenerate = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createInvitationAction(7);
      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setGeneratedToken(res.data.token);
        setExpiresAt(res.data.expiresAt);
      }
    });
  };

  const inviteUrl =
    typeof window !== "undefined" && generatedToken
      ? `${window.location.origin}/convite/${generatedToken}`
      : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const whatsappShareUrl = generatedToken
    ? `https://wa.me/?text=${encodeURIComponent(
        `Olá! Estou te convidando para treinar comigo no Trainvy. Acesse o link abaixo para aceitar o convite e iniciar sua assessoria: ${inviteUrl}`,
      )}`
    : "";

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={isFull}
        className="w-full h-12 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
      >
        <UserPlus className="size-4" />
        Convidar novo aluno
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <LinkIcon className="size-4" />
                </div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Convidar Aluno
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {errorMessage}
              </div>
            )}

            {!generatedToken ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gere um link seguro e exclusivo para enviar ao seu atleta.
                  Ao clicar, ele poderá aceitar a assessoria mantendo total
                  controle e propriedade sobre a sua própria conta.
                </p>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-foreground/80 space-y-1">
                  <div className="font-semibold text-foreground">Informações do convite:</div>
                  <div>• Validade de 7 dias a partir da criação</div>
                  <div>• Uso único e intransferível</div>
                  <div>• O atleta deve aceitar explicitamente</div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="w-full h-11 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Gerando link seguro...
                    </>
                  ) : (
                    "Gerar link de convite"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                  <span className="font-heading text-xs font-semibold uppercase text-primary block">
                    Link de convite gerado com sucesso
                  </span>
                  <div className="flex items-center gap-2 bg-background border border-border/80 rounded-lg p-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="w-full bg-transparent text-xs text-foreground font-mono truncate focus:outline-hidden"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-8 px-2.5 shrink-0 font-heading text-xs font-semibold text-primary"
                    >
                      {copied ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-bold">
                          <Check className="size-3.5 stroke-[3]" />
                          Copiado!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="size-3.5" />
                          Copiar
                        </span>
                      )}
                    </Button>
                  </div>
                  {expiresAt && (
                    <span className="text-[11px] text-muted-foreground block">
                      Válido até: {new Date(expiresAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Share2 className="size-4" />
                    Compartilhar via WhatsApp
                  </a>

                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full h-11 rounded-xl font-heading font-semibold text-xs"
                  >
                    Concluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
