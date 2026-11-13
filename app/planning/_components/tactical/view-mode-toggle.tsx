"use client";
import { useEffect, useRef, useState } from "react";
import { CoachGuidedTour } from "@/app/personal/_components/coach-guided-tour";
import { LayoutGrid, Layers3 } from "lucide-react";
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
}: {
  value: "tactical" | "classic";
  onChange: (value: "tactical" | "classic") => void;
  syncError?: boolean;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Como você prefere montar?</p>
        <p className="text-xs text-muted-foreground">
          Edite por cards ou organize os exercícios no deck 3D.
        </p>
      </div>
      {value === "classic" && <CoachGuidedTour tour="builder" />}
      <div
        data-tour="builder-views"
        role="group"
        aria-label="Visualização do editor"
        className="inline-flex self-start rounded-xl bg-muted p-1 text-sm text-muted-foreground sm:self-auto"
      >
        {(["tactical", "classic"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 transition-colors ${value === mode ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent hover:text-foreground"}`}
          >
            {mode === "tactical" ? (
              <Layers3 size={16} />
            ) : (
              <LayoutGrid size={16} />
            )}
            {mode === "tactical" ? "Deck 3D" : "Cards"}
          </button>
        ))}
      </div>
      {syncError && (
        <p role="status" className="text-xs text-amber-600">
          Preferência local; sincronização indisponível.
        </p>
      )}
    </div>
  );
}
