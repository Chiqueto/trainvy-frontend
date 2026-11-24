"use server";

import { cookies } from "next/headers";
import { getAccountHomePath } from "@/app/_lib/account-navigation";
import {
  completeSignup,
  createSignupIntent,
  getCommercialContext,
  listLegalDocuments,
  listPublicPlans,
} from "@/app/_lib/api/fetch-generated";
import type { CreateSignupIntentBody } from "@/app/_lib/api/fetch-generated";
import { declareProfessionalCredentialsAction } from "@/app/_actions/legal";
import { validCpf } from "@/app/_lib/professional-input-masks";
import {
  clearReturnToCookie,
  RETURN_TO_COOKIE_NAME,
  sanitizeReturnTo,
  setReturnToCookie,
} from "@/app/_lib/auth-return-to";

const intentCookie = "trainvy-signup-intent";
const coachDeclarationCookie = "trainvy-coach-declaration";

export interface CoachDeclarationInput {
  fullName: string;
  cpf: string;
  cref: string;
  region: string;
  category: string;
  termVersion: string;
  termContentHash: string;
}

export async function setAuthReturnToAction(rawReturnTo?: string | null) {
  if (!rawReturnTo) return { success: false as const };
  const ok = await setReturnToCookie(rawReturnTo);
  return { success: ok };
}

export async function clearAuthReturnToAction() {
  await clearReturnToCookie();
  return { success: true };
}

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

export async function loadCoachDeclarationTerm() {
  try {
    const res = await listLegalDocuments({ cache: "no-store" });
    if (res.status !== 200) return { success: false as const };
    const term = res.data.find(
      (d) => d.slug === "declaracao-responsabilidade-cref",
    );
    if (!term) return { success: false as const };
    return {
      success: true as const,
      term: {
        version: term.version,
        contentHash: term.contentHash,
        contentMd: term.contentMd,
      },
    };
  } catch {
    return { success: false as const };
  }
}

export async function beginSignup(
  input: CreateSignupIntentBody & {
    returnTo?: string | null;
    coachDeclaration?: CoachDeclarationInput | null;
  },
) {
  try {
    if (input.accountType === "COACH" && input.coachDeclaration) {
      const { fullName, cpf, cref, region, category, termVersion, termContentHash } =
        input.coachDeclaration;
      if (!fullName || fullName.trim().length < 5) {
        return { success: false as const, error: "Nome completo deve ter pelo menos 5 caracteres." };
      }
      if (!cpf || !validCpf(cpf)) {
        return { success: false as const, error: "CPF inválido." };
      }
      if (!cref || !/^\d{6}-[GP]$/.test(cref.trim())) {
        return { success: false as const, error: "CREF inválido. Formato esperado: 123456-G ou 123456-P." };
      }
      if (!region) {
        return { success: false as const, error: "Selecione a UF do seu registro CREF." };
      }
      if (!category || category.trim().length < 3) {
        return { success: false as const, error: "Informe sua categoria de registro." };
      }
      if (!termVersion || !termContentHash) {
        return { success: false as const, error: "Termo de responsabilidade técnica não assinado." };
      }
    }

    // Forward only the intended fields; API validates audience, publication and price.
    const result = await createSignupIntent({
      accountType: input.accountType,
      planCode: input.planCode,
    });
    if (result.status !== 201) return { success: false as const };
    const jar = await cookies();
    jar.set(intentCookie, result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(result.data.expiresAt),
    });

    if (input.accountType === "COACH" && input.coachDeclaration) {
      jar.set(
        coachDeclarationCookie,
        JSON.stringify(input.coachDeclaration),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          expires: new Date(result.data.expiresAt),
        },
      );
    }

    if (input.returnTo) {
      await setReturnToCookie(input.returnTo);
    }

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
      jar.delete(coachDeclarationCookie);
      if (sanitizedReturnTo) {
        jar.delete(RETURN_TO_COOKIE_NAME);
        return { success: true as const, destination: sanitizedReturnTo };
      }
      return {
        success: true as const,
        destination: getAccountHomePath(context.data.accountType),
      };
    }
    const token = jar.get(intentCookie)?.value;
    if (!token)
      return { success: false as const, code: "SIGNUP_INTENT_REQUIRED" };
    const result = await completeSignup({ token });
    if (result.status !== 200) {
      if (result.data.code === "ACCOUNT_ALREADY_INITIALIZED") {
        jar.delete(intentCookie);
        jar.delete(coachDeclarationCookie);
        if (sanitizedReturnTo) {
          jar.delete(RETURN_TO_COOKIE_NAME);
          return { success: true as const, destination: sanitizedReturnTo };
        }
        return {
          success: true as const,
          destination: getAccountHomePath(context.data.accountType),
        };
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
    // Coach accounts: apply the pending declaration if present
    jar.delete(RETURN_TO_COOKIE_NAME);
    const pendingDeclarationStr = jar.get(coachDeclarationCookie)?.value;
    if (pendingDeclarationStr) {
      try {
        const decl = JSON.parse(pendingDeclarationStr);
        if (decl && typeof decl === "object" && decl.fullName && decl.cpf) {
          await declareProfessionalCredentialsAction({
            fullName: String(decl.fullName).trim(),
            cpf: String(decl.cpf).replace(/\D/g, ""),
            cref: String(decl.cref).trim().toUpperCase(),
            region: decl.region as any,
            category: String(decl.category).trim(),
            acceptance: {
              accepted: true,
              version: decl.termVersion,
              contentHash: decl.termContentHash,
            },
          });
        }
      } catch {
        // safely ignore corrupted cookies
      } finally {
        jar.delete(coachDeclarationCookie);
      }
    }

    return {
      success: true as const,
      destination: "/auth/welcome",
    };
  } catch {
    return { success: false as const, code: "UNAVAILABLE" };
  }
}
