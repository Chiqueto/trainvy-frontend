import { listAdminPlans } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { PlansList } from "@/app/admin/_components/plans-list";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function PlansPage() {
  const plans = await readAdmin(listAdminPlans({ cache: "no-store" }));

  return (
    <AdminDashboardLayout>
      <PlansList initial={plans} />
    </AdminDashboardLayout>
  );
}
