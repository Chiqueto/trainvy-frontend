import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import {
  haptic,
  prescriptionSets,
  RUNES,
  ZONES,
  type TacticalSet,
  type Zone,
} from "../../_lib/tactical";
import { OrbitalSwapMenu } from "./orbital-swap-menu";
import { AdvancedPrescriptionFields } from "../advanced-prescription-fields";

export function ExerciseCard({
  item,
  index,
  fusionReady,
  onChange,
  onRemove,
  onApply,
  onMerge,
  onUnmerge,
  onMove,
  canMoveDown,
}: {
  item: WorkoutPlanDraftExercise;
  index: number;
  fusionReady: boolean;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onRemove: () => void;
  onApply: () => void;
  onMerge?: () => void;
  onUnmerge: () => void;
  onMove: (offset: -1 | 1) => void;
  canMoveDown: boolean;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: `item:${index}`, data: { type: "item", index } });
  const sets = prescriptionSets(item);
  function updateSets(next: TacticalSet[]) {
    onChange({
      setPrescription: next,
      sets: next.length,
      reps: next[0].reps,
      restTimeInSeconds: next[0].restSeconds,
    });
  }
  function zone(value: Zone) {
    onChangeZone(value);
  }
  function onChangeZone(value: Zone) {
    const config = ZONES[value];
    onChange({
      repsMin: value === "hypertrophy" ? 8 : null,
      repsMax: value === "hypertrophy" ? 12 : null,
      reps: config.reps,
      restTimeInSeconds: config.rest,
      setPrescription: sets.map((s) => ({
        ...s,
        zone: value,
        reps: config.reps,
        restSeconds: config.rest,
      })),
    });
  }
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <motion.article
        layout
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={`relative rounded-2xl border bg-slate-900/95 p-4 shadow-lg ${fusionReady ? "border-amber-300 shadow-amber-400/20" : item.supersetGroupId ? "border-violet-400/60 shadow-violet-500/10" : "border-slate-700/80"}`}
      >
        {fusionReady && (
          <p
            role="status"
            className="mb-2 text-xs font-semibold text-amber-200"
          >
            ⚡ Solte para fundir em Bi-set
          </p>
        )}
        {item.supersetGroupId && (
          <div className="mb-3 flex items-center justify-between border-b border-violet-300/20 pb-2 text-[10px] uppercase tracking-widest text-violet-200">
            <span>⛓ Grupo combinado</span>
            <button type="button" onClick={onUnmerge} className="min-h-8">
              Desfazer fusão
            </button>
          </div>
        )}
        <div className="flex items-start gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Arrastar ${item.name}`}
            className="flex size-11 shrink-0 touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <GripVertical size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-widest text-cyan-300">
              SLOT {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-1 text-sm font-semibold">
              {item.name || "Selecione um exercício"}
            </h3>
          </div>
          <button
            type="button"
            aria-label={`Remover ${item.name}`}
            onClick={onRemove}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="my-3 flex items-center justify-between rounded-xl bg-slate-950/60 p-2">
          <button
            type="button"
            aria-label={`Remover série de ${item.name}`}
            disabled={sets.length <= 1}
            onClick={() => updateSets(sets.slice(0, -1))}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-30"
          >
            <Minus size={16} />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">
              {sets.length}
              <span className="ml-1 text-xs font-normal text-slate-400">
                séries
              </span>
            </p>
            <div className="mt-1 flex max-w-40 flex-wrap justify-center gap-1">
              {sets.map((_, i) => (
                <span key={i} className="h-1 w-3 rounded bg-cyan-300" />
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Adicionar série a ${item.name}`}
            disabled={sets.length >= 100}
            onClick={() => {
              updateSets([...sets, { ...sets[sets.length - 1] }]);
              haptic();
            }}
            className="flex size-11 items-center justify-center rounded-lg text-cyan-300 hover:bg-slate-800"
          >
            <Plus size={16} />
          </button>
        </div>
        <div
          role="group"
          aria-label="Zona de repetições"
          className="flex gap-1 rounded-xl bg-slate-950 p-1"
        >
          {(Object.keys(ZONES) as Zone[]).map((z) => (
            <button
              type="button"
              key={z}
              aria-pressed={sets.every((s) => s.zone === z)}
              onClick={() => zone(z)}
              className={`min-h-11 flex-1 rounded-lg px-1 text-[11px] transition-colors ${sets.every((s) => s.zone === z) ? (z === "hypertrophy" ? "bg-orange-500/20 text-orange-200" : "bg-cyan-400/15 text-cyan-200") : "text-slate-400"}`}
            >
              {ZONES[z].label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            {item.repsMin && item.repsMax
              ? `${item.repsMin}–${item.repsMax}`
              : item.reps}{" "}
            reps · {item.restTimeInSeconds}s
          </span>
          <OrbitalSwapMenu
            exerciseId={item.exerciseId}
            onSwap={(e) =>
              onChange({
                exerciseId: e.id,
                name: e.name,
                alternative1ExerciseId: null,
                alternative2ExerciseId: null,
                alternative1Name: "",
                alternative2Name: "",
              })
            }
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {item.runes?.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() =>
                onChange({ runes: item.runes?.filter((x) => x !== r) })
              }
              className="min-h-9 rounded-lg border border-amber-300/30 bg-amber-300/10 px-2 text-[10px] text-amber-200"
              aria-label={`Remover ${RUNES[r]}`}
            >
              {RUNES[r]} ×
            </button>
          ))}
        </div>
        <details className="mt-2 rounded-xl border border-slate-700 p-2">
          <summary className="cursor-pointer py-2 text-xs text-slate-300">
            Ajuste fino · reps, carga e descanso
          </summary>
          <div className="mt-2 space-y-2">
            {sets.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[20px_1fr_1fr_1fr] items-end gap-2 text-[10px]"
              >
                <span className="pb-3 text-slate-400">{i + 1}</span>
                {(["reps", "restSeconds", "load"] as const).map((key) => (
                  <label key={key}>
                    {key === "reps"
                      ? "Reps"
                      : key === "load"
                        ? "Kg"
                        : "Pausa (s)"}
                    <input
                      aria-label={`${key === "reps" ? "Repetições" : key === "load" ? "Carga" : "Descanso"} série ${i + 1}`}
                      type="number"
                      min={key === "load" ? 0 : 1}
                      max={
                        key === "load" ? 2000 : key === "reps" ? 10000 : 86400
                      }
                      step={key === "load" ? 0.5 : 1}
                      value={s[key] ?? ""}
                      onChange={(e) => {
                        const next = { ...s };
                        if (key === "load" && e.target.value === "")
                          delete next.load;
                        else next[key] = Number(e.target.value);
                        updateSets(sets.map((v, n) => (n === i ? next : v)));
                      }}
                      className="mt-1 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs text-white"
                    />
                  </label>
                ))}
              </div>
            ))}
            <AdvancedPrescriptionFields value={item} onChange={onChange} />
          </div>
        </details>
        <div className="mt-2 flex flex-wrap justify-between gap-1 text-[11px]">
          <button
            type="button"
            onClick={onApply}
            className="min-h-11 px-2 text-cyan-300"
          >
            Aplicar seleção
          </button>
          {onMerge && (
            <button
              type="button"
              onClick={onMerge}
              className="min-h-11 px-2 text-violet-200"
            >
              Fundir com anterior
            </button>
          )}
          <button
            type="button"
            disabled={!index}
            onClick={() => onMove(-1)}
            aria-label={`Mover ${item.name} para cima`}
            className="min-h-11 px-2 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
            aria-label={`Mover ${item.name} para baixo`}
            className="min-h-11 px-2 disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </motion.article>
    </div>
  );
}
