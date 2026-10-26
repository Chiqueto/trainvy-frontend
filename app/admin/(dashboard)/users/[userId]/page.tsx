import { getAdminUser, listAdminPlans } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { UserDetail } from "@/app/admin/_components/user-detail";

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [user, plans] = await Promise.all([
    readAdmin(getAdminUser(userId, { cache: "no-store" })),
    readAdmin(listAdminPlans({ cache: "no-store" })),
  ]);
  return (
    <UserDetail
      key={`${user.id}-${user.subscription?.updatedAt}`}
      user={user}
      plans={plans}
    />
  );
}
