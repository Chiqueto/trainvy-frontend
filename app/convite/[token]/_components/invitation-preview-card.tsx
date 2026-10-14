"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Dumbbell,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "../_actions";

interface InvitationPreviewCardProps {
  token: string;
  isValid: boolean;
  message?: string | null;
  reason?: string | null;
  coach: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  currentUser: {
    id: string;
    name: string;
    email: string;
    accountType?: string;
  } | null;
}

export function InvitationPreviewCard({
  token,
  isValid,
  message,
  coach,
  currentUser,
}: InvitationPreviewCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAccept = () => {
    setErrorBanner(null);
    startTransition(async () => {
      const res = await acceptInvitationAction(token);
      if (!res.success) {
        setErrorBanner(res.error);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      }
    });
  };

  const handleDecline = () => {
    router.push("/");
  };

  // 1. Estado Inválido / Expirado / Cancelado
  if (!isValid || !coach) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-card p-6 sm:p-8 flex flex-col items-center text-center gap-4 shadow-xl max-w-md w-full">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Convite Indisponível
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message ?? "Este link de convite é inválido, expirou ou foi cancelado pelo treinador."}
          </p>
        </div>

        <div className="w-full pt-2">
          <Link href="/">
            <Button variant="outline" className="w-full h-11 rounded-xl font-heading font-semibold text-xs">
              Ir para a Página Inicial
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Estado de Sucesso após Aceite
  if (isSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-card p-6 sm:p-8 flex flex-col items-center text-center gap-4 shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Vínculo Estabelecido!
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Agora você está conectado com <strong>{coach.name}</strong>. Redirecionando para seu perfil...
          </p>
        </div>

        <div className="w-full pt-2">
          <Link href="/profile">
            <Button className="w-full h-11 rounded-xl font-heading font-bold text-xs">
              Acessar Meu Perfil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Estado de Exibição do Convite
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-w-md w-full">
      {/* Header do Card com Coach */}
      <div className="flex flex-col items-center text-center gap-3">
        <Avatar className="size-20 border-2 border-primary/20 shadow-md">
          <AvatarImage src={coach.image ?? undefined} alt={coach.name} />
          <AvatarFallback className="font-heading text-xl font-bold bg-muted text-foreground">
            {coach.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <span className="font-heading text-[10px] uppercase font-bold text-primary tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
            Convite de Assessoria
          </span>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {coach.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            convidou você para fazer parte do time de alunos no Trainvy
          </p>
        </div>
      </div>

      {/* Explicação de Privacidade e Propriedade de Dados */}
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2.5 text-xs">
        <div className="flex items-center gap-2 font-heading font-semibold text-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          Seus dados continuam sob seu controle
        </div>
        <ul className="text-muted-foreground space-y-1.5 pl-6 list-disc">
          <li>Você mantém a posse de todos os seus treinos e histórico.</li>
          <li>O vínculo permite que o treinador acompanhe sua rotina.</li>
          <li>Você pode encerrar o relacionamento a qualquer momento pelo seu perfil.</li>
        </ul>
      </div>

      {errorBanner && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive font-medium flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Ações */}
      {!currentUser ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-center text-muted-foreground">
            Entre na sua conta para confirmar o convite.
          </p>
          <Link href={`/auth?returnTo=/convite/${token}`}>
            <Button className="w-full h-12 rounded-xl font-heading font-bold text-sm shadow-sm flex items-center justify-center gap-2">
              <UserCheck className="size-4" />
              Entrar ou Cadastrar-se para Aceitar
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleDecline}
            className="w-full h-10 font-heading text-xs text-muted-foreground hover:text-foreground"
          >
            Recusar convite
          </Button>
        </div>
      ) : currentUser.accountType === "COACH" && currentUser.id !== coach.id ? (
        <div className="flex flex-col gap-3 text-center">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
            Sua conta atual é do tipo Treinador (COACH). Convites de alunos devem ser aceitos por contas de atleta.
          </div>
          <Link href="/profile">
            <Button variant="outline" className="w-full h-11 rounded-xl font-heading font-semibold text-xs">
              Ir para o Perfil
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="w-full h-12 rounded-xl font-heading font-bold text-sm shadow-sm flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Aceitando convite...
              </>
            ) : (
              <>
                <Dumbbell className="size-4" />
                Aceitar Convite de Treinador
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            disabled={isPending}
            onClick={handleDecline}
            className="w-full h-10 font-heading text-xs text-muted-foreground hover:text-foreground"
          >
            Recusar convite
          </Button>
        </div>
      )}
    </div>
  );
}
