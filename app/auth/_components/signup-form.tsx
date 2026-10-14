"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/app/_lib/auth-client";
import type { ListPublicPlans200Item } from "@/app/_lib/api/fetch-generated";
import { beginSignup, loadCoachPlans } from "../_actions";

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
}: {
  authenticated?: boolean;
  returnTo?: string | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<"ATHLETE" | "COACH">("ATHLETE");
  const [plans, setPlans] = useState<ListPublicPlans200Item[]>([]);
  const [planCode, setPlanCode] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
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
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-5 py-10">
      <Link
        href={
          returnTo
            ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
            : "/auth"
        }
        className="w-fit text-sm underline"
      >
        Voltar para entrar
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">Trainvy · Criar conta</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Como você vai usar o Trainvy?
        </h1>
      </div>
      <div className="grid gap-3" role="group" aria-label="Tipo de conta">
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
            type="button"
            aria-pressed={type === value}
            disabled={busy}
            onClick={() => chooseType(value)}
            className={`rounded-2xl border p-5 text-left focus-visible:outline-2 focus-visible:outline-primary ${type === value ? "border-primary bg-primary/10" : "border-border"}`}
          >
            <span className="block font-semibold">{title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {description}
            </span>
          </button>
        ))}
      </div>
      {type === "ATHLETE" ? (
        <section className="rounded-2xl border p-5">
          <h2 className="font-semibold">Grátis</h2>
          <p className="text-sm text-muted-foreground">
            Comece agora sem mensalidade.
          </p>
        </section>
      ) : (
        <section className="space-y-3" aria-busy={loadingPlans}>
          <h2 className="text-xl font-semibold">Escolha seu plano</h2>
          <p className="text-sm text-muted-foreground">
            A assinatura fica pendente até liberação. Não há cobrança automática
            nesta etapa. Recursos de gestão de alunos serão disponibilizados em
            etapas futuras.
          </p>
          {loadingPlans ? (
            <p role="status">Carregando planos...</p>
          ) : planError ? (
            <div role="alert">
              Não foi possível carregar os planos.
              <Button
                variant="outline"
                onClick={() => {
                  setLoadingPlans(true);
                  setPlanError(false);
                  setRetry((n) => n + 1);
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <p>Nenhum plano disponível no momento.</p>
          ) : (
            plans.map((plan) => (
              <button
                key={plan.code}
                type="button"
                aria-pressed={planCode === plan.code}
                disabled={busy}
                onClick={() => setPlanCode(plan.code)}
                className={`block w-full rounded-2xl border p-5 text-left focus-visible:outline-2 focus-visible:outline-primary ${planCode === plan.code ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <span className="block font-semibold">{plan.name}</span>
                <span className="mt-1 block text-xl">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: plan.currency,
                  }).format(plan.monthlyPriceInCents / 100)}
                  <span className="text-sm text-muted-foreground"> / mês</span>
                </span>
                {plan.description && (
                  <span className="mt-2 block text-sm">{plan.description}</span>
                )}
                <span className="mt-3 block text-xs text-muted-foreground">
                  {plan.entitlements
                    .map(
                      (e) =>
                        `${labels[e.entitlement] ?? e.entitlement}${e.limitValue !== null ? `: ${e.limitValue}` : ""}`,
                    )
                    .join(" · ")}
                </span>
              </button>
            ))
          )}
        </section>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        className="min-h-12 rounded-full"
        disabled={
          busy || (type === "COACH" && (loadingPlans || planError || !planCode))
        }
        onClick={submit}
      >
        {busy
          ? "Preparando cadastro..."
          : authenticated
            ? "Concluir cadastro"
            : "Continuar com Google"}
      </Button>

      <p className="text-center text-xs text-muted-foreground leading-relaxed pt-1">
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos" className="text-primary underline hover:text-primary/80">
          Termos de Uso
        </Link>{" "}
        e{" "}
        <Link href="/privacidade" className="text-primary underline hover:text-primary/80">
          Política de Privacidade
        </Link>
        .
      </p>
    </main>
  );
}
