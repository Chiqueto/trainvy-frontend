"use server";

import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/_lib/api/fetch-generated";

export async function loadNotificationsAction(cursor?: string) {
  try {
    const response = await listNotifications(
      { cursor, limit: 20 },
      { cache: "no-store" },
    );
    if (response.status === 200)
      return { success: true as const, data: response.data };
  } catch {
    /* Return a recoverable error to the hub. */
  }
  return {
    success: false as const,
    error: "Não foi possível carregar as notificações.",
  };
}

export async function readNotificationAction(id?: string) {
  try {
    const response = id
      ? await markNotificationRead(id)
      : await markAllNotificationsRead();
    if (response.status === 200) return { success: true as const };
  } catch {
    /* Keep unread state when persistence fails. */
  }
  return {
    success: false as const,
    error: "Não foi possível marcar como lida. Tente novamente.",
  };
}
