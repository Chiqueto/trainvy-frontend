import { getAdminCompliance } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";
import { ComplianceConsole } from "./console";

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { q, cursor } = await searchParams;
  const data = await readAdmin(
    getAdminCompliance(
      {
        q: q?.slice(0, 180),
        cursor: cursor && /^[a-f0-9-]{36}$/i.test(cursor) ? cursor : undefined,
      },
      { cache: "no-store" },
    ),
  );
  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-semibold">Central jurídica e governança</h1>
      <ComplianceConsole data={data} />
    </AdminDashboardLayout>
  );
}
