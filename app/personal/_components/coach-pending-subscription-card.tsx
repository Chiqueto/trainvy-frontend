import Link from "next/link";
import { AlertCircle, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachPendingSubscriptionCardProps {
  planName?: string | null;
  status?: string | null;
}

export function CoachPendingSubscriptionCard({
  planName,
  status,
}: CoachPendingSubscriptionCardProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col gap-4 text-left shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Assessoria de Alunos Aguardando Liberação
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plano: {planName ?? "Personal"} • Status: {status ?? "Pendente"}
          </p>
        </div>
      </div>

      <p className="text-xs text-foreground/80 leading-relaxed">
        Sua conta de treinador está registrada, porém o recurso de gerenciamento
        de alunos (<strong>MANAGE_ATHLETES</strong>) ainda não está ativo na sua assinatura.
        Nesta fase de homologação, as ativações são realizadas pelo suporte ou administração.
      </p>

      <div className="rounded-xl border border-border/60 bg-background/50 p-3.5 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Dumbbell className="size-3.5 text-primary" />
          Seus treinos pessoais continuam ativos
        </div>
        <p>
          Você pode continuar criando seus próprios planos e registrando suas sessões
          de treino normalmente enquanto aguarda a liberação.
        </p>
      </div>

      <div className="pt-1">
        <Link href="/">
          <Button variant="outline" className="w-full h-11 rounded-xl font-heading font-semibold text-xs">
            Voltar aos Meus Treinos
          </Button>
        </Link>
      </div>
    </div>
  );
}
