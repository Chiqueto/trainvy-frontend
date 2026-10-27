import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCommercialContext,
  listCoachAthletes,
  listCoachWorkoutPlanTemplates,
  listWorkoutPlans,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { PersonalHeader } from "../_components/personal-header";
import { TemplatesList, type TemplateItem } from "./_components/templates-list";

export const metadata = {
  title: "Modelos de Treino | Trainvy Pro",
  description: "Gerencie modelos pré-definidos de treino e aloque-os para seus alunos com 1 clique.",
};

export default async function PersonalTemplatesPage() {
  await requireAccountSetup();

  const commercialRes = await getCommercialContext({ cache: "no-store" });
  if (commercialRes.status !== 200 || !commercialRes.data) {
    redirect("/profile");
  }

  const { accountType, entitlements } = commercialRes.data;

  if (accountType !== "COACH") {
    redirect("/profile");
  }

  const hasManageAthletes = entitlements.some(
    (e) => e.key === "MANAGE_ATHLETES",
  );

  if (!hasManageAthletes) {
    redirect("/personal");
  }

  const [templatesRes, athletesRes, plansRes] = await Promise.all([
    listCoachWorkoutPlanTemplates({ cache: "no-store" }),
    listCoachAthletes({ cache: "no-store" }),
    listWorkoutPlans(undefined, { cache: "no-store" }),
  ]);

  const templates: TemplateItem[] =
    templatesRes.status === 200 ? (templatesRes.data as any) : [];

  const athletes =
    athletesRes.status === 200
      ? athletesRes.data.athletes.map((a) => ({
          id: a.athleteId,
          name: a.name,
          email: a.email,
          status: "ACTIVE",
        }))
      : [];

  const coachPlans =
    plansRes.status === 200 && plansRes.data.workoutPlans
      ? plansRes.data.workoutPlans.map((p) => ({
          id: p.id,
          name: p.name,
          workoutDaysCount: p.workoutDays?.length ?? 0,
        }))
      : [];

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-28 lg:pb-8">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <PersonalHeader
          title="Modelos de Treino"
          description="Crie e organize rotinas padronizadas para alocar e prescrever aos seus alunos com 1 clique."
          activeTab="templates"
        />

        <TemplatesList
          initialTemplates={templates}
          athletes={athletes}
          coachPlans={coachPlans}
        />
      </main>
      <BottomNav isCoach={true} activePage="templates" />
    </div>
  );
}
