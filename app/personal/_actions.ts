"use server";

import { revalidatePath } from "next/cache";
import {
  cancelCoachInvitation,
  createCoachInvitation,
  revokeCoachAthleteLink,
} from "@/app/_lib/api/fetch-generated";

export async function createInvitationAction(expiresInDays: number = 7) {
  try {
    const res = await createCoachInvitation(
      { expiresInDays },
      { cache: "no-store" },
    );

    if (res.status === 201) {
      return {
        success: true as const,
        data: res.data,
      };
    }

    const errorMsg =
      res.data && typeof res.data === "object" && "error" in res.data
        ? (res.data.error as string)
        : "Erro ao gerar convite.";

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

export async function cancelInvitationAction(invitationId: string) {
  try {
    const res = await cancelCoachInvitation(invitationId, { cache: "no-store" });

    if (res.status === 200) {
      revalidatePath("/personal");
      return { success: true as const };
    }

    const errorMsg =
      res.data && typeof res.data === "object" && "error" in res.data
        ? (res.data.error as string)
        : "Erro ao cancelar convite.";

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

export async function revokeStudentAction(linkId: string) {
  try {
    const res = await revokeCoachAthleteLink(linkId, { cache: "no-store" });

    if (res.status === 200) {
      revalidatePath("/personal");
      return { success: true as const };
    }

    const errorMsg =
      res.data && typeof res.data === "object" && "error" in res.data
        ? (res.data.error as string)
        : "Erro ao encerrar vínculo com o aluno.";

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
