"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";

const Dashboard = dynamic(
  () =>
    import("./evolution-dashboard").then((module) => module.EvolutionDashboard),
  {
    loading: () => (
      <div
        aria-label="Carregando evolução"
        className="h-64 animate-pulse rounded-xl bg-muted"
      />
    ),
  },
);

export function EvolutionExplorer() {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="evolution-explorer"
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-ring"
      >
        <TrendingUp className="size-5 shrink-0 text-primary" />
        <span className="flex-1">
          <span className="block font-heading font-semibold">
            Explore sua evolução
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Volume, músculos e progresso por exercício
          </span>
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id="evolution-explorer" hidden={!open}>
        {open && (
          <div className="mt-5 border-t border-border pt-5">
            <Dashboard />
          </div>
        )}
      </div>
    </section>
  );
}
