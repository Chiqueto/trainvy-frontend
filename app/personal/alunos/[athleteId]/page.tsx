import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  Shield,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCoachAthleteDetails,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { RevokeAthleteModal } from "./_components/revoke-athlete-modal";

interface AthleteDetailsPageProps {
  params: Promise<{
    athleteId: string;
  }>;
}

export default async function AthleteDetailsPage({
  params,
}: AthleteDetailsPageProps) {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    redirect("/profile");
  }

  const { accountType, entitlements } = commercialRes.data;

  // Segurança: apenas conta COACH com entitlement MANAGE_ATHLETES pode acessar
  if (accountType !== "COACH") {
    redirect("/profile");
  }

  const hasManageAthletes = entitlements.some(
    (e) => e.key === "MANAGE_ATHLETES",
  );
  if (!hasManageAthletes) {
    redirect("/personal");
  }

  const { athleteId } = await params;

  // Busca detalhes do aluno — a API protege estritamente contra IDOR (apenas vínculos ativos do próprio coach)
  let athleteData = null;
  try {
    const athleteRes = await getCoachAthleteDetails(athleteId, {
      cache: "no-store",
    });
    if (athleteRes.status === 200) {
      athleteData = athleteRes.data;
    }
  } catch {
    // 404 or connection error
  }

  if (!athleteData) {
    notFound();
  }

  const formattedDate = new Date(athleteData.acceptedAt).toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        {/* Header com Navegação de Retorno */}
        <div className="flex items-center justify-between">
          <Link
            href="/personal"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Alunos</span>
          </Link>
          <span className="font-heading text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            Painel do Treinador
          </span>
        </div>

        {/* Hero Card do Aluno */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-md flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          <Avatar className="size-20 border-2 border-primary/20 shadow-md">
            <AvatarImage src={athleteData.image ?? undefined} alt={athleteData.name} />
            <AvatarFallback className="font-heading text-xl font-bold bg-muted text-foreground">
              {athleteData.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1 max-w-full">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold">
              <CheckCircle2 className="size-3" />
              <span>Vínculo Ativo</span>
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground truncate">
              {athleteData.name}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 truncate">
              <Mail className="size-3 shrink-0" />
              <span>{athleteData.email}</span>
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-left">
            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Início do Vínculo
              </span>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="size-3 text-primary shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </span>
            </div>

            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                ID do Aluno
              </span>
              <span className="text-xs font-mono font-medium text-foreground truncate block mt-0.5" title={athleteData.athleteId}>
                {athleteData.athleteId.substring(0, 10)}...
              </span>
            </div>
          </div>
        </section>

        {/* Ações e Atalhos de Gestão */}
        <section className="flex flex-col gap-2.5">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ações de Assessoria
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            <Link href="/personal">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-heading font-semibold text-xs border-border/80 hover:bg-card hover:border-primary/40 flex items-center justify-center gap-2"
              >
                <UserPlus className="size-4 text-primary" />
                Convidar Mais Alunos
              </Button>
            </Link>

            <RevokeAthleteModal
              linkId={athleteData.linkId}
              athleteName={athleteData.name}
            />
          </div>
        </section>

        {/* Informações de Privacidade e Roadmap da Task 6.2B */}
        <section className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center gap-2 font-heading font-semibold text-xs text-foreground">
            <Shield className="size-4 text-primary shrink-0" />
            <span>Privacidade e Posse de Dados</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nesta etapa (Task 6.2A), você tem acesso aos dados cadastrais e de identificação do aluno.
            Histórico completo de treinos, métricas corporais, cargas e prescrição personalizada serão
            disponibilizados na próxima etapa (Task 6.2B) com regras de consentimento dedicadas.
          </p>
        </section>
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
