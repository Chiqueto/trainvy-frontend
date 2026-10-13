"use client";

import { useState } from "react";
import { Scale, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { EditMetricsDialog } from "./metrics/edit-metrics-dialog";
import { Button } from "@/components/ui/button";

interface HomeBodyMetricsCardProps {
  weightInGrams?: number | null;
  heightInCentimeters?: number | null;
  age?: number | null;
  bodyFatPercentage?: number | null;
  weightDiffInGrams?: number | null;
  bodyFatDiff?: number | null;
}

export function HomeBodyMetricsCard({
  weightInGrams,
  heightInCentimeters,
  age,
  bodyFatPercentage,
  weightDiffInGrams,
  bodyFatDiff,
}: HomeBodyMetricsCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const weightInKg = weightInGrams ? (weightInGrams / 1000).toFixed(1) : null;
  const heightInCm = heightInCentimeters ?? null;

  return (
    <div className="flex flex-col gap-2.5 px-5 pt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Métricas Corporais
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-7 gap-1 px-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary active:scale-95"
          aria-label="Editar medições"
        >
          <Pencil className="size-3" />
          <span>Atualizar</span>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition hover:border-border">
        <div className="flex items-center justify-between">
          {/* Peso */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Peso Atual
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-xl font-bold text-foreground">
                  {weightInKg ? `${weightInKg} kg` : "—"}
                </span>
                {weightDiffInGrams !== null && weightDiffInGrams !== undefined && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      weightDiffInGrams > 0
                        ? "text-rose-500"
                        : weightDiffInGrams < 0
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {weightDiffInGrams > 0 ? (
                      <>
                        <ArrowUp className="size-3 stroke-[2.5]" />
                        <span>+{(weightDiffInGrams / 1000).toFixed(1)}</span>
                      </>
                    ) : weightDiffInGrams < 0 ? (
                      <>
                        <ArrowDown className="size-3 stroke-[2.5]" />
                        <span>{(weightDiffInGrams / 1000).toFixed(1)}</span>
                      </>
                    ) : (
                      <span>= 0</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dados secundários (GC e Altura) */}
          <div className="flex items-center gap-4 text-right">
            {bodyFatPercentage != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  Gordura
                </span>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="font-heading text-sm font-semibold text-foreground">
                    {bodyFatPercentage}%
                  </span>
                  {bodyFatDiff !== null && bodyFatDiff !== undefined && bodyFatDiff !== 0 && (
                    <span
                      className={`text-[10px] font-semibold flex items-center ${
                        bodyFatDiff > 0 ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {bodyFatDiff > 0 ? `+${bodyFatDiff}%` : `${bodyFatDiff}%`}
                    </span>
                  )}
                </div>
              </div>
            )}
            {heightInCm != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  Altura
                </span>
                <span className="font-heading text-sm font-semibold text-foreground">
                  {heightInCm} cm
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px]">
          <span className="text-muted-foreground">
            Acompanhe sua composição corporal
          </span>
          <Link
            href="/stats#body-metrics"
            className="font-medium text-primary hover:underline"
          >
            Ver evolução →
          </Link>
        </div>
      </div>

      <EditMetricsDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        initialData={{
          weightInGrams,
          heightInCentimeters,
          age,
          bodyFatPercentage,
        }}
      />
    </div>
  );
}
