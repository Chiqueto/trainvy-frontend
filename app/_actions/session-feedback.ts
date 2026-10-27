"use server";

import { revalidatePath } from "next/cache";
import { saveSessionFeedback, type SaveSessionFeedbackBody } from "@/app/_lib/api/fetch-generated";

export async function saveSessionFeedbackAction(sessionId: string, input: SaveSessionFeedbackBody) {
  try {
    const response = await saveSessionFeedback(sessionId, input);
    if (response.status !== 200) return { success: false as const,
      error: response.data.error || "Não foi possível salvar sua avaliação." };
    revalidatePath(`/workout-sessions/${sessionId}/summary`);
    revalidatePath(`/history/${sessionId}`);
    return { success: true as const, data: response.data };
  } catch {
    return { success: false as const, error: "Falha de conexão. Sua avaliação continua aqui; tente salvar novamente." };
  }
}
