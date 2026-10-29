import {
  getAdminOverview,
  getProfessionalVerificationPolicy,
} from "@/app/_lib/api/fetch-generated";
import { ProfessionalVerificationPolicyCard } from "./professionals/policy-card";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminOverview } from "@/app/admin/_components/overview";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function AdminPage() {
  const overview = await readAdmin(getAdminOverview({ cache: "no-store" }));
  const policy = await readAdmin(
    getProfessionalVerificationPolicy({ cache: "no-store" }),
  );

  return (
    <AdminDashboardLayout>
      <ProfessionalVerificationPolicyCard
        key={policy.revision}
        policy={policy}
      />
      <AdminOverview data={overview} />
    </AdminDashboardLayout>
  );
}
