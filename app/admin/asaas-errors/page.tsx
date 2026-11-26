import { listAdminAsaasErrors } from "@/app/_lib/api/fetch-generated";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";
import { AsaasErrorsList } from "@/app/admin/_components/asaas-errors-list";
import { readAdmin } from "@/app/admin/_lib/server";

export const dynamic = "force-dynamic";

export default async function AdminAsaasErrorsPage() {
  const data = await readAdmin(
    listAdminAsaasErrors({ limit: 50 }, { cache: "no-store" }),
  );

  return (
    <AdminDashboardLayout>
      <AsaasErrorsList initial={data} />
    </AdminDashboardLayout>
  );
}
