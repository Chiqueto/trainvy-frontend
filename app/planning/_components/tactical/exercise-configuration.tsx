"use client";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import { prescriptionSets } from "../../_lib/tactical";
import { AdvancedPrescriptionFields } from "../advanced-prescription-fields";
import { CatalogExercisePicker } from "../catalog-exercise-picker";
import { TechniqueEditor } from "./technique-editor";
export type ExercisePanelTab = "prescription" | "techniques" | "alternatives";
export function ExerciseConfiguration({
  item,
  onChange,
  tab,
  onTabChange,
  disabled,
}: {
  item: WorkoutPlanDraftExercise;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  tab: ExercisePanelTab;
  onTabChange: (tab: ExercisePanelTab) => void;
  disabled?: boolean;
}) {
  const sets = prescriptionSets(item);
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <div
        role="tablist"
        aria-label="Configuração do exercício"
        className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1"
      >
        {(
          [
            ["prescription", "Prescrição"],
            ["techniques", "Técnicas"],
            ["alternatives", "Substitutos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => onTabChange(key)}
            className={`min-h-10 rounded-lg text-xs ${tab === key ? "bg-cyan-300/15 text-cyan-200" : "text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        aria-label={
          tab === "prescription"
            ? "Prescrição"
            : tab === "techniques"
              ? "Técnicas"
              : "Substitutos"
        }
      >
        {tab === "techniques" ? (
          <TechniqueEditor
            item={item}
            onChange={onChange}
            disabled={disabled}
          />
        ) : tab === "alternatives" ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Exercícios substitutos</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Cadastre até duas alternativas para usar quando precisar
              substituir este exercício. A prescrição principal permanece a
              mesma.
            </p>
            {([1, 2] as const).map((n) => (
              <CatalogExercisePicker
                key={n}
                label={`Substituto ${n}`}
                name={n === 1 ? item.alternative1Name : item.alternative2Name}
                optional
                disabled={disabled}
                excludeIds={[
                  item.exerciseId,
                  n === 1
                    ? item.alternative2ExerciseId
                    : item.alternative1ExerciseId,
                ].filter((id): id is string => !!id)}
                onSelect={(entry) =>
                  onChange(
                    n === 1
                      ? {
                          alternative1Name: entry?.name ?? "",
                          alternative1ExerciseId: entry?.id ?? null,
                        }
                      : {
                          alternative2Name: entry?.name ?? "",
                          alternative2ExerciseId: entry?.id ?? null,
                        },
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AdvancedPrescriptionFields
              value={item}
              onChange={onChange}
              disabled={disabled}
              defaultOpen
            />
            <h3 className="text-sm font-semibold">Prescrição por série</h3>
            <p className="text-xs text-slate-400">
              Ajustes individuais preservam as outras séries.
            </p>
            {sets.map((set, i) => (
              <div
                key={i}
                className="grid grid-cols-[18px_1fr_1fr_1fr] items-end gap-2 text-xs"
              >
                <span className="pb-3 text-slate-500">{i + 1}</span>
                {(["reps", "restSeconds", "load"] as const).map((key) => (
                  <label key={key}>
                    {key === "reps"
                      ? "Reps"
                      : key === "restSeconds"
                        ? "Descanso (s)"
                        : "Carga (kg)"}
                    <input
                      aria-label={`Série ${i + 1}: ${key === "reps" ? "repetições" : key === "restSeconds" ? "descanso (s)" : "carga (kg)"}`}
                      type="number"
                      min={key === "load" ? 0 : 1}
                      max={
                        key === "load"
                          ? 2000
                          : key === "restSeconds"
                            ? 86400
                            : 10000
                      }
                      step={key === "load" ? 0.5 : 1}
                      value={set[key] ?? ""}
                      onChange={(e) => {
                        const number = Number(e.target.value);
                        if (
                          !e.target.value ||
                          !Number.isFinite(number) ||
                          number < (key === "load" ? 0 : 1)
                        )
                          return;
                        const next = sets.map((s, n) =>
                          n === i ? { ...s, [key]: number } : s,
                        );
                        onChange({
                          setPrescription: next,
                          ...(i === 0 && key === "reps"
                            ? { reps: number, repsMin: null, repsMax: null }
                            : {}),
                          ...(i === 0 && key === "restSeconds"
                            ? { restTimeInSeconds: number }
                            : {}),
                        });
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-slate-900 px-2 text-sm text-white"
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </fieldset>
  );
}
