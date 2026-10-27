"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Dumbbell,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import type { ListPublicPlans200Item } from "@/app/_lib/api/fetch-generated";
import { beginSignup, loadCoachPlans } from "../_actions";
import styles from "./auth.module.css";

const labels: Record<string, string> = {
  COACH_DASHBOARD: "Área do personal",
  MANAGE_ATHLETES: "Alunos",
  ASSIGN_WORKOUTS: "Planejamento de alunos",
  VIEW_ATHLETE_HISTORY: "Histórico dos alunos",
  ADVANCED_STATS: "Estatísticas avançadas",
  AI_CHAT: "Assistente de IA",
  AI_PLAN_GENERATION: "Planejamento com IA",
  SOURCE_LIBRARY: "Biblioteca de fontes",
};

export function SignupForm({
  authenticated = false,
  returnTo,
  initialAccountType = "ATHLETE",
}: {
  authenticated?: boolean;
  returnTo?: string | null;
  initialAccountType?: "ATHLETE" | "COACH";
}) {
  const router = useRouter();
  const [type, setType] = useState<"ATHLETE" | "COACH">(initialAccountType);
  const [plans, setPlans] = useState<ListPublicPlans200Item[]>([]);
  const [planCode, setPlanCode] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(
    initialAccountType === "COACH",
  );
  const [planError, setPlanError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (type !== "COACH") return;
    let current = true;
    loadCoachPlans()
      .then((result) => {
        if (!current) return;
        if (result.success) {
          setPlans(result.plans);
          setPlanCode(result.plans[0]?.code ?? "");
        } else setPlanError(true);
        setLoadingPlans(false);
      })
      .catch(() => {
        if (current) {
          setPlanError(true);
          setLoadingPlans(false);
        }
      });
    return () => {
      current = false;
    };
  }, [type, retry]);

  function chooseType(value: "ATHLETE" | "COACH") {
    if (value === type) return;
    setType(value);
    setError("");
    setPlanError(false);
    setLoadingPlans(value === "COACH");
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = await beginSignup({
        accountType: type,
        planCode: type === "ATHLETE" ? "ATHLETE_FREE" : planCode,
        returnTo: returnTo ?? undefined,
      });
      if (!result.success) throw new Error("intent");
      if (authenticated) {
        router.push(
          returnTo
            ? `/auth/complete?returnTo=${encodeURIComponent(returnTo)}`
            : "/auth/complete",
        );
        return;
      }

      const callbackOrigin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            ).replace(/\/+$/, "");

      const callbackURL = returnTo
        ? `${callbackOrigin}/auth/complete?returnTo=${encodeURIComponent(returnTo)}`
        : `${callbackOrigin}/auth/complete`;

      const errorCallbackURL = returnTo
        ? `${callbackOrigin}/auth?returnTo=${encodeURIComponent(returnTo)}`
        : `${callbackOrigin}/auth`;

      const oauth = await authClient.signIn.social({
        provider: "google",
        requestSignUp: true,
        callbackURL,
        errorCallbackURL,
      });
      if (oauth.error) throw new Error("oauth");
    } catch {
      setError("Não foi possível iniciar seu cadastro. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <main className={styles.content}>
      <h1 className={styles.heading}>
        Seu próximo nível
        <br />
        <span>começa aqui.</span>
      </h1>
      <p className={styles.smallLogin}>
        Já tem uma conta?{" "}
        <Link
          href={
            returnTo
              ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
              : "/auth"
          }
        >
          Entrar <ArrowUpRight size={12} className="inline" />
        </Link>
      </p>
      {returnTo && (
        <div className={styles.inviteNote}>
          <Users size={16} />
          <span>
            Crie sua conta para continuar com o convite do seu personal.
          </span>
        </div>
      )}
      <div className={styles.stepLabel}>
        <span>01</span> Como você vai usar o Trainvy?
      </div>
      <div className={styles.roleGrid} role="group" aria-label="Tipo de conta">
        {(
          [
            [
              "ATHLETE",
              "Quero treinar",
              "Organize seus treinos, registre suas cargas e acompanhe sua evolução.",
            ],
            [
              "COACH",
              "Sou Personal",
              "Organize seus alunos, acompanhe os treinos e monte planejamentos.",
            ],
          ] as const
        ).map(([value, title, description]) => (
          <button
            key={value}
            data-account-type={value}
            type="button"
            aria-pressed={type === value}
            disabled={busy}
            onClick={() => chooseType(value)}
            className={styles.roleCard}
          >
            <span className={styles.radioMark} aria-hidden="true">
              {type === value && <Check size={11} />}
            </span>
            <span className={styles.roleIcon}>
              {value === "ATHLETE" ? (
                <Dumbbell size={18} />
              ) : (
                <Users size={18} />
              )}
            </span>
            <strong>{title}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      <section
        className={styles.planSection}
        aria-label={
          type === "ATHLETE"
            ? "Conta de atleta gratuita"
            : "Planos para personal"
        }
        aria-busy={loadingPlans}
      >
        <div className={styles.stepLabel}>
          <span>02</span>
          {type === "ATHLETE" ? "Seu ponto de partida" : "Escolha seu plano"}
        </div>
        {type === "ATHLETE" ? (
          <div className={styles.freePlan}>
            <div className={styles.freePlanTop}>
              <h2>Grátis</h2>
              <span className={styles.freeBadge}>SEM MENSALIDADE</span>
            </div>
            <p>O primeiro passo não precisa esperar.</p>
            <ul className={styles.benefitList}>
              {[
                "Organize e personalize seus treinos",
                "Registre carga, repetições e RIR por série",
                "Acompanhe seu histórico e evolução",
              ].map((text) => (
                <li key={text}>
                  <Check size={13} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            {loadingPlans ? (
              <div role="status" className={styles.planLoader}>
                <Loader2 size={17} className={styles.spin} />
                Carregando planos...
              </div>
            ) : planError ? (
              <div role="alert" className={styles.errorBlock}>
                <div className={styles.alert}>
                  <AlertCircle size={15} />
                  <span>
                    Não foi possível carregar os planos. Tente novamente para
                    ver as opções disponíveis.
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    setLoadingPlans(true);
                    setPlanError(false);
                    setRetry((n) => n + 1);
                  }}
                >
                  <RotateCcw size={13} className="mr-2 inline" />
                  Tentar novamente
                </button>
              </div>
            ) : plans.length === 0 ? (
              <p className={styles.emptyPlans}>
                Nenhum plano disponível no momento. Você pode voltar mais tarde
                ou começar com uma conta de atleta.
              </p>
            ) : (
              <div className={styles.plansGrid}>
                {plans.map((plan) => (
                  <button
                    key={plan.code}
                    data-plan-code={plan.code}
                    type="button"
                    aria-pressed={planCode === plan.code}
                    disabled={busy}
                    onClick={() => setPlanCode(plan.code)}
                    className={styles.planCard}
                  >
                    <span className={styles.radioMark} aria-hidden="true">
                      {planCode === plan.code && <Check size={11} />}
                    </span>
                    <strong>{plan.name}</strong>
                    <span className={styles.planPrice}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: plan.currency,
                      }).format(plan.monthlyPriceInCents / 100)}
                      <small> / mês</small>
                    </span>
                    {plan.description && (
                      <span className={styles.planDescription}>
                        {plan.description}
                      </span>
                    )}
                    <span className={styles.planEntitlements}>
                      {plan.entitlements.map((e) => (
                        <span key={e.entitlement}>
                          <Check size={11} />
                          <span>
                            {labels[e.entitlement] ?? e.entitlement}
                            {e.limitValue != null ? `: ${e.limitValue}` : ""}
                          </span>
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className={styles.plansNote}>
              A assinatura fica pendente até liberação. Não há cobrança
              automática nesta etapa. Os recursos seguem o plano e a
              disponibilidade da conta.
            </p>
          </>
        )}
      </section>
      {error && (
        <div role="alert" className={styles.alert}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        className={styles.googleButton}
        aria-busy={busy}
        disabled={
          busy || (type === "COACH" && (loadingPlans || planError || !planCode))
        }
        onClick={submit}
      >
        {busy ? (
          <Loader2 className={styles.spin} size={17} />
        ) : authenticated ? (
          <ShieldCheck size={18} />
        ) : (
          <Image src="/google-icon.svg" alt="" width={18} height={18} />
        )}
        {busy
          ? "Preparando cadastro..."
          : authenticated
            ? "Concluir cadastro"
            : "Continuar com Google"}
        {!busy && <ArrowUpRight size={17} className={styles.buttonArrow} />}
      </button>

      <p className={styles.terms}>
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos">Termos de Uso</Link> e{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </main>
  );
}
