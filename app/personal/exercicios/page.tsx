import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCommercialContext,
  listExercises,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { PersonalHeader } from "../_components/personal-header";
import { CustomExercisesList } from "./_components/custom-exercises-list";

export const metadata = {
  title: "Exercícios Personalizados | Trainvy Pro",
  description: "Gerencie seu catálogo de exercícios personalizados e variações exclusivas.",
};

export default async function PersonalCustomExercisesPage() {
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

  const exercisesRes = await listExercises(
    { onlyCustom: "true" },
    { cache: "no-store" },
  );

  const customExercises =
    exercisesRes.status === 200 ? exercisesRes.data : [];

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-28 lg:pb-8">
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <PersonalHeader
          title="Exercícios Personalizados"
          description="Cadastre variações exclusivas, configure músculos principais e secundários, e utilize-os em todos os seus treinos e modelos."
          activeTab="exercises"
        />

        <CustomExercisesList initialExercises={customExercises as any} />
      </main>
      <BottomNav isCoach={true} activePage="exercises" />
    </div>
  );
}
