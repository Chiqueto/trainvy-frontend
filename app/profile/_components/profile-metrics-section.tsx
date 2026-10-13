"use client";

import { useState } from "react";
import { Weight, Ruler, BicepsFlexed, User, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { EditMetricsDialog } from "@/app/_components/metrics/edit-metrics-dialog";
import { Button } from "@/components/ui/button";

interface ProfileMetricsSectionProps {
  weightInGrams?: number | null;
  heightInCentimeters?: number | null;
  age?: number | null;
  bodyFatPercentage?: number | null;
  weightDiffInGrams?: number | null;
  bodyFatDiff?: number | null;
}

export function ProfileMetricsSection({
  weightInGrams,
  heightInCentimeters,
  age,
  bodyFatPercentage,
  weightDiffInGrams,
  bodyFatDiff,
}: ProfileMetricsSectionProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const weightInKg = weightInGrams ? (weightInGrams / 1000).toFixed(1) : null;
  const heightInCm = heightInCentimeters ?? null;

  return (
    <div className="w-full space-y-3">
      {/* Header com Lápis de Edição */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Dados Corporais
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary active:scale-95"
          aria-label="Editar dados corporais"
        >
          <Pencil className="size-3.5" />
          <span>Editar</span>
        </Button>
      </div>

      {/* Grid de Métricas com Indicadores de Variação Recente */}
      <div className="grid w-full grid-cols-2 gap-3">
        {/* Peso */}
        <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/8 p-4 relative overflow-hidden transition hover:bg-primary/10">
          <div className="flex items-center rounded-full bg-primary/10 p-2">
            <Weight className="size-4 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-2xl font-bold leading-none text-foreground">
              {weightInKg ?? "-"}
            </span>
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
              Kg
            </span>
            {weightDiffInGrams !== null && weightDiffInGrams !== undefined && (
              <div className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold">
                {weightDiffInGrams > 0 ? (
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <ArrowUp className="size-3 stroke-[2.5]" />
                    <span>+{(weightDiffInGrams / 1000).toFixed(1)} kg</span>
                  </span>
                ) : weightDiffInGrams < 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowDown className="size-3 stroke-[2.5]" />
                    <span>{(weightDiffInGrams / 1000).toFixed(1)} kg</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[10px]">Estável</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Altura */}
        <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/8 p-4 transition hover:bg-primary/10">
          <div className="flex items-center rounded-full bg-primary/10 p-2">
            <Ruler className="size-4 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-2xl font-bold leading-none text-foreground">
              {heightInCm ?? "-"}
            </span>
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
              Cm
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground">Altura</span>
          </div>
        </div>

        {/* Gordura Corporal */}
        <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/8 p-4 relative overflow-hidden transition hover:bg-primary/10">
          <div className="flex items-center rounded-full bg-primary/10 p-2">
            <BicepsFlexed className="size-4 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-2xl font-bold leading-none text-foreground">
              {bodyFatPercentage != null ? `${bodyFatPercentage}%` : "-"}
            </span>
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
              Gc (% Gordura)
            </span>
            {bodyFatDiff !== null && bodyFatDiff !== undefined && (
              <div className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold">
                {bodyFatDiff > 0 ? (
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <ArrowUp className="size-3 stroke-[2.5]" />
                    <span>+{bodyFatDiff}%</span>
                  </span>
                ) : bodyFatDiff < 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowDown className="size-3 stroke-[2.5]" />
                    <span>{bodyFatDiff}%</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[10px]">Estável</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Idade */}
        <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/8 p-4 transition hover:bg-primary/10">
          <div className="flex items-center rounded-full bg-primary/10 p-2">
            <User className="size-4 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-2xl font-bold leading-none text-foreground">
              {age ?? "-"}
            </span>
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
              Anos
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground">Idade</span>
          </div>
        </div>
      </div>

      {/* Link para a tela de evolução corporal */}
      <div className="flex justify-end px-1">
        <Link
          href="/stats#body-metrics"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver histórico de pesagens na Evolução →
        </Link>
      </div>

      {/* Modal de Edição */}
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
