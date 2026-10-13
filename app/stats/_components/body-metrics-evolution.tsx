"use client";

import { useEffect, useState } from "react";
import {
  Scale,
  ArrowUp,
  ArrowDown,
  Calendar,
  PlusCircle,
  History,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  getUserMetricsHistoryAction,
  type MetricHistoryItem,
} from "@/app/_actions/metrics";
import { EditMetricsDialog } from "@/app/_components/metrics/edit-metrics-dialog";
import { Button } from "@/components/ui/button";

dayjs.locale("pt-br");

interface BodyMetricsEvolutionProps {
  initialWeightInGrams?: number | null;
  initialHeightInCm?: number | null;
  initialAge?: number | null;
  initialBodyFat?: number | null;
  initialWeightDiffInGrams?: number | null;
  initialBodyFatDiff?: number | null;
  initialHistory?: MetricHistoryItem[];
}

export function BodyMetricsEvolution({
  initialWeightInGrams,
  initialHeightInCm,
  initialAge,
  initialBodyFat,
  initialWeightDiffInGrams,
  initialBodyFatDiff,
  initialHistory,
}: BodyMetricsEvolutionProps) {
  const [history, setHistory] = useState<MetricHistoryItem[]>(initialHistory ?? []);
  const [isLoading, setIsLoading] = useState(!initialHistory);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await getUserMetricsHistoryAction();
      if (res.success && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de métricas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialHistory) {
      fetchHistory();
    }
  }, [initialHistory]);

  const latestLog = history[0];
  const currentWeightKg = latestLog
    ? latestLog.weightKg
    : initialWeightInGrams
    ? Number((initialWeightInGrams / 1000).toFixed(1))
    : null;
  const currentBodyFat = latestLog
    ? latestLog.bodyFatPercentage
    : initialBodyFat ?? null;
  const currentWeightDiffKg = latestLog
    ? latestLog.weightDiffKg
    : initialWeightDiffInGrams
    ? Number((initialWeightDiffInGrams / 1000).toFixed(1))
    : null;
  const currentBfDiff = latestLog ? latestLog.bodyFatDiff : initialBodyFatDiff ?? null;

  return (
    <section id="body-metrics" aria-labelledby="metrics-title" className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Evolução física</p>
          <h2
            id="metrics-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            Composição e Dados Corporais
          </h2>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="size-3.5" />
          <span>Nova pesagem</span>
        </Button>
      </div>

      {/* Card de Resumo Atual */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="size-4" />
            </div>
            <span className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
              Status Atual
            </span>
          </div>
          {latestLog && (
            <span className="text-[11px] text-muted-foreground">
              Última pesagem: {dayjs(latestLog.loggedAt).format("DD/MM/YYYY")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Peso Atual */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">
              Peso Corporal
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-foreground">
                {currentWeightKg != null ? `${currentWeightKg} kg` : "—"}
              </span>
            </div>
            {currentWeightDiffKg !== null && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {currentWeightDiffKg > 0 ? (
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <ArrowUp className="size-3 stroke-[2.5]" />
                    <span>+{currentWeightDiffKg} kg</span>
                  </span>
                ) : currentWeightDiffKg < 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowDown className="size-3 stroke-[2.5]" />
                    <span>{currentWeightDiffKg} kg</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Estável</span>
                )}
                <span className="text-[10px] text-muted-foreground font-normal">
                  vs. anterior
                </span>
              </div>
            )}
          </div>

          {/* Gordura Corporal */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">
              Gordura (% GC)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-foreground">
                {currentBodyFat != null ? `${currentBodyFat}%` : "—"}
              </span>
            </div>
            {currentBfDiff !== null && (
              <div className="flex items-center gap-1 text-xs font-semibold">
                {currentBfDiff > 0 ? (
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <ArrowUp className="size-3 stroke-[2.5]" />
                    <span>+{currentBfDiff}%</span>
                  </span>
                ) : currentBfDiff < 0 ? (
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <ArrowDown className="size-3 stroke-[2.5]" />
                    <span>{currentBfDiff}%</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Estável</span>
                )}
                <span className="text-[10px] text-muted-foreground font-normal">
                  vs. anterior
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista do Histórico de Pesagens */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <History className="size-3.5 text-muted-foreground" />
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Pesagens ({history.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-xs text-muted-foreground">
            Carregando histórico de medições...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-6 text-center space-y-2">
            <Scale className="mx-auto size-7 text-muted-foreground/60" />
            <p className="font-heading text-sm font-semibold text-foreground">
              Nenhuma pesagem adicional registrada
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Registre suas pesagens periodicamente para visualizar seu progresso e histórico completo aqui.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="mt-2 text-xs"
            >
              Registrar primeira pesagem
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {history.map((item, index) => {
              const isOldest = index === history.length - 1;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 transition hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {item.weightDiffKg != null && item.weightDiffKg < 0 ? (
                        <TrendingDown className="size-4 text-emerald-500" />
                      ) : item.weightDiffKg != null && item.weightDiffKg > 0 ? (
                        <TrendingUp className="size-4 text-rose-500" />
                      ) : (
                        <Calendar className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-sm font-bold text-foreground">
                          {item.weightKg} kg
                        </span>
                        {item.bodyFatPercentage != null && (
                          <span className="text-xs text-muted-foreground">
                            • {item.bodyFatPercentage}% GC
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {dayjs(item.loggedAt).format("DD [de] MMMM [de] YYYY")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.weightDiffKg !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          item.weightDiffKg > 0
                            ? "text-rose-500"
                            : item.weightDiffKg < 0
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.weightDiffKg > 0 ? (
                          <>
                            <ArrowUp className="size-3" />
                            <span>+{item.weightDiffKg} kg</span>
                          </>
                        ) : item.weightDiffKg < 0 ? (
                          <>
                            <ArrowDown className="size-3" />
                            <span>{item.weightDiffKg} kg</span>
                          </>
                        ) : (
                          <span>= 0 kg</span>
                        )}
                      </span>
                    ) : isOldest ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Inicial
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EditMetricsDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        initialData={{
          weightInGrams: latestLog ? latestLog.weightInGrams : initialWeightInGrams,
          heightInCentimeters: latestLog
            ? latestLog.heightInCentimeters
            : initialHeightInCm,
          age: latestLog ? latestLog.age : initialAge,
          bodyFatPercentage: latestLog
            ? latestLog.bodyFatPercentage
            : initialBodyFat,
        }}
        onSuccess={fetchHistory}
      />
    </section>
  );
}
