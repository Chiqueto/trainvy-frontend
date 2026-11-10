import {
  getAdminOverview,
  getAdminAiAvailability,
} from "@/app/_lib/api/fetch-generated";
import { ProfessionalVerificationPolicyCard } from "./professionals/policy-card";
import { AiAvailabilityCard } from "./_components/ai-availability-card";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminOverview } from "@/app/admin/_components/overview";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function AdminPage() {
  const overview = await readAdmin(getAdminOverview({ cache: "no-store" }));
  const ai = await getAdminAiAvailability({ cache: "no-store" }).catch(
    () => null,
  );

  return (
    <AdminDashboardLayout>
      <AiAvailabilityCard initial={ai?.status === 200 ? ai.data : null} />
      <ProfessionalVerificationPolicyCard />
      <AdminOverview data={overview} />
    </AdminDashboardLayout>
  );
}
