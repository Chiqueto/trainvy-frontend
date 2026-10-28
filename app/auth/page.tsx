import Link from "next/link";
import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import { SignInWithGoogle } from "./_components/sign-in-with-google";
import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";
import {
  AlertCircle,
  ArrowUpRight,
  ChartNoAxesCombined,
  Dumbbell,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { getSessionCookie } from "better-auth/cookies";
import styles from "./_components/auth.module.css";

export const metadata: Metadata = { title: "Entrar | Trainvy" };

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
    const requestHeaders = await headers();
    if (getSessionCookie(new Headers(requestHeaders))) {
      session = await authClient.getSession({
        fetchOptions: { headers: requestHeaders },
      });
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }
  }

  if (session?.data?.user) {
    if (sanitizedReturnTo) {
      redirect(sanitizedReturnTo);
    }
    const context = await getCommercialContext({ cache: "no-store" }).catch(
      () => null,
    );
    if (context?.status === 200 && context.data.accountSetupCompletedAt) {
      redirect("/");
    }
    redirect("/auth/complete");
  }

  return (
    <div className={styles.content} role="main">
      <h1 className={styles.heading}>
        Bom ter você
        <br />
        <span>de volta.</span>
      </h1>
      <p className={styles.description}>
        Seu planejamento, suas conquistas e o próximo treino estão esperando por
        você.
      </p>
      {sanitizedReturnTo && (
        <div className={styles.inviteNote}>
          <Users size={16} />
          <span>
            Entre para continuar com seu convite. Guardamos o caminho para você.
          </span>
        </div>
      )}
      {oauthError && (
        <div role="alert" className={styles.alert}>
          <AlertCircle size={16} />
          <span>
            Não foi possível entrar. Tente novamente ou escolha Criar conta se
            este for seu primeiro acesso.
          </span>
        </div>
      )}
      <div className={styles.divider} />
      <SignInWithGoogle returnTo={sanitizedReturnTo} />
      <p className={styles.secureNote}>
        <ShieldCheck size={13} /> Acesso seguro com sua conta Google.
      </p>
      <div className={styles.signupPrompt}>
        <span>Primeira vez por aqui?</span>
        <Link
          href={
            sanitizedReturnTo
              ? `/auth/signup?returnTo=${encodeURIComponent(sanitizedReturnTo)}`
              : "/auth/signup"
          }
          className={styles.signupLink}
        >
          Criar conta <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className={styles.valueStrip}>
        <div>
          <Dumbbell />
          <strong>Seu treino</strong>
          <span>Com direção.</span>
        </div>
        <div>
          <ChartNoAxesCombined />
          <strong>Sua evolução</strong>
          <span>Em cada série.</span>
        </div>
        <div>
          <ShieldCheck />
          <strong>Seu espaço</strong>
          <span>Do seu jeito.</span>
        </div>
      </div>
    </div>
  );
}
