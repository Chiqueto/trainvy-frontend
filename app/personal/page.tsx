import { redirect } from "next/navigation";
import Link from "next/link";
import { Layers, Dumbbell, ArrowRight } from "lucide-react";
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

export default async function PersonalPage() {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    redirect("/profile");
  }

  const { accountType, plan, subscription, entitlements } = commercialRes.data;

  // Apenas contas do tipo COACH têm acesso a esta área
  if (accountType !== "COACH") {
    redirect("/profile");
  }

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
    listCoachAthletes({ cache: "no-store" }),
    listCoachInvitations({ cache: "no-store" }),
  ]);

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
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        <PersonalHeader />

        {activeCount === 0 && invitations.length === 0 && (
          <CoachFirstStepsCard isFull={isFull} />
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
          <PersonalQuotaCard activeCount={activeCount} limit={limit} />
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs space-y-4">
            <div>
              <h2 className="font-heading text-base font-semibold">
                Expanda sua assessoria
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Convide alunos e centralize o acompanhamento.
              </p>
            </div>
            <InviteStudentModal isFull={isFull} />
            <InvitationsList invitations={invitations} />
          </div>
        </div>

        <AthletesList
          athletes={athletes}
          summary={summary}
          activeCount={activeCount}
          limit={limit}
        />
      </main>

      <BottomNav isCoach={true} activePage="athletes" />
    </div>
  );
}
