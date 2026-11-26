"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CoachGuidedTour } from "@/app/personal/_components/coach-guided-tour";
import { ArrowLeft, LayoutGrid, Layers3 } from "lucide-react";
import {
  loadBuilderPreference,
  saveBuilderPreference,
} from "./preference-actions";

export function useBuilderMode() {
  const [mode, setMode] = useState<"tactical" | "classic">("tactical");
  const [syncError, setSyncError] = useState(false);
  const userKey = useRef<string | null>(null);
  const changed = useRef(false);
  const latest = useRef<"tactical" | "classic">("tactical");
  const queue = useRef(Promise.resolve());
  const persist = (value: "tactical" | "classic") => {
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const saved = await saveBuilderPreference(value);
          setSyncError(!saved);
          if (saved && userKey.current && latest.current === value) {
            try {
              localStorage.removeItem(`${userKey.current}:pending`);
            } catch {}
          }
        } catch {
          setSyncError(true);
        }
      });
  };
  useEffect(() => {
    let alive = true;
    loadBuilderPreference()
      .then((result) => {
        if (!alive || !result) return;
        userKey.current = `trainvy:builder-mode:${result.userId}`;
        let local: string | null = null;
        let pending = false;
        try {
          local = localStorage.getItem(userKey.current);
          pending =
            localStorage.getItem(`${userKey.current}:pending`) === "true";
        } catch {}
        if (changed.current) {
          try {
            localStorage.setItem(userKey.current, latest.current);
          } catch {}
          return;
        }
        const cached =
          local === "classic" || local === "tactical" ? local : null;
        const value = pending
          ? (cached ?? result.mode ?? "tactical")
          : (result.mode ?? cached ?? "tactical");
        latest.current = value;
        setMode(value);
        try {
          localStorage.setItem(userKey.current, value);
        } catch {}
        if (pending && value !== result.mode) persist(value);
      })
      .catch(() => {
        if (alive) setSyncError(true);
      });
    const listener = (event: StorageEvent) => {
      if (
        event.key === userKey.current &&
        (event.newValue === "tactical" || event.newValue === "classic")
      )
        setMode(event.newValue);
    };
    window.addEventListener("storage", listener);
    return () => {
      alive = false;
      window.removeEventListener("storage", listener);
    };
  }, []);
  function changeMode(value: "tactical" | "classic") {
    latest.current = value;
    changed.current = true;
    setMode(value);
    try {
      if (userKey.current) {
        localStorage.setItem(userKey.current, value);
        localStorage.setItem(`${userKey.current}:pending`, "true");
      }
    } catch {}
    persist(value);
  }
  return { builderMode: mode, changeMode, syncError };
}
export function ViewModeToggle({
  value,
  onChange,
  syncError,
  backHref,
}: {
  value: "tactical" | "classic";
  onChange: (value: "tactical" | "classic") => void;
  syncError?: boolean;
  backHref?: string;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2 text-card-foreground sm:px-3">
      {backHref && (
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.replace(backHref);
          }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl text-sm hover:bg-accent sm:px-3"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Voltar</span>
        </button>
      )}
      <div
        data-tour="builder-views"
        role="group"
        aria-label="Visualização do editor"
        className="inline-flex shrink-0 rounded-xl bg-muted p-1 text-sm text-muted-foreground"
      >
        {(["tactical", "classic"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={value === mode}
            onClick={() => {
              if (value !== mode) onChange(mode);
            }}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-2.5 transition-colors sm:px-4 ${value === mode ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent hover:text-foreground"}`}
          >
            {mode === "tactical" ? (
              <Layers3 size={16} />
            ) : (
              <LayoutGrid size={16} />
            )}
            {mode === "tactical" ? "Mesa Interativa" : "Cards"}
          </button>
        ))}
      </div>
      <CoachGuidedTour tour="builder" />
      {syncError && (
        <p role="status" className="text-xs text-amber-600">
          Preferência local; sincronização indisponível.
        </p>
      )}
    </div>
  );
}
