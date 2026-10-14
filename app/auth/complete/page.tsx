import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";
import { SignupCompletion } from "../_components/signup-completion";

export const dynamic = "force-dynamic";

export default async function CompletePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: rawReturnTo } = (await searchParams) ?? {};
  const returnTo = sanitizeReturnTo(rawReturnTo);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-5 px-5 py-10">
      <h1 className="text-2xl font-semibold">Concluir cadastro</h1>
      <SignupCompletion returnTo={returnTo} />
    </main>
  );
}
