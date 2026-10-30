import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  description: "Organize modelos reutilizáveis e prepare prescrições individuais para seus alunos.",
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
          description="Sua biblioteca de rotinas reutilizáveis. Use um modelo como ponto de partida e adapte a prescrição para cada aluno."
          activeTab="templates"
        />

        <section aria-labelledby="prescription-guide" className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
          <h2 id="prescription-guide" className="font-heading text-base font-semibold">
            Como um modelo vira uma prescrição?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A prescrição é o treino preparado para um aluno específico: dias,
            exercícios, séries, repetições, descansos e orientações. O modelo é
            uma base que você pode reutilizar com diferentes alunos.
          </p>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ["Escolha uma base", "Crie um modelo aqui ou comece uma prescrição do zero na ficha do aluno."],
              ["Personalize para o aluno", "Use o modelo para criar um rascunho e ajuste o treino às necessidades do aluno."],
              ["Revise e envie", "Aprove a versão final e envie. O aluno recebe a prescrição para aceitar no próprio planejamento."],
            ].map(([title, description], index) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/personal" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Escolher aluno para prescrever <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

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
