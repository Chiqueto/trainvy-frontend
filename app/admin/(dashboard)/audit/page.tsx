import { listAdminAudit } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AuditList } from "@/app/admin/_components/audit-list";

export default async function AuditPage() {
  const audit = await readAdmin(listAdminAudit({}, { cache: "no-store" }));
  return <AuditList initial={audit} />;
}
