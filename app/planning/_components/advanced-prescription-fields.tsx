"use client";
import type { WorkoutPlanDraftExercise } from "../_lib/workout-plan-builder";
import { Input } from "@/components/ui/input";
export function AdvancedPrescriptionFields({
  value,
  onChange,
  disabled = false,
}: {
  value: Pick<
    WorkoutPlanDraftExercise,
    "repsMin" | "repsMax" | "targetRir" | "targetLoadInGrams" | "tempo"
  >;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  disabled?: boolean;
}) {
  const number = (text: string) => (text === "" ? null : Number(text));
  return (
    <details className="rounded-xl border border-border/70 px-3 py-2">
      <summary className="cursor-pointer py-1 text-xs font-semibold text-primary">
        Prescrição avançada (opcional)
      </summary>
      <fieldset
        disabled={disabled}
        className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <legend className="sr-only">Faixa e metas de execução</legend>
        <label className="flex flex-col gap-1 text-xs">
          Repetições mínimas
          <Input
            type="number"
            min={1}
            max={10000}
            step={1}
            value={value.repsMin ?? ""}
            onChange={(e) => onChange({ repsMin: number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Repetições máximas
          <Input
            type="number"
            min={1}
            max={10000}
            step={1}
            value={value.repsMax ?? ""}
            onChange={(e) => onChange({ repsMax: number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          RIR alvo
          <Input
            type="number"
            min={0}
            max={10}
            step={1}
            value={value.targetRir ?? ""}
            onChange={(e) => onChange({ targetRir: number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Carga alvo (kg)
          <Input
            type="number"
            min={0}
            max={2000}
            step="0.001"
            value={
              value.targetLoadInGrams == null
                ? ""
                : value.targetLoadInGrams / 1000
            }
            onChange={(e) =>
              onChange({
                targetLoadInGrams:
                  e.target.value === ""
                    ? null
                    : Math.round(Number(e.target.value) * 1000),
              })
            }
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs">
          Cadência
          <Input
            value={value.tempo ?? ""}
            maxLength={80}
            placeholder="Ex.: 3-1-1-0"
            onChange={(e) => onChange({ tempo: e.target.value })}
          />
        </label>
        <p className="col-span-2 text-[11px] text-muted-foreground sm:col-span-3">
          Deixe a faixa vazia para usar repetições fixas. Cadência: descida,
          pausa baixa, subida, pausa alta. Metas não substituem o registro do
          que foi executado.
        </p>
      </fieldset>
    </details>
  );
}
