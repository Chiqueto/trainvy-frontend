"use server";

import { revalidatePath } from "next/cache";
import * as api from "@/app/_lib/api/fetch-generated";
import type {
  ListAdminUsersParams,
  ListAdminSubscriptionsParams,
  ListAdminAuditParams,
  UpdateAdminPlanBody,
  UpdateAdminPlanEntitlementsBody,
} from "@/app/_lib/api/fetch-generated";

async function invoke<T extends { status: number; data: unknown }>(
  operation: () => Promise<T>,
  mutate = false,
) {
  try {
    const result = await operation();
    if (result.status !== 200) {
      const code = (result.data as { code?: string }).code ?? "UNAVAILABLE";
      return { success: false as const, code };
    }
    if (mutate) revalidatePath("/admin", "layout");
    return {
      success: true as const,
      data: result.data as Extract<T, { status: 200 }>["data"],
    };
  } catch {
    return { success: false as const, code: "UNAVAILABLE" };
  }
}
export async function loadAdminUsers(input: ListAdminUsersParams) {
  return invoke(() => api.listAdminUsers(input, { cache: "no-store" }));
}
export async function loadAdminSubscriptions(
  input: ListAdminSubscriptionsParams,
) {
  return invoke(() => api.listAdminSubscriptions(input, { cache: "no-store" }));
}
export async function loadAdminAudit(input: ListAdminAuditParams) {
  return invoke(() => api.listAdminAudit(input, { cache: "no-store" }));
}
export async function saveAdminPlan(
  planId: string,
  input: UpdateAdminPlanBody,
) {
  return invoke(() => api.updateAdminPlan(planId, input), true);
}
export async function saveAdminEntitlements(
  planId: string,
  input: UpdateAdminPlanEntitlementsBody,
) {
  return invoke(() => api.updateAdminPlanEntitlements(planId, input), true);
}
export async function createAdminPlanAction(input: api.CreateAdminPlanBody) {
  try {
    const result = await api.createAdminPlan(input);
    if (result.status !== 201)
      return {
        success: false as const,
        code: (result.data as { code?: string }).code ?? "UNAVAILABLE",
      };
    revalidatePath("/admin", "layout");
    revalidatePath("/auth/signup");
    return { success: true as const, data: result.data };
  } catch {
    return { success: false as const, code: "UNAVAILABLE" };
  }
}
export async function grantTrial(
  userId: string,
  planId: string,
  trialEndsAt: string,
) {
  return invoke(
    () => api.grantManualTrial(userId, { planId, trialEndsAt }),
    true,
  );
}
export async function extendTrial(userId: string, trialEndsAt: string) {
  return invoke(() => api.extendManualTrial(userId, { trialEndsAt }), true);
}
export async function activateSubscription(userId: string, planId: string) {
  return invoke(() => api.activateManualSubscription(userId, { planId }), true);
}
export async function changeSubscriptionPlan(userId: string, planId: string) {
  return invoke(
    () => api.changeManualSubscriptionPlan(userId, { planId }),
    true,
  );
}
export async function cancelSubscription(userId: string) {
  return invoke(() => api.cancelManualSubscription(userId, {}), true);
}
