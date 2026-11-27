"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  loadNotificationsAction,
  readNotificationAction,
} from "@/app/_actions/notifications";
import { useNotificationsContext } from "@/app/_components/notifications-provider";
import type { ListNotifications200 } from "@/app/_lib/api/fetch-generated";

function destination(data: unknown): string | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("url" in data) ||
    typeof data.url !== "string"
  )
    return null;
  // Only allow navigation within this application.
  if (
    !data.url.startsWith("/") ||
    data.url.startsWith("//") ||
    /[\\\s]/.test(data.url)
  )
    return null;
  return data.url;
}

export function NotificationHub({
  variant = "bell",
}: {
  variant?: "bell" | "card" | "header";
}) {
  const router = useRouter();
  const shared = useNotificationsContext();
  const [open, setOpen] = useState(false);
  const [localData, setLocalData] = useState<ListNotifications200 | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);

  const localLoad = useCallback(async (cursor?: string) => {
    if (busy.current) return;
    busy.current = true;
    setLocalLoading(true);
    try {
      const result = await loadNotificationsAction(cursor);
      if (!alive.current) return;
      if (result.success) {
        const page = result.data;
        setLocalData((previous) =>
          cursor && previous
            ? {
                ...page,
                notifications: [
                  ...previous.notifications,
                  ...page.notifications.filter(
                    (item) =>
                      !previous.notifications.some((old) => old.id === item.id),
                  ),
                ],
              }
            : page,
        );
        setLocalError(null);
      } else setLocalError(result.error);
    } catch {
      if (alive.current)
        setLocalError("Não foi possível carregar as notificações.");
    } finally {
      busy.current = false;
      if (alive.current) setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shared) return;
    alive.current = true;
    const refresh = () => {
      if (document.visibilityState === "visible") void localLoad();
    };
    const initialTimer = window.setTimeout(() => {
      if (alive.current) void localLoad();
    }, 0);
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [localLoad, shared]);

  const data = shared ? shared.data : localData;
  const error = shared ? shared.error : localError;
  const loading = shared ? shared.loading : localLoading;
  const saving = shared ? shared.saving : localSaving;

  const load = useCallback(
    async (cursor?: string, options?: { force?: boolean }) => {
      if (shared) {
        await shared.load(cursor, options);
        return;
      }
      await localLoad(cursor);
    },
    [shared, localLoad],
  );

  async function markRead(id?: string, url?: string | null) {
    if (shared) {
      const res = await shared.markRead(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (url) {
        setOpen(false);
        router.push(url);
      }
      return;
    }

    if (busy.current) return;
    busy.current = true;
    setLocalSaving(true);
    try {
      const result = await readNotificationAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const readAt = new Date().toISOString();
      setLocalData((previous) =>
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
      if (url) {
        setOpen(false);
        router.push(url);
      }
    } catch {
      toast.error("Não foi possível marcar como lida. Tente novamente.");
    } finally {
      busy.current = false;
      setLocalSaving(false);
    }
  }

  const unread = data?.unreadCount ?? 0;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) void load();
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
          className={
            variant === "bell"
              ? "relative flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-primary"
              : variant === "header"
                ? "relative inline-flex size-8 items-center justify-center rounded-xl border border-border/70 bg-card text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary"
                : "flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left"
          }
        >
          <Bell className={variant === "header" ? "size-4 shrink-0" : "size-5 shrink-0"} />
          {variant === "card" && (
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold">
                Central de notificações
              </span>
              <span className="text-xs text-muted-foreground">
                Confira seus avisos e atualizações
              </span>
            </span>
          )}
          {unread > 0 && (
            <span
              aria-hidden="true"
              className={
                variant === "bell"
                  ? "absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs font-bold text-primary-foreground"
                  : variant === "header"
                    ? "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
                    : "min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs font-bold text-primary-foreground"
              }
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-background p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-heading text-lg font-semibold">
              Notificações
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar notificações"
              >
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted-foreground">
            Seus avisos de treinos e do seu treinador.
          </Dialog.Description>
          <div className="my-3 flex items-center justify-between gap-2">
            <span role="status" className="text-xs text-muted-foreground">
              {data ? `${unread} não lidas` : "Carregando…"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!unread || loading || saving}
              onClick={() => void markRead()}
            >
              <CheckCheck className="size-4" /> Marcar todas como lidas
            </Button>
          </div>
          <div
            className="min-h-0 overflow-y-auto"
            aria-busy={loading || saving}
          >
            {error && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-destructive/30 p-3 text-sm"
              >
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void load(undefined, { force: true })}
                  disabled={loading}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!data && loading && (
              <Loader2
                aria-label="Carregando notificações"
                className="mx-auto my-6 size-5 animate-spin"
              />
            )}
            {data?.notifications.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-3 size-8" />
                Nenhuma notificação por aqui ainda.
              </div>
            )}
            <ul className="space-y-2">
              {data?.notifications.map((item) => {
                const url = destination(item.data);
                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-4 ${item.readAt ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold ${item.readAt ? "text-muted-foreground" : "text-primary"}`}
                      >
                        {item.readAt ? "Lida" : "Não lida"}
                      </span>
                      <time
                        dateTime={item.sentAt}
                        className="text-[11px] text-muted-foreground"
                      >
                        {new Date(item.sentAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                    <p className="break-words text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {item.body}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!item.readAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving || loading}
                          onClick={() => void markRead(item.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                      {url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={saving || loading}
                          onClick={() =>
                            item.readAt
                              ? (setOpen(false), router.push(url))
                              : void markRead(item.id, url)
                          }
                        >
                          Ver detalhes
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {data?.nextCursor && (
              <Button
                className="mt-3 w-full"
                variant="outline"
                disabled={loading || saving}
                onClick={() => void load(data.nextCursor ?? undefined)}
              >
                {loading ? "Carregando…" : "Carregar mais"}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
