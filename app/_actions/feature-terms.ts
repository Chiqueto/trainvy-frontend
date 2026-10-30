"use server";

import { headers } from "next/headers";

import {
  getFeatureTerms,
  acceptFeatureTerms,
  authorizeFeatureAccess,
} from "@/app/_lib/api/fetch-generated";
type Feature = "AI_WORKOUT" | "EXERCISE_3D";

export async function getFeatureTermsAction(feature: Feature) {
  try {
    const response = await getFeatureTerms(feature, { cache: "no-store" });
    if (response.status !== 200)
      return { success: false as const, error: response.data.error };
    return { success: true as const, data: response.data };
  } catch {
    return {
      success: false as const,
      error:
        "Não foi possível consultar o termo. Verifique sua conexão e tente novamente.",
    };
  }
}

export async function acceptFeatureTermsAction(
  feature: Feature,
  version: string,
  textHash: string,
) {
  try {
    const incoming = await headers();
    const response = await acceptFeatureTerms(
      feature,
      { accepted: true, version, textHash },
      {
        headers: { "user-agent": incoming.get("user-agent") ?? "unknown" },
      },
    );
    if (response.status !== 200)
      return { success: false as const, error: response.data.error };
    return { success: true as const, data: response.data };
  } catch {
    return {
      success: false as const,
      error: "Não foi possível salvar seu aceite. Tente novamente.",
    };
  }
}

export async function authorizeFeatureAccessAction(
  feature: Feature,
  context: string,
) {
  try {
    const response = await authorizeFeatureAccess(feature, { context });
    if (response.status !== 200)
      return { success: false as const, error: response.data.error };
    return { success: true as const, data: response.data };
  } catch {
    return {
      success: false as const,
      error: "Não foi possível autorizar o acesso. Tente novamente.",
    };
  }
}
