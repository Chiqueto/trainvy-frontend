import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import { SignInWithGoogle } from "./_components/sign-in-with-google";
import { Logo } from "@/app/_components/logo";
import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error: oauthError, returnTo: rawReturnTo } = await searchParams;
  const sanitizedReturnTo = sanitizeReturnTo(rawReturnTo);

  let session = null;
  try {
    session = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }
  }

  if (session?.data?.user) {
    if (sanitizedReturnTo) {
      redirect(sanitizedReturnTo);
    }
    redirect("/auth/complete");
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-black">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/login-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 flex justify-center pt-12">
        <div className="rounded-2xl bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md">
          <Logo variant="full" size="md" />
        </div>
      </div>

      <div className="flex-1" />

      <div className="relative z-10 flex flex-col items-center gap-15 rounded-t-[20px] bg-primary px-5 pb-10 pt-12">
        <div className="flex w-full flex-col items-center gap-6">
          <p className="font-semibold text-primary-foreground">Entrar</p>
          <h1 className="w-full text-center font-heading text-[32px] font-semibold leading-[1.05] text-primary-foreground">
            O app que vai transformar a forma como você treina.
          </h1>

          <SignInWithGoogle returnTo={sanitizedReturnTo} />
          {oauthError && (
            <p
              role="alert"
              className="text-center text-sm text-primary-foreground"
            >
              Não foi possível entrar. Se ainda não tem uma conta, escolha Criar
              conta para se cadastrar.
            </p>
          )}
          <p className="text-sm text-primary-foreground">
            Ainda não tem conta?{" "}
            <Link
              href={
                sanitizedReturnTo
                  ? `/auth/signup?returnTo=${encodeURIComponent(sanitizedReturnTo)}`
                  : "/auth/signup"
              }
              className="font-semibold underline"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3 text-xs text-primary-foreground/80">
            <Link href="/termos" className="hover:underline">
              Termos de Uso
            </Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:underline">
              Privacidade
            </Link>
          </div>
          <p className="font-heading text-xs leading-[1.4] text-primary-foreground/70">
            ©2026 Copyright Trainvy. Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
