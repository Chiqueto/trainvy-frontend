"use server";
import { revalidatePath } from "next/cache";
import {
  updateSportsProfile,
  type UpdateSportsProfileBody,
} from "@/app/_lib/api/fetch-generated";
export async function saveSportsProfileAction(input: UpdateSportsProfileBody) {
  try {
    const result = await updateSportsProfile(input);
    if (result.status !== 200)
      return {
        success: false as const,
        error: "Não foi possível salvar. Revise os campos e tente novamente.",
      };
    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/stats");
    return { success: true as const, data: result.data };
  } catch {
    return {
      success: false as const,
      error:
        "Falha de conexão. Seus campos foram preservados; tente novamente.",
    };
  }
}
