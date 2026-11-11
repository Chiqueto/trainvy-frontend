"use client";
import { useEffect, useRef, useState } from "react";
import { LayoutList, Zap } from "lucide-react";
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
    <div className="ml-auto w-fit space-y-1">
      <div
        role="group"
        aria-label="Visualização do editor"
        className="inline-flex rounded-2xl border border-slate-700 bg-slate-950 p-1 text-xs text-slate-300"
      >
        {(["tactical", "classic"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-4 transition-colors ${value === mode ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/15" : "hover:bg-slate-800"}`}
          >
            {mode === "tactical" ? <Zap size={15} /> : <LayoutList size={15} />}
            {mode === "tactical" ? "Modo Tático" : "Modo Clássico"}
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
