"use client";

import { useState, useTransition } from "react";
import {
  Activity,
  CheckCircle2,
  Dumbbell,
  History,
  Info,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { revokeCoachAction } from "@/app/convite/[token]/_actions";
import { updateCoachProgressSharingAction } from "../_actions";

export interface SharingConsentData {
  enabled: boolean;
  includePreviousHistory: boolean;
  sharedAt: string | null;
  revokedAt: string | null;
}

interface MyCoachSectionProps {
  relationship: {
    linkId: string;
    coachId: string;
    coachName: string;
    coachEmail: string;
    coachImage?: string | null;
    acceptedAt: string;
  } | null;
  initialSharingConsent?: SharingConsentData | null;
}

export function MyCoachSection({
  relationship,
  initialSharingConsent,
}: MyCoachSectionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSharingPending, startSharingTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharingSuccessMsg, setSharingSuccessMsg] = useState<string | null>(null);

  const [sharingConsent, setSharingConsent] = useState<SharingConsentData>({
    enabled: initialSharingConsent?.enabled ?? false,
    includePreviousHistory: initialSharingConsent?.includePreviousHistory ?? false,
    sharedAt: initialSharingConsent?.sharedAt ?? null,
    revokedAt: initialSharingConsent?.revokedAt ?? null,
  });

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

  const handleToggleSharing = (nextEnabled: boolean) => {
    setErrorMessage(null);
    setSharingSuccessMsg(null);
    const prevConsent = { ...sharingConsent };
    const nextConsent: SharingConsentData = {
      ...sharingConsent,
      enabled: nextEnabled,
      includePreviousHistory: nextEnabled ? sharingConsent.includePreviousHistory : false,
    };
    setSharingConsent(nextConsent);

    startSharingTransition(async () => {
      const res = await updateCoachProgressSharingAction({
        enabled: nextEnabled,
        includePreviousHistory: nextConsent.includePreviousHistory,
      });

      if (!res.success) {
        setSharingConsent(prevConsent);
        setErrorMessage(res.error);
      } else {
        setSharingConsent(res.data);
        setSharingSuccessMsg(
          nextEnabled
            ? "Compartilhamento de evolução ativado com sucesso!"
            : "Compartilhamento de evolução desativado. Seu treinador não tem mais acesso ao histórico.",
        );
      }
    });
  };

  const handleTogglePreviousHistory = (nextIncludePrevious: boolean) => {
    setErrorMessage(null);
    setSharingSuccessMsg(null);
    const prevConsent = { ...sharingConsent };
    const nextConsent: SharingConsentData = {
      ...sharingConsent,
      includePreviousHistory: nextIncludePrevious,
    };
    setSharingConsent(nextConsent);

    startSharingTransition(async () => {
      const res = await updateCoachProgressSharingAction({
        enabled: sharingConsent.enabled,
        includePreviousHistory: nextIncludePrevious,
      });

      if (!res.success) {
        setSharingConsent(prevConsent);
        setErrorMessage(res.error);
      } else {
        setSharingConsent(res.data);
        setSharingSuccessMsg(
          nextIncludePrevious
            ? "Histórico anterior incluído para seu treinador!"
            : "Histórico anterior ocultado. Apenas treinos pós-autorização serão compartilhados.",
        );
      }
    });
  };

  const formattedDate = new Date(relationship.acceptedAt).toLocaleDateString("pt-BR");
  const formattedSharedDate = sharingConsent.sharedAt
    ? new Date(sharingConsent.sharedAt).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Card Principal: Meu Treinador */}
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

        {sharingSuccessMsg && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>{sharingSuccessMsg}</span>
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

      {/* Seção Integrada: Compartilhamento de Evolução */}
      <section
        aria-labelledby="sharing-consent-title"
        className="w-full rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3.5 shadow-xs text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-4" />
            </div>
            <div>
              <h3
                id="sharing-consent-title"
                className="font-heading text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Compartilhamento de evolução
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Acesso de acompanhamento para {relationship.coachName}
              </p>
            </div>
          </div>

          <Badge
            variant={sharingConsent.enabled ? "default" : "secondary"}
            className="text-[10px] font-heading font-semibold"
          >
            {sharingConsent.enabled ? "Ativo" : "Desativado"}
          </Badge>
        </div>

        {/* Switch Principal de Ativação */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex flex-col gap-0.5 min-w-0 pr-2">
            <label
              htmlFor="sharing-switch"
              className="font-heading text-xs font-semibold text-foreground cursor-pointer"
            >
              Autorizar acompanhamento de treinos
            </label>
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Permite que seu Personal acompanhe treinos concluídos, séries,
              repetições, cargas registradas, RIR e volume.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSharingPending && (
              <Loader2 className="size-4 animate-spin text-primary" />
            )}
            <Switch
              id="sharing-switch"
              checked={sharingConsent.enabled}
              disabled={isSharingPending}
              onCheckedChange={handleToggleSharing}
              aria-label="Ativar ou desativar compartilhamento de evolução com treinador"
            />
          </div>
        </div>

        {/* Opção Adicional: Histórico Anterior ao Consentimento */}
        {sharingConsent.enabled && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                <span className="font-heading text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <History className="size-3.5 text-primary" />
                  Incluir histórico anterior
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Permite consultar treinos concluídos antes da autorização. Se
                  desativado, apenas sessões a partir da data de autorização serão
                  compartilhadas.
                </span>
              </div>

              <Switch
                id="previous-history-switch"
                checked={sharingConsent.includePreviousHistory}
                disabled={isSharingPending}
                onCheckedChange={handleTogglePreviousHistory}
                aria-label="Incluir histórico anterior ao consentimento"
              />
            </div>

            {formattedSharedDate && !sharingConsent.includePreviousHistory && (
              <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-1 pt-2 border-t border-primary/10">
                <Info className="size-3 text-primary shrink-0" />
                <span>
                  Compartilhando apenas treinos realizados a partir de{" "}
                  <strong>{formattedSharedDate}</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Garantias de Privacidade */}
        <div className="rounded-xl bg-muted/40 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground">
          <Lock className="size-3.5 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground font-semibold">Privacidade garantida:</strong>{" "}
            Peso corporal, percentual de gordura, fotos e conversas com a IA
            permanecem estritamente privadas e nunca são compartilhadas. Você
            pode revogar esta autorização a qualquer momento.
          </p>
        </div>
      </section>
    </div>
  );
}
