import { getAdminAiUsage } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";
import { AiUsageDashboard } from "@/app/admin/_components/ai-usage-dashboard";

export default async function AdminAiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; userId?: string }>;
}) {
  const params = await searchParams;
  const days = [7, 30, 90].includes(Number(params.days))
    ? Number(params.days)
    : 30;
  const userId =
    typeof params.userId === "string"
      ? params.userId.trim().slice(0, 128) || undefined
      : undefined;
  const data = await readAdmin(
    getAdminAiUsage({ days, userId }, { cache: "no-store" }),
  );
  return (
    <AdminDashboardLayout>
      <AiUsageDashboard data={data} days={days} userId={userId} />
    </AdminDashboardLayout>
  );
}
