"use server";

import { revalidatePath } from "next/cache";
import { upsertUserTrainData } from "@/app/_lib/api/fetch-generated";
import { getOnboardingError, onboardingSchema } from "./_lib/onboarding-schema";

export async function completeOnboardingAction(input: unknown) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success)
    return { success: false as const, error: getOnboardingError(parsed.error) };

  try {
    const { weightKg, heightCm, age, bodyFatPercentage } = parsed.data;
    const result = await upsertUserTrainData({
      weightInGrams: Math.round(weightKg * 1000),
      heightInCentimeters: heightCm,
      age,
      bodyFatPercentage,
    });
    if (result.status !== 200) {
      return {
        success: false as const,
        error:
          result.status === 401
            ? "Sua sessão expirou. Entre novamente para concluir o cadastro."
            : "Não foi possível salvar seus dados. Tente novamente.",
      };
    }
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/stats");
    // This route safely consumes any pending invitation; otherwise it opens home.
    return { success: true as const, destination: "/auth/return" };
  } catch {
    return {
      success: false as const,
      error:
        "Falha de conexão. Seus campos foram preservados; tente novamente.",
    };
  }
}
