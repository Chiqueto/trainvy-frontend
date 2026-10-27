import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { getCommercialContext } from "@/app/_lib/api/fetch-generated";
import styles from "../_components/auth.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bem-vindo ao Trainvy | Trainvy" };

export default async function WelcomePage() {
  const result = await getCommercialContext({ cache: "no-store" });
  if (result.status === 401) redirect("/auth");
  if (result.status !== 200)
    throw new Error("Não foi possível carregar sua conta.");
  if (!result.data.accountSetupCompletedAt) redirect("/auth/complete");
  if (result.data.accountType !== "COACH") redirect("/");
  const planName = result.data.plan?.name ?? "Personal Trainer";
  const active = ["ACTIVE", "TRIALING"].includes(
    result.data.subscription?.status ?? "",
  );
  return (
    <main className={styles.content}>
      <div className={styles.welcomeIcon}>
        <ShieldCheck size={27} />
      </div>
      <h1 className={styles.heading}>
        Seu espaço.
        <br />
        <span>Sua metodologia.</span>
      </h1>
      <p className={styles.description}>
        Bem-vindo ao Trainvy. O próximo passo é organizar sua rotina como
        personal e conhecer seu espaço de acompanhamento.
      </p>
      <div className={styles.welcomePlan}>
        <div>
          <span className={styles.overline}>PLANO SELECIONADO</span>
          <strong>{planName}</strong>
        </div>
        <span>{active ? "Assinatura ativa" : "Aguardando liberação"}</span>
      </div>
      {!active && (
        <p className={styles.plansNote}>
          Seu cadastro foi concluído. Os recursos do plano ficam disponíveis
          após liberação da assinatura.
        </p>
      )}
      <div className={styles.welcomeFeatures}>
        <div>
          <Users size={19} />
          <div>
            <strong>Seus alunos, mais perto</strong>
            <p>Convites e acompanhamento dos atletas vinculados à sua conta.</p>
          </div>
        </div>
        <div>
          <Layers3 size={19} />
          <div>
            <strong>Planejamento com a sua direção</strong>
            <p>
              Prescrições e modelos para organizar sua metodologia de treino.
            </p>
          </div>
        </div>
        <div>
          <ChartNoAxesCombined size={19} />
          <div>
            <strong>Contexto para acompanhar</strong>
            <p>
              Histórico, execução e feedback dos alunos, conforme os recursos do
              plano.
            </p>
          </div>
        </div>
      </div>
      <Link href="/personal" className={styles.primaryButton}>
        Acessar Painel do Personal <ArrowUpRight size={18} />
      </Link>
      <Link href="/" className={`${styles.secondaryLink} block mt-3`}>
        Acessar meus treinos pessoais
      </Link>
    </main>
  );
}
