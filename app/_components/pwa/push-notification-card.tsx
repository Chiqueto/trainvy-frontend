"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Flame, Loader2, Sparkles, UserCheck, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  getPushPermissionState,
  isCurrentlySubscribed,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/app/_lib/push-notifications";

interface PreferencesState {
  streakReminder: boolean;
  streakReminderHour: number;
  coachLinked: boolean;
  workoutAssigned: boolean;
}

export function PushNotificationCard() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesState>({
    streakReminder: true,
    streakReminderHour: 8,
    coachLinked: true,
    workoutAssigned: true,
  });

  const loadPreferences = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/backend";
      const res = await fetch(`${baseUrl}/notification-preferences`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error("Erro ao carregar preferências de notificação:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    const isSupp = isPushSupported();
    setSupported(isSupp);

    if (isSupp) {
      setPermission(getPushPermissionState());
      isCurrentlySubscribed().then((sub) => {
        setIsSubscribed(sub);
        if (sub) {
          loadPreferences();
        }
      });
    }
  }, []);

  if (!mounted) return null;

  if (!supported) {
    return null; // Não exibe se o browser/dispositivo não tiver suporte algum
  }

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const result = await subscribeToPush();
      setPermission(getPushPermissionState());
      if (result.success) {
        setIsSubscribed(true);
        toast.success("Notificações ativadas com sucesso!");
        loadPreferences();
      } else {
        toast.error(result.error || "Não foi possível ativar as notificações.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const result = await unsubscribeFromPush();
      if (result.success) {
        setIsSubscribed(false);
        toast.info("Notificações desativadas.");
      } else {
        toast.error(result.error || "Erro ao desativar notificações.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreference = async (
    key: keyof Omit<PreferencesState, "streakReminderHour">,
    value: boolean
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/backend";
      const res = await fetch(`${baseUrl}/notification-preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar preferência");
      }
    } catch {
      // Rollback em caso de erro
      setPreferences((prev) => ({ ...prev, [key]: !value }));
      toast.error("Erro ao salvar configuração.");
    }
  };

  if (permission === "denied") {
    return (
      <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-left shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <BellOff className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-semibold text-foreground">
              Notificações Bloqueadas
            </h3>
            <p className="text-[11px] text-muted-foreground">
              O envio de notificações foi bloqueado no navegador. Habilite nas configurações do site para receber lembretes de treinos e avisos do seu personal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="w-full rounded-xl border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5 p-4 space-y-3.5 text-left shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading text-xs font-semibold text-foreground">
                  Notificações Ativadas
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  Push
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Você recebe alertas no dispositivo mesmo com o Trainvy fechado.
              </p>
            </div>
          </div>
        </div>

        {/* Toggles de preferências granulares */}
        <div className="space-y-2.5 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Lembrete de sequência (streak)</p>
                <p className="text-[10px] text-muted-foreground">Aviso diário para não perder seus dias consecutivos</p>
              </div>
            </div>
            <Switch
              checked={preferences.streakReminder}
              onCheckedChange={(checked) => handleTogglePreference("streakReminder", checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Vínculo com treinador</p>
                <p className="text-[10px] text-muted-foreground">Aviso quando seu personal conectar com você</p>
              </div>
            </div>
            <Switch
              checked={preferences.coachLinked}
              onCheckedChange={(checked) => handleTogglePreference("coachLinked", checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="size-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Novos treinos atribuídos</p>
                <p className="text-[10px] text-muted-foreground">Aviso quando seu personal prescrever um treino</p>
              </div>
            </div>
            <Switch
              checked={preferences.workoutAssigned}
              onCheckedChange={(checked) => handleTogglePreference("workoutAssigned", checked)}
            />
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleUnsubscribe}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors underline cursor-pointer"
          >
            Desativar notificações neste dispositivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 space-y-3 text-left shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Notificações Push
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary">
                <Sparkles className="size-2.5" />
                Novidade
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seja lembrado de não perder sua sequência de treinos e receba atualizações do seu personal em tempo real.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isLoading}
        onClick={handleSubscribe}
        className="w-full font-heading font-semibold text-xs gap-1.5 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Ativando...
          </>
        ) : (
          <>
            <Bell className="size-3.5" />
            Ativar Notificações
          </>
        )}
      </Button>
    </div>
  );
}

