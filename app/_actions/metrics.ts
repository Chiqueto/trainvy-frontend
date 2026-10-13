"use server";

import { revalidatePath } from "next/cache";
import {
  getUserMetricsHistory,
  GetUserMetricsHistory200Item,
  upsertUserTrainData,
} from "@/app/_lib/api/fetch-generated";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type MetricHistoryItem = GetUserMetricsHistory200Item;

export async function saveUserMetricsAction(input: {
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}): Promise<ActionResult<void>> {
  try {
    const res = await upsertUserTrainData({
      weightInGrams: input.weightInGrams,
      heightInCentimeters: input.heightInCentimeters,
      age: input.age,
      bodyFatPercentage: input.bodyFatPercentage,
    });

    if (res.status !== 200) {
      const errorMsg =
        (res.data as { error?: string })?.error ||
        "Não foi possível salvar os dados corporais";
      return { success: false, error: errorMsg };
    }

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/stats");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro ao salvar medições",
    };
  }
}

export async function getUserMetricsHistoryAction(): Promise<
  ActionResult<GetUserMetricsHistory200Item[]>
> {
  try {
    const res = await getUserMetricsHistory();
    if (res.status !== 200) {
      return { success: false, error: "Erro ao buscar histórico de métricas" };
    }
    return { success: true, data: res.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Erro de conexão ao buscar histórico",
    };
  }
}
