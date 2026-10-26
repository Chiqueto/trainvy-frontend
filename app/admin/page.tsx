import { getAdminOverview } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminOverview } from "@/app/admin/_components/overview";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function AdminPage() {
  const overview = await readAdmin(getAdminOverview({ cache: "no-store" }));

  return (
    <AdminDashboardLayout>
      <AdminOverview data={overview} />
    </AdminDashboardLayout>
  );
}
