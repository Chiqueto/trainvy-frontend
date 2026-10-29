import type {
  ListAdminAuditAction,
  ListAdminPlans200ItemEntitlementsItemEntitlement,
} from "@/app/_lib/api/fetch-generated";
export const statuses = [
  "PENDING",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
] as const;
export const entitlementLabels: Record<
  ListAdminPlans200ItemEntitlementsItemEntitlement,
  string
> = {
  COACH_DASHBOARD: "Área do personal",
  MANAGE_ATHLETES: "Gerenciar atletas",
  ASSIGN_WORKOUTS: "Atribuir treinos",
  VIEW_ATHLETE_HISTORY: "Histórico de atletas",
  ADVANCED_STATS: "Estatísticas avançadas",
  AI_CHAT: "Chat IA",
  AI_PLAN_GENERATION: "Planejamento IA",
  SOURCE_LIBRARY: "Biblioteca de fontes",
};
export const actionLabels: Record<ListAdminAuditAction, string> = {
  PROFESSIONAL_VERIFICATION_POLICY_UPDATED: "Exigência de CREF alterada",
  EXERCISE_MUSCLES_UPDATED: "Corrigiu músculos de exercício",
  PLAN_CREATED: "Criou plano",
  PLAN_UPDATED: "Atualizou plano",
  PLAN_ENTITLEMENTS_UPDATED: "Alterou entitlements",
  SUBSCRIPTION_TRIAL_GRANTED: "Concedeu trial",
  SUBSCRIPTION_TRIAL_EXTENDED: "Estendeu trial",
  SUBSCRIPTION_ACTIVATED: "Ativou assinatura",
  SUBSCRIPTION_PLAN_CHANGED: "Trocou plano",
  SUBSCRIPTION_CANCELED: "Cancelou assinatura",
};
export function money(cents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    cents / 100,
  );
}
export function parsePrice(value: string) {
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error("Informe um preço válido, por exemplo 39,90.");
  const cents =
    Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 2147483647)
    throw new Error("Preço fora do limite.");
  return cents;
}
// Explicit UTC avoids server/device hydration differences. UI labels it; trial input uses device local time.
export function adminDate(value: string | null) {
  if (!value) return "—";
  return (
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
const errors: Record<string, string> = {
  EXERCISE_CHANGED:
    "Este exercício foi alterado enquanto você editava. Atualize o catálogo antes de tentar novamente.",
  EXERCISE_NOT_FOUND: "Exercício global não encontrado.",
  PLAN_CODE_ALREADY_EXISTS:
    "Já existe um plano com esse código. Escolha outro.",
  ADMIN_REQUIRED: "Seu acesso administrativo não está mais disponível.",
  UNAUTHORIZED: "Sua sessão expirou. Entre novamente.",
  EXTERNAL_BILLING_MANAGED:
    "Esta assinatura é gerenciada por provedor externo e não pode ser alterada manualmente.",
  PLAN_NOT_ELIGIBLE: "Escolha um plano ativo e compatível com o tipo da conta.",
  ACCOUNT_SETUP_REQUIRED: "O usuário precisa concluir o cadastro primeiro.",
  INVALID_TRIAL_END: "Escolha uma data futura.",
  TRIAL_MUST_BE_EXTENDED:
    "A nova data deve ser posterior ao fim atual do trial.",
  TRIAL_NOT_EXTENDABLE: "Esta assinatura não permite extensão de trial.",
  MANUAL_SUBSCRIPTION_REQUIRED:
    "Esta operação exige uma assinatura manual existente.",
  SUBSCRIPTION_ALREADY_CANCELED: "A assinatura já está cancelada.",
  INTERNAL_PLAN_PRIVATE: "O plano INTERNAL deve permanecer privado.",
  VALIDATION_ERROR: "Revise os campos informados.",
};
export function adminError(code: string) {
  return (
    errors[code] ?? "Não foi possível concluir a operação. Tente novamente."
  );
}
