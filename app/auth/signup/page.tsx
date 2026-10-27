import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";
import { SignupForm } from "../_components/signup-form";
import { getSessionCookie } from "better-auth/cookies";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Criar conta | Trainvy" };

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string; accountType?: string }>;
}) {
  const { returnTo: rawReturnTo, accountType } = (await searchParams) ?? {};
  const sanitizedReturnTo = sanitizeReturnTo(rawReturnTo);

  const requestHeaders = await headers();
  const session = getSessionCookie(new Headers(requestHeaders))
    ? await authClient.getSession({ fetchOptions: { headers: requestHeaders } })
    : null;
  if (session?.data?.user) {
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
      authenticated={Boolean(session?.data?.user)}
      returnTo={sanitizedReturnTo}
      initialAccountType={accountType === "COACH" ? "COACH" : "ATHLETE"}
    />
  );
}
