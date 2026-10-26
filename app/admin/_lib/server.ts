import { notFound, redirect } from "next/navigation";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";

export async function requireAdminPage() {
  const result = await getCommercialContext({ cache: "no-store" });
  if (result.status === 401) {
    redirect("/admin/login?returnTo=/admin");
  }
  if (result.status !== 200) {
    throw new Error("Não foi possível verificar o acesso administrativo.");
  }
  if (result.data.systemRole !== "ADMIN") {
    redirect("/admin/login?error=UNAUTHORIZED");
  }
  return result.data;
}

export async function readAdmin<T extends { status: number; data: unknown }>(
  promise: Promise<T>,
): Promise<Extract<T, { status: 200 }>["data"]> {
  const result = await promise;
  if (result.status === 401) redirect("/admin/login?returnTo=/admin");
  if (result.status === 403) redirect("/admin/login?error=UNAUTHORIZED");
  if (result.status === 404) notFound();
  if (result.status !== 200)
    throw new Error("Não foi possível carregar os dados administrativos.");
  return result.data as Extract<T, { status: 200 }>["data"];
}
