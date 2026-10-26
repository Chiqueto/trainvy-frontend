import { listAdminPlans } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { PlansList } from "@/app/admin/_components/plans-list";

export default async function PlansPage() {
  const plans = await readAdmin(listAdminPlans({ cache: "no-store" }));
  return <PlansList initial={plans} />;
}
