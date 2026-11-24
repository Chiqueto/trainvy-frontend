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
import {
  beginSignup,
  loadCoachDeclarationTerm,
  loadCoachPlans,
} from "../_actions";
import styles from "./auth.module.css";
import { useAiAvailability } from "@/app/_components/ai-availability-provider";
import {
  maskCpf,
  maskCref,
  validCpf,
} from "@/app/_lib/professional-input-masks";
import { LegalDocumentReader } from "@/app/_components/legal-document-reader";

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

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
  const { professionalAiEnabled } = useAiAvailability();
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

  // Professional declaration fields for COACH
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cref, setCref] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("Graduado");
  const [termAccepted, setTermAccepted] = useState(false);
  const [term, setTerm] = useState<{
    version: string;
    contentHash: string;
    contentMd: string;
  } | null>(null);

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

    loadCoachDeclarationTerm()
      ?.then?.((res) => {
        if (!current) return;
        if (res?.success && res.term) {
          setTerm(res.term);
        }
      })
      ?.catch?.(() => { });

    return () => {
      current = false;
    };
  }, [type, retry, professionalAiEnabled]);

  function chooseType(value: "ATHLETE" | "COACH") {
    if (value === type) return;
    setType(value);
    setError("");
    setPlanError(false);
    setLoadingPlans(value === "COACH");
  }

  const isCpfValid = cpf.replace(/\D/g, "").length === 11 && validCpf(cpf);
  const isCrefValid = /^\d{6}-[GP]$/.test(cref.trim());
  const isCoachFormValid =
    type !== "COACH" ||
    (fullName.trim().length >= 5 &&
      isCpfValid &&
      isCrefValid &&
      region !== "" &&
      category.trim().length >= 3 &&
      termAccepted &&
      term !== null);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (type === "COACH" && !isCoachFormValid) {
        setError(
          "Preencha todos os dados profissionais obrigatórios (CREF) e aceite o termo de responsabilidade.",
        );
        setBusy(false);
        return;
      }

      const payload: Parameters<typeof beginSignup>[0] = {
        accountType: type,
        planCode: type === "ATHLETE" ? "ATHLETE_FREE" : planCode,
      };
      if (returnTo) payload.returnTo = returnTo;
      if (type === "COACH" && term) {
        payload.coachDeclaration = {
          fullName: fullName.trim(),
          cpf,
          cref: cref.trim().toUpperCase(),
          region,
          category: category.trim(),
          termVersion: term.version,
          termContentHash: term.contentHash,
        };
      }

      const result = await beginSignup(payload);
      if (!result.success) {
        setError(
          result.error ??
          "Não foi possível iniciar seu cadastro. Tente novamente.",
        );
        setBusy(false);
        return;
      }
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={styles.planPrice}>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: plan.currency,
                        }).format(plan.monthlyPriceInCents / 100)}
                        <small> / mês</small>
                      </span>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        30 DIAS GRÁTIS
                      </span>
                    </div>
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
              Seu cadastro inclui 30 dias de teste grátis com acesso total a todos os recursos. Sem cobrança imediata.
            </p>
          </>
        )}
      </section>

      {type === "COACH" && (
        <section
          className="mt-6 space-y-4 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-xs"
          aria-label="Habilitação profissional obrigatória"
        >
          <div className={styles.stepLabel}>
            <span>03</span> Habilitação profissional obrigatória (CREF)
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para atuar e prescrever treinos como Personal Trainer, informe suas credenciais profissionais e declare a responsabilidade técnica.
          </p>

          <div className="grid gap-3.5">
            <label className="grid gap-1 text-xs font-semibold text-foreground">
              Nome completo
              <input
                type="text"
                required
                disabled={busy}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                minLength={5}
                maxLength={180}
                className="rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-foreground">
                CPF
                <input
                  type="text"
                  required
                  disabled={busy}
                  inputMode="numeric"
                  autoComplete="off"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
                {cpf.length > 0 && !isCpfValid && (
                  <span className="text-[11px] text-destructive font-normal">
                    CPF inválido
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-semibold text-foreground">
                  CREF (ex: 123456-G)
                  <input
                    type="text"
                    required
                    disabled={busy}
                    autoCapitalize="characters"
                    autoComplete="off"
                    value={cref}
                    onChange={(e) => setCref(maskCref(e.target.value))}
                    placeholder="123456-G"
                    maxLength={8}
                    className="rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  {cref.length > 0 && !isCrefValid && (
                    <span className="text-[11px] text-destructive font-normal">
                      Formato inválido
                    </span>
                  )}
                </label>
                <label className="grid gap-1 text-xs font-semibold text-foreground">
                  UF do registro
                  <select
                    required
                    disabled={busy}
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">UF</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <label className="grid gap-1 text-xs font-semibold text-foreground">
              Categoria / Habilitação
              <input
                type="text"
                required
                disabled={busy}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Graduado (Bacharelado)"
                minLength={3}
                maxLength={160}
                className="rounded-lg border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </label>

            {term ? (
              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-2.5">
                <LegalDocumentReader
                  document={{
                    ...term,
                    title: "Declaração de Habilitação e Responsabilidade Técnica",
                  }}
                />
                <label className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    disabled={busy}
                    checked={termAccepted}
                    onChange={(e) => setTermAccepted(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary shrink-0"
                  />
                  <span>
                    Declaro sob as penas da lei que possuo registro ativo no CREF informado e assumo responsabilidade técnica exclusiva pelas prescrições realizadas.
                  </span>
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground animate-pulse">
                Carregando termo de responsabilidade técnica...
              </div>
            )}
          </div>
        </section>
      )}

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
          busy ||
          (type === "COACH" &&
            (loadingPlans || planError || !planCode || !isCoachFormValid))
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

      {type === "COACH" && !isCoachFormValid && (
        <p className="text-center text-xs text-amber-500/90 -mt-2">
          Preencha seus dados profissionais (CREF) e aceite o termo para continuar.
        </p>
      )}

      <p className={styles.terms}>
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos">Termos de Uso</Link> e{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </main>
  );
}
