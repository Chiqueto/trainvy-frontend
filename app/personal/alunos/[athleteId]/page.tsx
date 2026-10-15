import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Dumbbell,
  LineChart,
  Mail,
  Shield,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCoachAthleteDetails,
  getCommercialContext,
  listCoachAthletePrescriptions,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { RevokeAthleteModal } from "./_components/revoke-athlete-modal";
import {
  CoachPrescriptionsList,
  type PrescriptionListItem,
} from "./_components/coach-prescriptions-list";
import { RetryButton } from "./_components/retry-button";
import { CoachAthleteEvolutionDashboard } from "./_components/coach-athlete-evolution-dashboard";

interface AthleteDetailsPageProps {
  params: Promise<{
    athleteId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export default async function AthleteDetailsPage({
  params,
  searchParams,
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
  const { tab } = (await searchParams) ?? {};
  const currentTab =
    tab === "prescriptions"
      ? "prescriptions"
      : tab === "evolution"
        ? "evolution"
        : "overview";

  // Busca detalhes do aluno — com tratamento explícito de erros (Requirement 11)
  let athleteData = null;
  let fetchErrorStatus: number | null = null;

  try {
    const athleteRes = await getCoachAthleteDetails(athleteId, {
      cache: "no-store",
    });

    if (athleteRes.status === 200) {
      athleteData = athleteRes.data;
    } else {
      fetchErrorStatus = athleteRes.status;
    }
  } catch {
    fetchErrorStatus = 500;
  }

  // 1. 404 Real: aluno não encontrado ou vínculo inexistente
  if (fetchErrorStatus === 404) {
    notFound();
  }

  // 2. 403: Acesso não permitido
  if (fetchErrorStatus === 403) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <main className="mx-auto w-full max-w-lg px-5 py-16 flex flex-col items-center text-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
            <ShieldAlert className="size-7" />
          </div>
          <h1 className="font-heading text-lg font-bold text-foreground">
            Acesso Não Permitido
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Você não tem autorização para visualizar este aluno.
          </p>
          <Link href="/personal">
            <Button
              variant="outline"
              className="font-heading text-xs font-semibold gap-1.5 mt-2 rounded-xl"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar para Alunos</span>
            </Button>
          </Link>
        </main>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  // 3. 5xx ou Erro de Rede: renderiza estado de erro com RetryButton
  if (!athleteData || (fetchErrorStatus && fetchErrorStatus >= 500)) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <main className="mx-auto w-full max-w-lg px-5 py-16 flex flex-col items-center text-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="font-heading text-lg font-bold text-foreground">
            Falha ao carregar dados do aluno
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Não foi possível recuperar as informações devido a uma falha na
            conexão ou instabilidade temporária.
          </p>
          <div className="flex gap-2.5 mt-2">
            <RetryButton />
            <Link href="/personal">
              <Button
                variant="outline"
                className="font-heading text-xs font-semibold rounded-xl"
              >
                Voltar
              </Button>
            </Link>
          </div>
        </main>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  // Busca prescrições deste aluno
  let prescriptions: PrescriptionListItem[] = [];
  try {
    const prescRes = await listCoachAthletePrescriptions(athleteId, {
      cache: "no-store",
    });
    if (prescRes.status === 200 && Array.isArray(prescRes.data)) {
      prescriptions = prescRes.data as unknown as PrescriptionListItem[];
    }
  } catch (err) {
    console.error("Failed to load athlete prescriptions:", err);
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

        {/* Tab Switcher: Visão Geral vs Evolução vs Treinos Prescritos */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-muted/60 border border-border/60">
          <Link
            href={`/personal/alunos/${athleteId}?tab=overview`}
            className={`h-9 rounded-xl font-heading text-xs font-semibold flex items-center justify-center transition-all ${
              currentTab === "overview"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visão Geral
          </Link>
          <Link
            href={`/personal/alunos/${athleteId}?tab=evolution`}
            className={`h-9 rounded-xl font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              currentTab === "evolution"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LineChart className="size-3.5" />
            <span>Evolução</span>
          </Link>
          <Link
            href={`/personal/alunos/${athleteId}?tab=prescriptions`}
            className={`h-9 rounded-xl font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              currentTab === "prescriptions"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className="size-3.5" />
            <span>Prescrições</span>
            {prescriptions.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {prescriptions.length}
              </span>
            )}
          </Link>
        </div>

        {/* Conteúdo da Tab Selecionada */}
        {currentTab === "prescriptions" ? (
          <CoachPrescriptionsList
            athleteId={athleteId}
            athleteName={athleteData.name}
            prescriptions={prescriptions}
          />
        ) : currentTab === "evolution" ? (
          <CoachAthleteEvolutionDashboard
            athleteId={athleteId}
            athleteName={athleteData.name}
          />
        ) : (
          <>
            {/* Hero Card do Aluno */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-md flex flex-col items-center text-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

              <Avatar className="size-20 border-2 border-primary/20 shadow-md">
                <AvatarImage
                  src={athleteData.image ?? undefined}
                  alt={athleteData.name}
                />
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
                  <span
                    className="text-xs font-mono font-medium text-foreground truncate block mt-0.5"
                    title={athleteData.athleteId}
                  >
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
                <Link href={`/personal/alunos/${athleteId}?tab=evolution`}>
                  <Button
                    variant="default"
                    className="w-full h-11 rounded-xl font-heading font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LineChart className="size-4" />
                    <span>Acompanhar Evolução e Histórico</span>
                  </Button>
                </Link>

                <Link href={`/personal/alunos/${athleteId}?tab=prescriptions`}>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl font-heading font-semibold text-xs border-border/80 hover:bg-card hover:border-primary/40 flex items-center justify-center gap-2"
                  >
                    <Dumbbell className="size-4 text-primary" />
                    <span>Gerenciar Treinos Prescritos</span>
                  </Button>
                </Link>

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

            {/* Informações de Privacidade */}
            <section className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-heading font-semibold text-xs text-foreground">
                <Shield className="size-4 text-primary shrink-0" />
                <span>Privacidade e Posse de Dados</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você pode criar e prescrever treinos personalizados para este
                aluno. O aluno mantém a posse de seus registros e histórico.
                O acesso à evolução requer consentimento explícito e ativo
                concedido pelo atleta em seu perfil. Métricas corporais e dados
                privados permanecem estritamente sob controle do aluno.
              </p>
            </section>
          </>
        )}
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
