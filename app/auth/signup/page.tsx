import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";
import { SignupForm } from "../_components/signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: rawReturnTo } = (await searchParams) ?? {};
  const sanitizedReturnTo = sanitizeReturnTo(rawReturnTo);

  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (session.data?.user) {
    const context = await getCommercialContext({ cache: "no-store" });
    if (context.status === 200 && context.data.accountSetupCompletedAt) {
      if (sanitizedReturnTo) {
        redirect(sanitizedReturnTo);
      }
      redirect("/");
    }
  }
  return (
    <SignupForm
      authenticated={Boolean(session.data?.user)}
      returnTo={sanitizedReturnTo}
    />
  );
}
