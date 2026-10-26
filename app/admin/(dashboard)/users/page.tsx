import { listAdminUsers } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { UsersList } from "@/app/admin/_components/users-list";

export default async function UsersPage() {
  return (
    <UsersList
      initial={await readAdmin(listAdminUsers({}, { cache: "no-store" }))}
    />
  );
}
