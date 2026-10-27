import { sanitizeReturnTo } from "@/app/_lib/auth-return-to";
import { SignupCompletion } from "../_components/signup-completion";
import styles from "../_components/auth.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preparando sua conta | Trainvy" };

export const dynamic = "force-dynamic";

export default async function CompletePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: rawReturnTo } = (await searchParams) ?? {};
  const returnTo = sanitizeReturnTo(rawReturnTo);

  return (
    <main className={styles.content}>
      <h1 className={styles.heading}>
        Falta pouco.
        <br />
        <span>Vamos começar.</span>
      </h1>
      <SignupCompletion returnTo={returnTo} />
    </main>
  );
}
