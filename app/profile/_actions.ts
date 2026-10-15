"use server";

import { revalidatePath } from "next/cache";
import {
  updateAthleteCoachProgressSharing,
  updateGamificationTheme,
  type UpdateGamificationThemeBodyTheme,
} from "@/app/_lib/api/fetch-generated";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateUserThemeAction(
  theme: UpdateGamificationThemeBodyTheme,
): Promise<ActionResult<{ gamificationTheme: string }>> {
  try {
    const res = await updateGamificationTheme({ theme });
    if (res.status !== 200) {
      const errorMsg =
        (res.data as { error?: string })?.error ||
        "Não foi possível salvar o tema escolhido";
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      data: { gamificationTheme: res.data.gamificationTheme },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message ||
        "Erro de conexão ao salvar a preferência de tema",
    };
  }
}

export async function updateCoachProgressSharingAction(input: {
  enabled: boolean;
  includePreviousHistory: boolean;
}): Promise<
  ActionResult<{
    enabled: boolean;
    includePreviousHistory: boolean;
    sharedAt: string | null;
    revokedAt: string | null;
  }>
> {
  try {
    const res = await updateAthleteCoachProgressSharing(input, {
      cache: "no-store",
    });

    if (res.status === 200 && res.data.sharingConsent) {
      revalidatePath("/profile");
      return {
        success: true,
        data: res.data.sharingConsent,
      };
    }

    const errorMsg =
      (res.data as { error?: string })?.error ||
      "Não foi possível atualizar o compartilhamento de evolução.";
    return { success: false, error: errorMsg };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as Error)?.message ||
        "Falha na comunicação ao atualizar o compartilhamento.",
    };
  }
}

