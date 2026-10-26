import { getAdminOverview } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminOverview } from "@/app/admin/_components/overview";

export default async function AdminPage() {
  return <AdminOverview data={await readAdmin(getAdminOverview({ cache: "no-store" }))} />;
}
