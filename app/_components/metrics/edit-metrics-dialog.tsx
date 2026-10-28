"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Scale,
  Ruler,
  BicepsFlexed,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveUserMetricsAction } from "@/app/_actions/metrics";
import { birthDateSchema, calendarToday } from "@/app/_lib/birth-date";

export interface MetricData {
  weightInGrams?: number | null;
  heightInCentimeters?: number | null;
  age?: number | null;
  birthDate?: string | null;
  bodyFatPercentage?: number | null;
}

interface EditMetricsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MetricData | null;
  onSuccess?: () => void;
}

export function EditMetricsDialog({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: EditMetricsDialogProps) {
  const router = useRouter();

  const [weightKg, setWeightKg] = useState(() =>
    initialData?.weightInGrams
      ? (initialData.weightInGrams / 1000).toString()
      : "",
  );
  const [heightCm, setHeightCm] = useState(() =>
    initialData?.heightInCentimeters
      ? initialData.heightInCentimeters.toString()
      : "",
  );
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "");
  const [bodyFat, setBodyFat] = useState(() =>
    initialData?.bodyFatPercentage != null
      ? initialData.bodyFatPercentage.toString()
      : "",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedWeight = parseFloat(weightKg.replace(",", "."));
    const parsedHeight = parseInt(heightCm, 10);
    const parsedBirthDate = birthDateSchema.safeParse(birthDate);
    const parsedBf = bodyFat.trim() === "" ? null : Number(bodyFat);

    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 350) {
      setErrorMessage("Informe um peso válido entre 20 e 350 kg.");
      return;
    }
    if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 250) {
      setErrorMessage("Informe uma altura válida entre 50 e 250 cm.");
      return;
    }
    if (!parsedBirthDate.success) {
      setErrorMessage(parsedBirthDate.error.issues[0].message);
      return;
    }
    if (
      parsedBf !== null &&
      (!Number.isInteger(parsedBf) || parsedBf < 0 || parsedBf > 100)
    ) {
      setErrorMessage(
        "Informe um percentual de gordura válido entre 0% e 100%.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await saveUserMetricsAction({
        weightInGrams: Math.round(parsedWeight * 1000),
        heightInCentimeters: parsedHeight,
        birthDate: parsedBirthDate.data,
        bodyFatPercentage: parsedBf,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setIsSuccess(true);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar dados.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metrics-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="size-5" />
            </div>
            <div>
              <h2
                id="metrics-modal-title"
                className="font-heading text-lg font-bold text-foreground leading-tight"
              >
                Editar Dados Corporais
              </h2>
              <p className="text-xs text-muted-foreground">
                Atualize suas medições e mantenha seu histórico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Success Message */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Medições registradas!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Seu histórico e métricas atuais foram atualizados com sucesso.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Peso */}
              <div className="space-y-1.5">
                <label
                  htmlFor="weightKg"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <Scale className="size-3.5 text-primary" />
                  <span>Peso (kg)</span>
                </label>
                <div className="relative">
                  <input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    min="20"
                    max="350"
                    placeholder="78.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura */}
              <div className="space-y-1.5">
                <label
                  htmlFor="heightCm"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <Ruler className="size-3.5 text-primary" />
                  <span>Altura (cm)</span>
                </label>
                <div className="relative">
                  <input
                    id="heightCm"
                    type="number"
                    step="1"
                    min="50"
                    max="250"
                    placeholder="180"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    cm
                  </span>
                </div>
              </div>

              {/* Gordura Corporal */}
              <div className="space-y-1.5">
                <label
                  htmlFor="bodyFat"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <BicepsFlexed className="size-3.5 text-primary" />
                  <span>Gordura (% GC, opcional)</span>
                </label>
                <div className="relative">
                  <input
                    id="bodyFat"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Não informado"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* Data de nascimento */}
              <div className="space-y-1.5">
                <label
                  htmlFor="birth-date"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <Calendar className="size-3.5 text-primary" />
                  <span>Data de nascimento</span>
                </label>
                <div className="relative">
                  <input
                    id="birth-date"
                    type="date"
                    autoComplete="bday"
                    max={calendarToday()}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              💡 Cada alteração cria um marco em seu histórico de evolução
              corporal para acompanhar seus ganhos ao longo das semanas.
            </p>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Medições</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
