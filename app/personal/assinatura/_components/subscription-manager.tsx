"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import type {
  GetCoachBillingOverview200,
  PreviewCoachSubscriptionDowngrade200,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  maskCpfOrCnpj,
  validCpfOrCnpj,
} from "@/app/_lib/professional-input-masks";
import {
  cancelCoachSubscriptionAction,
  cancelCoachUpgradeAction,
  cancelScheduledDowngradeAction,
  initiateCoachUpgradeAction,
  previewCoachDowngradeAction,
  scheduleCoachDowngradeAction,
  startCoachSubscriptionAction,
} from "../_actions";

function formatMoney(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

const statusLabels: Record<string, string> = {
  PENDING: "Pagamento pendente",
  TRIALING: "Período de teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento em atraso",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
};

const paymentStatusLabels: Record<string, string> = {
  CREATED: "Gerado",
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  RECEIVED: "Recebido",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
  CHARGEBACK_REQUESTED: "Chargeback solicitado",
  CHARGEBACK_DISPUTE: "Em disputa",
  CHARGEBACK: "Chargeback",
};

export function SubscriptionManager({
  initial,
  checkoutReturned,
}: {
  initial: GetCoachBillingOverview200;
  checkoutReturned: boolean;
}) {
  const router = useRouter();
  const sub = initial.subscription;
  const paidPlans = initial.availablePlans.filter(
    (p) => p.monthlyPriceInCents > 0,
  );

  const [selectedPlanCode, setSelectedPlanCode] = useState(
    sub?.planCode ?? paidPlans[0]?.code ?? "",
  );
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Cancel confirmation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Downgrade modal/panel state
  const [downgradePreview, setDowngradePreview] =
    useState<PreviewCoachSubscriptionDowngrade200 | null>(null);
  const [retainedAthleteIds, setRetainedAthleteIds] = useState<string[]>([]);
  const [ackExcess, setAckExcess] = useState(false);

  const isAsaasActive =
    sub?.billingProvider === "ASAAS" &&
    sub.status === "ACTIVE" &&
    !sub.cancelAtPeriodEnd;

  const isGracePeriod =
    sub?.billingProvider === "ASAAS" &&
    sub.status === "PAST_DUE" &&
    sub.graceUntil !== null &&
    new Date(sub.graceUntil) > new Date();

  const isCoolingOff =
    sub?.coolingOffUntil !== null &&
    sub?.coolingOffUntil !== undefined &&
    new Date(sub.coolingOffUntil) >= new Date();

  const canStartNewCheckout =
    !isAsaasActive &&
    !isGracePeriod &&
    !(sub?.billingProvider === "MANUAL" && sub.status === "ACTIVE");

  const cpfValid = validCpfOrCnpj(cpfCnpj);

  async function handleStartCheckout() {
    if (!selectedPlanCode || !cpfValid) return;
    setBusy(true);
    setError("");
    setMessage("");
    const res = await startCoachSubscriptionAction({
      planCode: selectedPlanCode,
      cpfCnpj,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setMessage(res.data.message);
    window.open(res.data.checkoutUrl, "_blank", "noopener,noreferrer");
    router.refresh();
  }

  async function handleUpgrade(targetCode: string) {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await initiateCoachUpgradeAction(targetCode);
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setMessage(res.data.message);
    if (res.data.invoiceUrl) {
      window.open(res.data.invoiceUrl, "_blank", "noopener,noreferrer");
    }
    router.refresh();
  }

  async function handleCancelUpgrade() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await cancelCoachUpgradeAction();
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setMessage("Solicitação de upgrade cancelada.");
    router.refresh();
  }

  async function handleOpenDowngradePreview(targetCode: string) {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await previewCoachDowngradeAction(targetCode);
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setDowngradePreview(res.data);
    const limit = res.data.targetAthleteLimit;
    if (limit !== null) {
      setRetainedAthleteIds(
        res.data.athletes.slice(0, limit).map((a) => a.athleteId),
      );
    } else {
      setRetainedAthleteIds(res.data.athletes.map((a) => a.athleteId));
    }
    setAckExcess(false);
  }

  async function handleScheduleDowngrade() {
    if (!downgradePreview) return;
    setBusy(true);
    setError("");
    setMessage("");
    const res = await scheduleCoachDowngradeAction({
      planCode: downgradePreview.targetPlan.code,
      retainedAthleteIds,
      acknowledgeExcessAthletes: ackExcess,
    });
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setDowngradePreview(null);
    setMessage(res.data.message);
    router.refresh();
  }

  async function handleCancelDowngrade() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await cancelScheduledDowngradeAction();
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setMessage("Downgrade agendado cancelado. Seu plano atual permanece.");
    router.refresh();
  }

  async function handleCancelSubscription() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await cancelCoachSubscriptionAction(
      cancelReason.trim() || undefined,
    );
    setBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setShowCancelConfirm(false);
    setMessage(res.data.message);
    router.refresh();
  }

  function toggleAthleteRetention(athleteId: string) {
    const limit = downgradePreview?.targetAthleteLimit ?? null;
    setRetainedAthleteIds((prev) => {
      if (prev.includes(athleteId)) {
        return prev.filter((id) => id !== athleteId);
      }
      if (limit !== null && prev.length >= limit) {
        return prev;
      }
      return [...prev, athleteId];
    });
  }

  return (
    <div className="space-y-6">
      {checkoutReturned && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>
              Pagamento enviado! Assim que for confirmado, seu acesso será
              atualizado automaticamente.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.refresh()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Atualizar status
          </Button>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-foreground"
        >
          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resumo da Assinatura Atual */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Plano Atual
            </p>
            <h2 className="font-heading text-xl font-bold text-foreground mt-0.5">
              {sub?.planName ?? "Sem plano ativo"}
            </h2>
            {sub && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatMoney(sub.monthlyPriceInCents, sub.currency)} / mês
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={initial.accessActive ? "default" : "secondary"}
              className="text-xs font-heading"
            >
              {sub ? statusLabels[sub.status] ?? sub.status : "Sem assinatura"}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.refresh()}
              disabled={busy}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" />
              Atualizar
            </Button>
          </div>
        </div>

        {sub && (
          <div className="grid gap-3 sm:grid-cols-3 rounded-2xl border border-border/60 bg-background/50 p-4 text-xs">
            <div>
              <span className="text-muted-foreground block">
                {sub.status === "TRIALING"
                  ? "Término do Trial"
                  : "Próxima Renovação / Pago até"}
              </span>
              <strong className="text-foreground text-sm">
                {sub.status === "TRIALING"
                  ? formatDate(sub.trialEndsAt)
                  : formatDate(sub.paidUntil ?? sub.currentPeriodEnd)}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">
                Direito de Arrependimento (7 dias)
              </span>
              <strong className="text-foreground text-sm">
                {isCoolingOff
                  ? `Ativo até ${formatDate(sub.coolingOffUntil)}`
                  : "Encerrado / Não aplicável"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">
                Acesso Profissional
              </span>
              <strong className="text-foreground text-sm">
                {initial.accessActive ? "Liberado" : "Bloqueado / Pendente"}
              </strong>
            </div>
          </div>
        )}

        {isGracePeriod && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-foreground flex items-start gap-2.5">
            <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Período de tolerância ativo:</strong> Seu pagamento está
              em atraso. Regularize até{" "}
              <strong>{formatDate(sub?.graceUntil)}</strong> para evitar o
              bloqueio da área de alunos.
            </div>
          </div>
        )}

        {sub?.cancelAtPeriodEnd && sub.status === "CANCELED" && (
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
            Assinatura cancelada. Seu acesso permanece ativo até{" "}
            <strong className="text-foreground">
              {formatDate(sub.paidUntil ?? sub.currentPeriodEnd)}
            </strong>
            .
          </div>
        )}

        {initial.pendingCheckoutUrl && !isAsaasActive && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs space-y-0.5">
              <strong className="text-foreground block">
                Pagamento em aberto
              </strong>
              <span className="text-muted-foreground">
                Você já possui um link de pagamento gerado aguardando conclusão.
              </span>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <a
                href={initial.pendingCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continuar pagamento
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
      </section>

      {/* Upgrade Pendente */}
      {initial.pendingUpgrade && (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Upgrade em andamento: {initial.pendingUpgrade.targetPlanName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Diferença a pagar:{" "}
                <strong>
                  {formatMoney(initial.pendingUpgrade.differenceInCents)}
                </strong>{" "}
                · Status: {initial.pendingUpgrade.status} · Expira em{" "}
                {formatDate(initial.pendingUpgrade.expiresAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {initial.pendingUpgrade.invoiceUrl && (
                <Button asChild size="sm" className="gap-1.5">
                  <a
                    href={initial.pendingUpgrade.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pagar diferença
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              )}
              {initial.pendingUpgrade.status === "PENDING_PAYMENT" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={handleCancelUpgrade}
                >
                  Cancelar upgrade
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Downgrade Agendado */}
      {initial.pendingDowngrade && (
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold flex items-center gap-2">
                <ArrowDownRight className="size-4 text-amber-500" />
                Downgrade agendado para {initial.pendingDowngrade.targetPlanName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Entra em vigor em{" "}
                <strong>
                  {formatDate(initial.pendingDowngrade.effectiveAt)}
                </strong>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={handleCancelDowngrade}
            >
              Cancelar downgrade agendado
            </Button>
          </div>
        </section>
      )}

      {/* Iniciar Nova Assinatura via Asaas */}
      {canStartNewCheckout && (
        <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Assinar Plano Profissional
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha o plano ideal para sua assessoria. O pagamento é processado
              com segurança via Pix, Cartão de Crédito ou Boleto.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {paidPlans.map((plan) => {
              const selected = selectedPlanCode === plan.code;
              const athletesEnt = plan.entitlements.find(
                (e) => e.entitlement === "MANAGE_ATHLETES",
              );
              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setSelectedPlanCode(plan.code)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 bg-background/40 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-heading text-base">
                      {plan.name}
                    </strong>
                    {selected && <Check className="size-4 text-primary" />}
                  </div>
                  <div className="mt-1.5 font-heading text-2xl font-bold text-foreground">
                    {formatMoney(plan.monthlyPriceInCents, plan.currency)}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      / mês
                    </span>
                  </div>
                  {plan.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-primary">
                    {athletesEnt?.limitValue != null
                      ? `Até ${athletesEnt.limitValue} alunos ativos`
                      : "Alunos ilimitados"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 max-w-sm">
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              CPF ou CNPJ do titular
              <input
                type="text"
                inputMode="numeric"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(maskCpfOrCnpj(e.target.value))}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxLength={18}
                disabled={busy}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            {cpfCnpj.length > 0 && !cpfValid && (
              <p className="text-[11px] text-destructive">
                Informe um CPF ou CNPJ válido.
              </p>
            )}
          </div>

          <Button
            disabled={busy || !selectedPlanCode || !cpfValid}
            onClick={handleStartCheckout}
            className="gap-2 rounded-xl h-11"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUpRight className="size-4" />
            )}
            Ir para pagamento
          </Button>
        </section>
      )}

      {/* Alteração de Plano (Upgrade / Downgrade) para Assinatura Ativa */}
      {isAsaasActive && sub && (
        <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-heading text-lg font-bold text-foreground">
            Mudar de Plano
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {paidPlans
              .filter((p) => p.code !== sub.planCode)
              .map((plan) => {
                const isUpgrade =
                  plan.monthlyPriceInCents > sub.monthlyPriceInCents;
                return (
                  <div
                    key={plan.code}
                    className="rounded-2xl border border-border/70 bg-background/40 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <strong className="font-heading text-base">
                          {plan.name}
                        </strong>
                        <Badge variant="outline" className="text-[10px]">
                          {isUpgrade ? "Upgrade imediato" : "Downgrade no ciclo"}
                        </Badge>
                      </div>
                      <p className="font-heading text-lg font-bold mt-1">
                        {formatMoney(plan.monthlyPriceInCents, plan.currency)} /
                        mês
                      </p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    {isUpgrade ? (
                      <Button
                        size="sm"
                        disabled={busy || Boolean(initial.pendingUpgrade)}
                        onClick={() => handleUpgrade(plan.code)}
                        className="gap-1.5"
                      >
                        <ArrowUpRight className="size-3.5" />
                        Fazer upgrade (+{" "}
                        {formatMoney(
                          plan.monthlyPriceInCents - sub.monthlyPriceInCents,
                        )}
                        )
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || Boolean(initial.pendingDowngrade)}
                        onClick={() => handleOpenDowngradePreview(plan.code)}
                        className="gap-1.5"
                      >
                        <ArrowDownRight className="size-3.5" />
                        Agendar downgrade
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Preview de Downgrade */}
          {downgradePreview && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-sm font-bold">
                    Confirmar downgrade para {downgradePreview.targetPlan.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O novo valor (
                    {formatMoney(
                      downgradePreview.targetPlan.monthlyPriceInCents,
                    )}
                    /mês) entrará em vigor em{" "}
                    <strong>{formatDate(downgradePreview.effectiveAt)}</strong>.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDowngradePreview(null)}
                >
                  Fechar
                </Button>
              </div>

              {downgradePreview.excessAthletesCount > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-foreground">
                    Você possui{" "}
                    <strong>{downgradePreview.activeAthletesCount}</strong>{" "}
                    alunos ativos, mas o plano{" "}
                    <strong>{downgradePreview.targetPlan.name}</strong> permite
                    até <strong>{downgradePreview.targetAthleteLimit}</strong>.
                    Selecione até {downgradePreview.targetAthleteLimit} alunos
                    para manter ativos na virada do ciclo:
                  </p>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl border border-border/60 bg-background/60 p-3">
                    {downgradePreview.athletes.map((athlete) => {
                      const checked = retainedAthleteIds.includes(
                        athlete.athleteId,
                      );
                      return (
                        <label
                          key={athlete.athleteId}
                          className="flex items-center gap-2.5 text-xs cursor-pointer py-1"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleAthleteRetention(athlete.athleteId)
                            }
                            className="size-4 rounded border-border"
                          />
                          <span className="font-medium text-foreground">
                            {athlete.name}
                          </span>
                          {athlete.email && (
                            <span className="text-muted-foreground">
                              ({athlete.email})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ackExcess}
                      onChange={(e) => setAckExcess(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-border"
                    />
                    <span>
                      Estou ciente de que os vínculos dos alunos não
                      selecionados serão encerrados automaticamente em{" "}
                      {formatDate(downgradePreview.effectiveAt)}.
                    </span>
                  </label>
                </div>
              )}

              <Button
                disabled={
                  busy ||
                  (downgradePreview.excessAthletesCount > 0 && !ackExcess)
                }
                onClick={handleScheduleDowngrade}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                Confirmar agendamento de downgrade
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Cancelamento */}
      {sub &&
        sub.billingProvider === "ASAAS" &&
        sub.status !== "CANCELED" && (
          <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="size-4 text-destructive" />
                  Cancelar Assinatura
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isCoolingOff
                    ? "Você está dentro do prazo de 7 dias de arrependimento: o cancelamento solicita estorno integral imediato e encerra o acesso."
                    : "A recorrência será cancelada e você continuará com acesso até o final do período já pago."}
                </p>
              </div>
              {!showCancelConfirm && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancelar assinatura
                </Button>
              )}
            </div>

            {showCancelConfirm && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <label className="grid gap-1 text-xs font-medium">
                  Motivo do cancelamento (opcional)
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex.: Mudança de planejamento"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy}
                    onClick={handleCancelSubscription}
                    className="gap-1.5"
                  >
                    <XCircle className="size-3.5" />
                    Confirmar cancelamento
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Manter assinatura
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

      {/* Histórico de Pagamentos e Reembolsos */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-heading text-base font-bold text-foreground">
          Histórico de Cobranças
        </h3>
        {initial.payments.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma cobrança registrada até o momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Data</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Forma</th>
                  <th className="py-2 pr-4 font-semibold">Valor</th>
                  <th className="py-2 pr-4 font-semibold">Vencimento</th>
                  <th className="py-2 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {initial.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {paymentStatusLabels[p.status] ?? p.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {p.billingType ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">
                      {formatMoney(p.amountInCents, p.currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="py-2.5">
                      {p.invoiceUrl || p.checkoutUrl || p.bankSlipUrl ? (
                        <a
                          href={
                            p.invoiceUrl ??
                            p.checkoutUrl ??
                            p.bankSlipUrl ??
                            "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          Abrir
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {initial.refunds.length > 0 && (
          <div className="pt-4 border-t border-border/60 space-y-2">
            <h4 className="font-heading text-sm font-semibold">Reembolsos</h4>
            <div className="space-y-2">
              {initial.refunds.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/50 p-3 text-xs"
                >
                  <div>
                    <strong>{formatMoney(r.amountInCents, r.currency)}</strong>{" "}
                    · {r.refundType} · {r.reason ?? "Sem motivo informado"}
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
