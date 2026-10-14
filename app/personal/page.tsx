import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCommercialContext,
  listCoachAthletes,
  listCoachInvitations,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { AthletesList } from "./_components/athletes-list";
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
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
          <PersonalHeader />
          <CoachPendingSubscriptionCard
            planName={plan?.name}
            status={subscription?.status}
          />
        </main>
        <BottomNav activePage="profile" />
      </div>
    );
  }

  const [athletesRes, invitationsRes] = await Promise.all([
    listCoachAthletes({ cache: "no-store" }),
    listCoachInvitations({ cache: "no-store" }),
  ]);

  const athletes = athletesRes.status === 200 ? athletesRes.data.athletes : [];
  const activeCount = athletesRes.status === 200 ? athletesRes.data.activeCount : 0;
  const limit = athletesRes.status === 200 ? athletesRes.data.limit : null;
  const invitations = invitationsRes.status === 200 ? invitationsRes.data : [];

  const isFull = limit !== null && activeCount >= limit;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <main className="mx-auto w-full max-w-lg px-5 py-4 flex flex-col gap-5">
        <PersonalHeader />

        <PersonalQuotaCard activeCount={activeCount} limit={limit} />

        <InviteStudentModal isFull={isFull} />

        <InvitationsList invitations={invitations} />

        <AthletesList athletes={athletes} />
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
