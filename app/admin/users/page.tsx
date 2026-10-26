import { listAdminUsers } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { UsersList } from "@/app/admin/_components/users-list";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function UsersPage() {
  const users = await readAdmin(listAdminUsers({}, { cache: "no-store" }));

  return (
    <AdminDashboardLayout>
      <UsersList initial={users} />
    </AdminDashboardLayout>
  );
}
