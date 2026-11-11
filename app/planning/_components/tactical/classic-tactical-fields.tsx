import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import {
  prescriptionSets,
  toggleRune,
  cycleRune,
  runeLabel,
  RUNES,
  zoneFor,
  type Rune,
} from "../../_lib/tactical";
export function ClassicTacticalFields({
  value,
  onChange,
  disabled,
}: {
  value: WorkoutPlanDraftExercise;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-xl border border-border p-3 text-xs"
    >
      <legend className="px-1">Grupos e técnicas</legend>
      <label className="flex flex-col gap-1">
        Grupo Bi-set / Super-set (mesmo código para combinar)
        <input
          value={value.supersetGroupId ?? ""}
          maxLength={100}
          onChange={(e) =>
            onChange({ supersetGroupId: e.target.value || null })
          }
          className="min-h-11 rounded-lg border border-input bg-transparent px-3"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(RUNES) as Rune[]).map((r) => (
          <button
            type="button"
            key={r}
            aria-pressed={value.runes?.includes(r) ?? false}
            onClick={() => onChange(toggleRune(value, r))}
            className={`min-h-11 rounded-lg border px-2 ${value.runes?.includes(r) ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {RUNES[r]}
          </button>
        ))}
      </div>
      {!!value.runes?.length && (
        <div
          className="flex flex-wrap gap-2"
          aria-label="Parâmetros das técnicas"
        >
          {value.runes.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange(cycleRune(value, r))}
              className="min-h-11 rounded-lg border border-border px-2"
              title="Alternar parâmetros"
            >
              {runeLabel(value, r)}
            </button>
          ))}
        </div>
      )}
      {!!value.setPrescription?.length && (
        <details>
          <summary className="cursor-pointer py-2">
            Prescrição individual por série
          </summary>
          <div className="space-y-2">
            {prescriptionSets(value).map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                {(["reps", "restSeconds", "load"] as const).map((key) => (
                  <label key={key}>
                    {key === "reps"
                      ? "Reps"
                      : key === "load"
                        ? "Carga kg"
                        : "Descanso s"}{" "}
                    · {i + 1}
                    <input
                      type="number"
                      min={key === "load" ? 0 : 1}
                      step={key === "load" ? 0.5 : 1}
                      value={s[key] ?? ""}
                      onChange={(e) => {
                        const sets = prescriptionSets(value).map((set, n) => {
                          if (i !== n) return set;
                          const next = { ...set };
                          if (key === "load" && !e.target.value)
                            delete next.load;
                          else next[key] = Number(e.target.value);
                          if (key === "reps") next.zone = zoneFor(next.reps);
                          return next;
                        });
                        onChange({
                          setPrescription: sets,
                          reps: sets[0].reps,
                          restTimeInSeconds: sets[0].restSeconds,
                        });
                      }}
                      className="mt-1 min-h-11 w-full rounded-lg border border-input bg-transparent px-2"
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </details>
      )}
    </fieldset>
  );
}
