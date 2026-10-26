import { listAdminAudit } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AuditList } from "@/app/admin/_components/audit-list";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function AuditPage() {
  const audit = await readAdmin(listAdminAudit({}, { cache: "no-store" }));

  return (
    <AdminDashboardLayout>
      <AuditList initial={audit} />
    </AdminDashboardLayout>
  );
}
