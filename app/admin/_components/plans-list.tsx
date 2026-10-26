"use client";

import { useState } from "react";
import { Check, Layers, ShieldCheck, Tag } from "lucide-react";
import type { ListAdminPlans200Item } from "@/app/_lib/api/fetch-generated";
import { entitlementLabels, money } from "../_lib/presentation";
import { Badge } from "@/components/ui/badge";

export function PlansList({ initial }: { initial: ListAdminPlans200Item[] }) {
  const [plans] = useState(initial);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Planos Comerciais
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de planos de assinatura, preços e limites de funcionalidades (entitlements).
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-xs">
          <Layers className="size-3.5" />
          <span>{plans.length} planos cadastrados</span>
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-base font-bold text-foreground">
                      {plan.name}
                    </h2>
                    <Badge
                      variant={plan.isActive ? "default" : "secondary"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Código: {plan.code}
                  </span>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-muted-foreground">
                  {plan.audience}
                </span>
              </div>

              {plan.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {plan.description}
                </p>
              )}

              <div className="pt-2">
                <span className="text-xs text-muted-foreground">Preço base:</span>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {money(plan.monthlyPriceInCents, plan.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> /mês</span>
                </p>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3">
                <span className="text-[11px] font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                  Recursos Inclusos ({plan.entitlements.length})
                </span>
                <ul className="space-y-1.5">
                  {plan.entitlements.map((e, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-xs text-foreground/90"
                    >
                      <div className="flex items-center gap-1.5">
                        <Check className="size-3.5 text-emerald-500 shrink-0" />
                        <span>{entitlementLabels[e.entitlement] ?? e.entitlement}</span>
                      </div>
                      {e.limitValue !== null && (
                        <span className="font-mono text-[11px] font-bold text-primary">
                          limite: {e.limitValue}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
