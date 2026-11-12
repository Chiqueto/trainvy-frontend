import { ProfessionalRegistrationForm } from "./_components/professional-registration-form";
import { CoachGuidedTour } from "./_components/coach-guided-tour";
import { CreateStudentModal } from "./_components/create-student-modal";
import { LegalConsent } from "@/app/_components/legal-consent";
import { getProfessionalRegistration } from "@/app/_lib/api/fetch-generated";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, ArrowUpRight } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";

import {
  getCommercialContext,
  listCoachAthletes,
  listCoachInvitations,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { AthletesList } from "./_components/athletes-list";
import { CoachFirstStepsCard } from "./_components/coach-first-steps-card";
import { CoachPendingSubscriptionCard } from "./_components/coach-pending-subscription-card";
import { InvitationsList } from "./_components/invitations-list";
import { InviteStudentModal } from "./_components/invite-student-modal";
import { PersonalHeader } from "./_components/personal-header";
import { PersonalQuotaCard } from "./_components/personal-quota-card";
import { WorkspaceError } from "./_components/workspace-error";
import { ProfessionalWorkspaceEvent } from "@/app/_components/product-event";

export default async function PersonalPage() {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    if (commercialRes.status === 401) redirect("/auth");
    throw new Error("Não foi possível consultar o acesso profissional.");
  }

  const { accountType, plan, subscription, entitlements } = commercialRes.data;

  // Apenas contas do tipo COACH têm acesso a esta área
  if (accountType !== "COACH") {
    redirect("/profile");
  }

  const registrationRes = await getProfessionalRegistration({
    cache: "no-store",
  });
  const registration =
    registrationRes.status === 200 ? registrationRes.data : null;
  if (registrationRes.status !== 200)
    throw new Error("Não foi possível consultar o cadastro profissional.");
  if (!commercialRes.data.professionalAccessGranted)
    return (
      <div className="personal-workspace min-h-svh bg-background pb-24">
        <main className="mx-auto max-w-lg p-5 space-y-5">
          <PersonalHeader />
          <LegalConsent />
          <ProfessionalRegistrationForm registration={registration} />
        </main>
        <BottomNav isCoach={true} activePage="athletes" />
      </div>
    );
  const hasManageAthletes = entitlements.some(
    (e) => e.key === "MANAGE_ATHLETES",
  );

  if (!hasManageAthletes) {
    return (
      <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8">
        <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
          <PersonalHeader />
          <CoachPendingSubscriptionCard
            planName={plan?.name}
            status={subscription?.status}
          />
        </main>
        <BottomNav isCoach={true} activePage="athletes" />
      </div>
    );
  }

  const [athletesRes, invitationsRes] = await Promise.all([
    listCoachAthletes({ cache: "no-store" }).catch(() => null),
    listCoachInvitations({ cache: "no-store" }).catch(() => null),
  ]);

  if (athletesRes?.status !== 200 || invitationsRes?.status !== 200)
    return (
      <div className="personal-workspace min-h-svh bg-background pb-24">
        <main className="mx-auto w-full max-w-6xl space-y-5 px-5 py-4">
          <PersonalHeader />
          <WorkspaceError message="Não foi possível carregar alunos e convites." />
        </main>
        <BottomNav isCoach activePage="athletes" />
      </div>
    );

  const athletes = athletesRes.status === 200 ? athletesRes.data.athletes : [];
  const activeCount =
    athletesRes.status === 200 ? athletesRes.data.activeCount : 0;
  const limit = athletesRes.status === 200 ? athletesRes.data.limit : null;
  const summary =
    athletesRes.status === 200 ? athletesRes.data.summary : undefined;
  const invitations = invitationsRes.status === 200 ? invitationsRes.data : [];

  const isFull = limit !== null && activeCount >= limit;

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-24 lg:pb-8">
      <main className="mx-auto w-full max-w-6xl px-5 py-4 flex flex-col gap-5">
        <PersonalHeader
          actions={
            <>
              <CoachGuidedTour tour="workspace" />
              <div data-tour="student-actions" className="flex flex-wrap gap-2">
                <CreateStudentModal isFull={isFull} />
                <InviteStudentModal isFull={isFull} compact />
              </div>
            </>
          }
        />

        {activeCount === 0 && invitations.length === 0 && (
          <CoachFirstStepsCard isFull={isFull} />
        )}

        <ProfessionalWorkspaceEvent />
        <div data-tour="athletes">
          <AthletesList
            athletes={athletes}
            summary={summary}
            activeCount={activeCount}
            limit={limit}
          />
        </div>

        <section
          aria-label="Recursos da assessoria"
          className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start"
        >
          <div className="space-y-4">
            <PersonalQuotaCard activeCount={activeCount} limit={limit} />
            <Link
              href="/personal/arquivo"
              className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Archive className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Prescrições arquivadas
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  Consulte fichas de vínculos encerrados.
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          </div>
          <div
            data-tour="invitations"
            className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs space-y-4"
          >
            <div>
              <h2 className="font-heading text-base font-semibold">
                Convites da assessoria
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe os convites enviados aos seus alunos.
              </p>
            </div>
            <InvitationsList invitations={invitations} />
          </div>
        </section>
      </main>

      <BottomNav isCoach={true} activePage="athletes" />
    </div>
  );
}
