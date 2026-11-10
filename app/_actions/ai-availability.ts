"use server";

import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";
import {
  getCommercialContext,
  getPublicAiAvailability,
} from "@/app/_lib/api/fetch-generated";

export async function loadAiAvailability() {
  const disabled = {
    professionalAiEnabled: false,
    athleteAiEnabled: false,
    accountType: null as string | null,
    enabled: false,
    chatEnabled: false,
    planningEnabled: false,
  };
  try {
    const policy = await getPublicAiAvailability({ cache: "no-store" });
    if (policy.status !== 200) return disabled;
    const flags = policy.data;
    if (!getSessionCookie(new Headers(await headers())))
      return { ...disabled, ...flags };
    const context = await getCommercialContext({ cache: "no-store" });
    if (context.status !== 200) return { ...disabled, ...flags };
    const accountType = context.data.accountType;
    const audienceEnabled =
      accountType === "COACH"
        ? flags.professionalAiEnabled
        : flags.athleteAiEnabled;
    const has = (key: string) =>
      context.data.entitlements.some((entry) => entry.key === key);
    const chatEnabled = audienceEnabled && has("AI_CHAT");
    const planningEnabled =
      audienceEnabled &&
      has(accountType === "COACH" ? "AI_PLAN_GENERATION" : "AI_CHAT");
    return {
      ...flags,
      accountType,
      enabled: chatEnabled || planningEnabled,
      chatEnabled,
      planningEnabled,
    };
  } catch {
    return disabled;
  }
}
