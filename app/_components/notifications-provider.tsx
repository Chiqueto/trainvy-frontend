"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/app/_lib/auth-client";
import {
  loadNotificationsAction,
  readNotificationAction,
} from "@/app/_actions/notifications";
import type { ListNotifications200 } from "@/app/_lib/api/fetch-generated";

export interface NotificationsContextValue {
  data: ListNotifications200 | null;
  error: string | null;
  loading: boolean;
  saving: boolean;
  load: (cursor?: string, options?: { force?: boolean }) => Promise<void>;
  markRead: (
    id?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const STALE_MS = 15_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const identity = session
    ? `${session.user.id}:${session.session.id}`
    : "anonymous";

  if (identity === "anonymous") {
    return <>{children}</>;
  }

  return (
    <SessionNotificationsProvider key={identity}>
      {children}
    </SessionNotificationsProvider>
  );
}

function SessionNotificationsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ListNotifications200 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const lastFetchedAt = useRef(0);

  const load = useCallback(
    async (cursor?: string, options?: { force?: boolean }) => {
      if (busy.current) return;
      const now = Date.now();
      if (
        !cursor &&
        !options?.force &&
        lastFetchedAt.current > 0 &&
        now - lastFetchedAt.current < STALE_MS
      ) {
        return;
      }

      busy.current = true;
      setLoading(true);
      try {
        const result = await loadNotificationsAction(cursor);
        if (!alive.current) return;
        if (result.success) {
          lastFetchedAt.current = Date.now();
          const page = result.data;
          setData((previous) =>
            cursor && previous
              ? {
                  ...page,
                  notifications: [
                    ...previous.notifications,
                    ...page.notifications.filter(
                      (item) =>
                        !previous.notifications.some(
                          (old) => old.id === item.id,
                        ),
                    ),
                  ],
                }
              : page,
          );
          setError(null);
        } else {
          setError(result.error);
        }
      } catch {
        if (alive.current) {
          setError("Não foi possível carregar as notificações.");
        }
      } finally {
        busy.current = false;
        if (alive.current) setLoading(false);
      }
    },
    [],
  );

  const markRead = useCallback(
    async (id?: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (busy.current) return { ok: false, error: "Operação em andamento." };
      busy.current = true;
      setSaving(true);
      try {
        const result = await readNotificationAction(id);
        if (!result.success) {
          return { ok: false, error: result.error };
        }
        const readAt = new Date().toISOString();
        setData((previous) =>
          previous
            ? {
                ...previous,
                unreadCount: id
                  ? Math.max(
                      0,
                      previous.unreadCount -
                        (previous.notifications.some(
                          (item) => item.id === id && !item.readAt,
                        )
                          ? 1
                          : 0),
                    )
                  : 0,
                notifications: previous.notifications.map((item) =>
                  !id || item.id === id
                    ? { ...item, readAt: item.readAt ?? readAt }
                    : item,
                ),
              }
            : previous,
        );
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Não foi possível marcar como lida. Tente novamente.",
        };
      } finally {
        busy.current = false;
        if (alive.current) setSaving(false);
      }
    },
    [],
  );

  useEffect(() => {
    alive.current = true;
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const refreshForce = () => {
      void load(undefined, { force: true });
    };
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "TRAINVY_PUSH_RECEIVED") {
        refreshForce();
      }
    };

    const initialTimer = window.setTimeout(() => {
      if (alive.current) void load();
    }, 0);
    const pollTimer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    return () => {
      alive.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [load]);

  return (
    <NotificationsContext.Provider
      value={{ data, error, loading, saving, load, markRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}
