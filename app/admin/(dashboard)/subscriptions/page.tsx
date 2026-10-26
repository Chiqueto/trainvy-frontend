import { listAdminSubscriptions } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { SubscriptionsList } from "@/app/admin/_components/subscriptions-list";

export default async function SubscriptionsPage() {
  return (
    <SubscriptionsList
      initial={await readAdmin(listAdminSubscriptions({}, { cache: "no-store" }))}
    />
  );
}
