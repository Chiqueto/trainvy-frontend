import { redirect } from "next/navigation";
import { BottomNav } from "@/app/_components/bottom-nav";
import {
  getCommercialContext,
  listExercises,
} from "@/app/_lib/api/fetch-generated";
import { requireAccountSetup } from "@/app/_lib/require-account-setup";
import { PersonalHeader } from "../_components/personal-header";
import { ExerciseLibrary } from "./_components/exercise-library";

export const metadata = {
  title: "Exercícios Personalizados | Trainvy Pro",
  description:
    "Gerencie seu catálogo de exercícios personalizados e variações exclusivas.",
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

  const [customRes, globalRes] = await Promise.all([
    listExercises({ onlyCustom: "true" }, { cache: "no-store" }),
    listExercises({ onlyGlobal: "true" }, { cache: "no-store" }),
  ]);

  return (
    <div className="personal-workspace flex min-h-svh min-w-0 flex-col bg-background pb-28 lg:pb-8">
      <main className="trainvy-page mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        <PersonalHeader
          title="Exercícios e demonstrações"
          description="Cadastre seus exercícios e personalize a execução com vídeos do YouTube e referências visuais do app."
          activeTab="exercises"
        />

        <ExerciseLibrary
          customExercises={customRes.status === 200 ? customRes.data : []}
          globalExercises={globalRes.status === 200 ? globalRes.data : []}
        />
      </main>
      <BottomNav isCoach={true} activePage="exercises" />
    </div>
  );
}
