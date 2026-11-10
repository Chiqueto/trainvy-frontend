"use server";

import {
  updateAdminAiAvailability,
  type UpdateAdminAiAvailabilityBody,
} from "@/app/_lib/api/fetch-generated";

export async function updateAiAvailabilityAction(
  input: UpdateAdminAiAvailabilityBody,
) {
  try {
    const result = await updateAdminAiAvailability(input);
    if (result.status !== 200)
      return {
        success: false as const,
        error:
          "error" in result.data
            ? result.data.error
            : "Não foi possível salvar.",
      };
    // Consumers use no-store reads; the client refresh event updates this tab.
    return { success: true as const, data: result.data };
  } catch {
    return {
      success: false as const,
      error: "Não foi possível salvar a configuração. Tente novamente.",
    };
  }
}
