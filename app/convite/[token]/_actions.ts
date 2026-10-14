"use server";

import { revalidatePath } from "next/cache";
import {
  acceptCoachInvitation,
  revokeAthleteCoachRelationship,
} from "@/app/_lib/api/fetch-generated";

export async function acceptInvitationAction(token: string) {
  try {
    const res = await acceptCoachInvitation(
      { token },
      { cache: "no-store" },
    );

    if (res.status === 200) {
      revalidatePath("/profile");
      revalidatePath("/");
      return {
        success: true as const,
        coachName: res.data.coach.name,
      };
    }

    const errorMsg =
      res.data && typeof res.data === "object" && "error" in res.data
        ? (res.data.error as string)
        : "Não foi possível aceitar o convite.";

    return {
      success: false as const,
      error: errorMsg,
    };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}

export async function revokeCoachAction(linkId: string) {
  try {
    const res = await revokeAthleteCoachRelationship(linkId, {
      cache: "no-store",
    });

    if (res.status === 200) {
      revalidatePath("/profile");
      return { success: true as const };
    }

    const errorMsg =
      res.data && typeof res.data === "object" && "error" in res.data
        ? (res.data.error as string)
        : "Erro ao encerrar vínculo com o treinador.";

    return {
      success: false as const,
      error: errorMsg,
    };
  } catch {
    return {
      success: false as const,
      error: "Falha na comunicação com o servidor.",
    };
  }
}
