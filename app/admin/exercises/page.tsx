import { listAdminExercises } from "@/app/_lib/api/fetch-generated";
import { AdminDashboardLayout } from "../_components/admin-dashboard-layout";
import { ExercisesCatalog } from "../_components/exercises-catalog";
import { readAdmin, requireAdminPage } from "../_lib/server";

export default async function ExercisesPage() {
  await requireAdminPage();
  const exercises = await readAdmin(listAdminExercises({ cache: "no-store" }));
  return (
    <AdminDashboardLayout>
      <ExercisesCatalog exercises={exercises} />
    </AdminDashboardLayout>
  );
}
