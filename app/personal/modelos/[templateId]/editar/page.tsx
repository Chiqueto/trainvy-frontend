import { notFound, redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCoachWorkoutPlanTemplate,
  getCommercialContext,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import {
  CoachTemplateBuilder,
  type InitialTemplateData,
} from "../../_components/coach-template-builder";

export const metadata = {
  title: "Editar Modelo de Treino | Trainvy Pro",
  description: "Edite a estrutura de um modelo de treino pré-definido.",
};

interface EditTemplatePageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  await requireAccountSetup();
  const { templateId } = await params;

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

  const templateRes = await getCoachWorkoutPlanTemplate(templateId, {
    cache: "no-store",
  });

  if (templateRes.status !== 200 || !templateRes.data) {
    notFound();
  }

  const tpl = templateRes.data;

  const initialData: InitialTemplateData = {
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    workoutDays: tpl.payload.workoutDays.map((d) => ({
      name: d.name,
      order: d.order,
      weekDay: d.weekDay,
      isRest: d.isRest,
      estimatedDurationInSeconds: d.estimatedDurationInSeconds,
      exercises: d.exercises.map((e) => ({
        name: e.name,
        order: e.order,
        sets: e.sets,
        warmupSets: e.warmupSets ?? 0,
        reps: e.reps,
        restTimeInSeconds: e.restTimeInSeconds,
        alternative1ExerciseName: e.alternative1ExerciseName,
        alternative2ExerciseName: e.alternative2ExerciseName,
      })),
    })),
  };

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-28 lg:pb-8">
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <CoachTemplateBuilder initialData={initialData} />
      </main>
      <BottomNav isCoach={true} activePage="templates" />
    </div>
  );
}
