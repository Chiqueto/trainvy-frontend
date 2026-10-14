"use server";

import { cookies } from "next/headers";
import {
  completeSignup,
  createSignupIntent,
  getCommercialContext,
  listPublicPlans,
} from "@/app/_lib/api/fetch-generated";
import type { CreateSignupIntentBody } from "@/app/_lib/api/fetch-generated";
import {
  RETURN_TO_COOKIE_NAME,
  sanitizeReturnTo,
} from "@/app/_lib/auth-return-to";

const intentCookie = "trainvy-signup-intent";

export async function loadCoachPlans() {
  try {
    const result = await listPublicPlans(
      { audience: "COACH" },
      { cache: "no-store" },
    );
    if (result.status !== 200) return { success: false as const };
    return { success: true as const, plans: result.data };
  } catch {
    return { success: false as const };
  }
}

export async function beginSignup(input: CreateSignupIntentBody) {
  try {
    // Forward only the intended fields; API validates audience, publication and price.
    const result = await createSignupIntent({
      accountType: input.accountType,
      planCode: input.planCode,
    });
    if (result.status !== 201) return { success: false as const };
    (await cookies()).set(intentCookie, result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(result.data.expiresAt),
    });
    return { success: true as const }; // Never return the bearer token to browser JavaScript.
  } catch {
    return { success: false as const };
  }
}

export async function finishSignup(explicitReturnTo?: string | null) {
  try {
    const context = await getCommercialContext({ cache: "no-store" });
    if (context.status === 401)
      return { success: false as const, code: "UNAUTHORIZED" };
    if (context.status !== 200)
      return { success: false as const, code: "UNAVAILABLE" };
    const jar = await cookies();

    const cookieReturnTo = sanitizeReturnTo(
      jar.get(RETURN_TO_COOKIE_NAME)?.value,
    );
    const sanitizedReturnTo =
      sanitizeReturnTo(explicitReturnTo) ?? cookieReturnTo;

    if (context.data.accountSetupCompletedAt) {
      jar.delete(intentCookie);
      if (sanitizedReturnTo) {
        jar.delete(RETURN_TO_COOKIE_NAME);
        return { success: true as const, destination: sanitizedReturnTo };
      }
      return { success: true as const, destination: "/" };
    }
    const token = jar.get(intentCookie)?.value;
    if (!token)
      return { success: false as const, code: "SIGNUP_INTENT_REQUIRED" };
    const result = await completeSignup({ token });
    if (result.status !== 200) {
      if (result.data.code === "ACCOUNT_ALREADY_INITIALIZED") {
        jar.delete(intentCookie);
        if (sanitizedReturnTo) {
          jar.delete(RETURN_TO_COOKIE_NAME);
          return { success: true as const, destination: sanitizedReturnTo };
        }
        return { success: true as const, destination: "/" };
      }
      return {
        success: false as const,
        code: result.data.code ?? "UNAVAILABLE",
      };
    }
    jar.delete(intentCookie);
    if (result.data.accountType === "ATHLETE") {
      return {
        success: true as const,
        destination: "/onboarding",
      };
    }
    // Coach accounts cannot accept student invitations
    jar.delete(RETURN_TO_COOKIE_NAME);
    return {
      success: true as const,
      destination: "/auth/welcome",
    };
  } catch {
    return { success: false as const, code: "UNAVAILABLE" };
  }
}
