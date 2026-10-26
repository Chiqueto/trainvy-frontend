import { listAdminSubscriptions } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { SubscriptionsList } from "@/app/admin/_components/subscriptions-list";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function SubscriptionsPage() {
  const subscriptions = await readAdmin(
    listAdminSubscriptions({}, { cache: "no-store" })
  );

  return (
    <AdminDashboardLayout>
      <SubscriptionsList initial={subscriptions} />
    </AdminDashboardLayout>
  );
}
