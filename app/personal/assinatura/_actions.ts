"use server";

import { revalidatePath } from "next/cache";
import * as api from "@/app/_lib/api/fetch-generated";

function extractError(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

export async function startCoachSubscriptionAction(input: {
  planCode: string;
  cpfCnpj: string;
}) {
  try {
    const res = await api.startCoachSubscription(input);
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível iniciar o pagamento."),
      };
    }
    revalidatePath("/personal/assinatura");
    revalidatePath("/personal");
    return { success: true as const, data: res.data };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao iniciar assinatura.",
    };
  }
}

export async function cancelCoachSubscriptionAction(reason?: string) {
  try {
    const res = await api.cancelCoachSubscription(reason ? { reason } : {});
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível cancelar a assinatura."),
      };
    }
    revalidatePath("/personal/assinatura");
    revalidatePath("/personal");
    return { success: true as const, data: res.data };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao cancelar assinatura.",
    };
  }
}

export async function initiateCoachUpgradeAction(planCode: string) {
  try {
    const res = await api.initiateCoachSubscriptionUpgrade({ planCode });
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível iniciar o upgrade."),
      };
    }
    revalidatePath("/personal/assinatura");
    revalidatePath("/personal");
    return { success: true as const, data: res.data };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao iniciar upgrade.",
    };
  }
}

export async function cancelCoachUpgradeAction() {
  try {
    const res = await api.cancelPendingCoachSubscriptionUpgrade();
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível cancelar o upgrade."),
      };
    }
    revalidatePath("/personal/assinatura");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao cancelar upgrade.",
    };
  }
}

export async function previewCoachDowngradeAction(planCode: string) {
  try {
    const res = await api.previewCoachSubscriptionDowngrade({ planCode });
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(
          res.data,
          "Não foi possível carregar o preview do downgrade.",
        ),
      };
    }
    return { success: true as const, data: res.data };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao consultar downgrade.",
    };
  }
}

export async function scheduleCoachDowngradeAction(input: {
  planCode: string;
  retainedAthleteIds?: string[];
  acknowledgeExcessAthletes?: boolean;
}) {
  try {
    const res = await api.scheduleCoachSubscriptionDowngrade(input);
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível agendar o downgrade."),
      };
    }
    revalidatePath("/personal/assinatura");
    return { success: true as const, data: res.data };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao agendar downgrade.",
    };
  }
}

export async function cancelScheduledDowngradeAction() {
  try {
    const res = await api.cancelScheduledCoachSubscriptionDowngrade();
    if (res.status !== 200) {
      return {
        success: false as const,
        error: extractError(res.data, "Não foi possível cancelar o downgrade."),
      };
    }
    revalidatePath("/personal/assinatura");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Erro de comunicação ao cancelar downgrade.",
    };
  }
}
