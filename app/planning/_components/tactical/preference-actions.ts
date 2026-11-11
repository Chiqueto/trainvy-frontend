"use server";
import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import {
  getBuilderPreferences,
  updateBuilderPreferences,
} from "@/app/_lib/api/fetch-generated";

export async function loadBuilderPreference() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session.data) return null;
  const result = await getBuilderPreferences().catch(() => null);
  return {
    userId: session.data.user.id,
    mode: result?.status === 200 ? result.data.preferredBuilderMode : null,
  };
}
export async function saveBuilderPreference(mode: "tactical" | "classic") {
  const result = await updateBuilderPreferences({ preferredBuilderMode: mode });
  return result.status === 200;
}
