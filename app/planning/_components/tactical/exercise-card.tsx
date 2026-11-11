import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Check, GripVertical, Link2, Minus, Plus, Trash2 } from "lucide-react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import {
  haptic,
  prescriptionSets,
  RUNES,
  ZONES,
  zoneFor,
  type Rune,
  type TacticalSet,
  type Zone,
} from "../../_lib/tactical";
import { OrbitalSwapMenu } from "./orbital-swap-menu";
import { AdvancedPrescriptionFields } from "../advanced-prescription-fields";
import { TacticalSheet } from "./tactical-sheet";

const TECHNIQUES: Record<Rune, string> = {
  DROP_SET: "Reduzir a carga e continuar a série.",
  REST_PAUSE: "Fazer pausas curtas entre blocos da mesma série.",
  ISOMETRIC_HOLD: "Sustentar a posição por 2 segundos.",
  CLUSTER_SET: "Dividir a série em pequenos blocos com pausas.",
  TEMPO_CONTROL: "Controlar a cadência de cada repetição.",
};
const zoneStyle: Record<Zone, string> = {
  strength: "border-rose-500/45",
  hypertrophy: "border-amber-500/35",
  endurance: "border-cyan-400/40",
};
const zoneLabel: Record<Zone, string> = {
  strength: "3–5",
  hypertrophy: "8–12",
  endurance: "15+",
};

export function ExerciseCard({
  item,
  index,
  slot,
  muscle,
  demand,
  fusionReady,
  runeOver,
  selectedRune,
  onApplyRune,
  onChange,
  onRemove,
  onMerge,
  candidates,
  grouped,
  onMove,
  canMoveDown,
  animationId,
}: {
  item: WorkoutPlanDraftExercise;
  index: number;
  slot: number;
  muscle: string;
  demand: "low" | "medium" | "high";
  fusionReady: boolean;
  runeOver: boolean;
  selectedRune: Rune | null;
  onApplyRune: () => void;
  onChange: (patch: Partial<WorkoutPlanDraftExercise>) => void;
  onRemove: () => void;
  onMerge: (target: number) => void;
  candidates: { index: number; name: string }[];
  grouped: boolean;
  onMove: (offset: -1 | 1) => void;
  canMoveDown: boolean;
  animationId?: string;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: `item:${index}`, data: { type: "item", index } });
  const [panel, setPanel] = useState<
    "techniques" | "combine" | "details" | null
  >(null);
  const sets = prescriptionSets(item),
    zone = sets[0]?.zone ?? zoneFor(item.reps);
  function updateSets(next: TacticalSet[]) {
    onChange({
      setPrescription: next,
      sets: next.length,
      reps: next[0].reps,
      restTimeInSeconds: next[0].restSeconds,
    });
  }
  function cycleZone() {
    const zones: Zone[] = ["strength", "hypertrophy", "endurance"],
      next = zones[(zones.indexOf(zone) + 1) % zones.length],
      config = ZONES[next];
    onChange({
      repsMin: next === "hypertrophy" ? 8 : null,
      repsMax: next === "hypertrophy" ? 12 : null,
      reps: config.reps,
      restTimeInSeconds: config.rest,
      setPrescription: sets.map((s) => ({
        ...s,
        zone: next,
        reps: config.reps,
        restSeconds: config.rest,
      })),
    });
    haptic();
  }
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <motion.article
        layout
        layoutId={animationId}
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: fusionReady || runeOver ? 1.015 : 1,
        }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
        aria-label={`Exercício ${index + 1}: ${item.name}`}
        className={`relative grid h-[92px] [@media(max-height:720px)]:h-20 grid-cols-[22px_minmax(0,1fr)_50px_66px] items-center gap-1.5 border bg-gradient-to-r from-zinc-900 to-zinc-950 px-2 shadow-lg ${grouped ? "border-transparent" : `rounded-xl ${zoneStyle[zone]}`} ${fusionReady || runeOver ? "z-10 border-dashed !border-cyan-300 ring-1 ring-cyan-300/40" : ""}`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${item.name}`}
          className="flex h-full touch-none flex-col items-center justify-center gap-1 text-zinc-500"
        >
          <span className="font-mono text-[11px] text-zinc-300">
            {String(slot + 1).padStart(2, "0")}
          </span>
          <span
            className={`h-5 w-1 rounded-full ${demand === "high" ? "bg-rose-400 shadow-[0_0_8px_#fb718566]" : demand === "medium" ? "bg-amber-300" : "bg-cyan-300"}`}
          />
          <GripVertical size={12} />
        </button>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel("details")}
              aria-label={`Editar ${item.name}`}
              className="min-w-0 flex-1 text-left"
            >
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-white sm:text-sm">
                {item.name || "Escolha no deck"}
              </span>
            </button>
            <OrbitalSwapMenu
              compact
              exerciseId={item.exerciseId}
              onSwap={(e) =>
                onChange({
                  name: e.name,
                  exerciseId: e.id,
                  alternative1ExerciseId: null,
                  alternative2ExerciseId: null,
                  alternative1Name: "",
                  alternative2Name: "",
                })
              }
            />
          </div>
          <p className="truncate text-[10px] text-zinc-500">
            {muscle || "Grupo não informado"}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              aria-label={`Técnicas de ${item.name}`}
              onClick={() => setPanel("techniques")}
              className={`min-h-7 min-w-0 truncate rounded-md px-1.5 text-[10px] ${item.runes?.length ? "bg-amber-400/15 text-amber-200" : "bg-white/5 text-zinc-300"}`}
            >
              {item.runes?.length
                ? `${RUNES[item.runes[0]]}${item.runes.length > 1 ? ` +${item.runes.length - 1}` : ""}`
                : "＋ Técnica"}
            </button>
            <button
              type="button"
              disabled={!candidates.length}
              aria-label={`Criar bi-set com ${item.name}`}
              onClick={() => setPanel("combine")}
              className="flex min-h-7 shrink-0 items-center gap-1 rounded-md bg-violet-400/10 px-1.5 text-[10px] text-violet-200 disabled:opacity-30"
            >
              <Link2 size={10} />
              {grouped ? "Combinar" : "Bi-set"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={cycleZone}
          aria-label={`Alternar zona de ${item.name}: ${ZONES[zone].label}`}
          className={`flex min-h-12 flex-col items-center justify-center rounded-lg text-[9px] ${zone === "strength" ? "bg-rose-500/15 text-rose-200" : zone === "hypertrophy" ? "bg-amber-500/15 text-amber-200" : "bg-cyan-400/15 text-cyan-200"}`}
        >
          <strong className="text-xs">{zoneLabel[zone]}</strong>
          <span>
            {zone === "hypertrophy"
              ? "Hiper"
              : zone === "endurance"
                ? "Metab"
                : "Força"}
          </span>
          <span className="text-[8px] opacity-65">
            {item.restTimeInSeconds}s ↻
          </span>
        </button>
        <div className="self-stretch py-2 [@media(max-height:720px)]:py-1">
          <div className="flex h-8 items-center justify-center gap-1 [@media(max-height:720px)]:h-7">
            <strong className="text-sm tabular-nums">{sets.length}</strong>
            <div
              className="flex max-h-7 flex-col-reverse gap-[2px]"
              aria-hidden="true"
            >
              {sets.slice(0, 6).map((_, i) => (
                <span
                  key={i}
                  className={`h-[2px] w-4 rounded-full ${zone === "hypertrophy" ? "bg-amber-300" : zone === "strength" ? "bg-rose-300" : "bg-cyan-300"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex">
            <button
              type="button"
              disabled={sets.length <= 1}
              onClick={() => updateSets(sets.slice(0, -1))}
              aria-label={`Remover série de ${item.name}`}
              className="flex h-11 w-8 items-center justify-center rounded-l-lg bg-white/5 text-zinc-400 disabled:opacity-25"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              disabled={sets.length >= 100}
              onClick={() => {
                updateSets([...sets, { ...sets[sets.length - 1] }]);
                haptic();
              }}
              aria-label={`Adicionar série a ${item.name}`}
              className="flex h-11 w-8 items-center justify-center rounded-r-lg bg-cyan-300/10 text-cyan-200 disabled:opacity-25"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        {selectedRune && (
          <button
            type="button"
            onClick={onApplyRune}
            aria-label={`Aplicar ${RUNES[selectedRune]} em ${item.name}`}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-dashed border-cyan-300 bg-zinc-950/85 text-xs font-semibold text-cyan-200"
          >
            Aplicar {RUNES[selectedRune]} aqui
          </button>
        )}
        {(fusionReady || runeOver) && (
          <span className="pointer-events-none absolute inset-x-4 top-1 z-30 rounded-md bg-cyan-300 px-2 py-1 text-center text-[10px] font-semibold text-zinc-950">
            {runeOver
              ? "Solte para aplicar técnica"
              : "Solte para fundir bi-set"}
          </span>
        )}
      </motion.article>
      <TacticalSheet
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={
          panel === "techniques"
            ? "Técnicas do exercício"
            : panel === "combine"
              ? "Criar bi-set"
              : "Ajustar exercício"
        }
        description={
          panel === "combine"
            ? `Combine ${item.name} com outro exercício para executá-los em sequência.`
            : item.name
        }
      >
        {panel === "techniques" && (
          <>
            <p className="text-xs text-zinc-400">
              Toque para marcar ou desmarcar. Vale apenas para este exercício.
            </p>
            {(Object.keys(RUNES) as Rune[]).map((r) => {
              const active = item.runes?.includes(r) ?? false;
              return (
                <button
                  type="button"
                  key={r}
                  aria-pressed={active}
                  onClick={() => {
                    onChange({
                      runes: active
                        ? item.runes?.filter((x) => x !== r)
                        : [...(item.runes ?? []), r],
                    });
                    haptic();
                  }}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left ${active ? "border-amber-300/60 bg-amber-300/10" : "border-white/10 bg-white/[.03]"}`}
                >
                  <span className="flex-1">
                    <span className="text-sm font-semibold">{RUNES[r]}</span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      {TECHNIQUES[r]}
                    </span>
                  </span>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border ${active ? "border-amber-300 bg-amber-300 text-zinc-950" : "border-zinc-600"}`}
                  >
                    {active && <Check size={14} />}
                  </span>
                </button>
              );
            })}
          </>
        )}
        {panel === "combine" && (
          <>
            <p className="rounded-xl bg-violet-400/10 p-3 text-xs leading-relaxed text-violet-200">
              Selecione o parceiro. Os dois aparecerão juntos em um único bloco.
            </p>
            {candidates.map((e) => (
              <button
                type="button"
                key={e.index}
                onClick={() => {
                  onMerge(e.index);
                  setPanel(null);
                  haptic();
                }}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-sm"
                aria-label={`Combinar com ${e.name}`}
              >
                <span>
                  {String(e.index + 1).padStart(2, "0")} · {e.name}
                </span>
                <Link2 size={16} className="shrink-0 text-violet-300" />
              </button>
            ))}
          </>
        )}
        {panel === "details" && (
          <>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                disabled={!index}
                onClick={() => {
                  onMove(-1);
                  setPanel(null);
                }}
                className="min-h-11 flex-1 rounded-xl bg-white/5 disabled:opacity-30"
              >
                ↑ Mover acima
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={() => {
                  onMove(1);
                  setPanel(null);
                }}
                className="min-h-11 flex-1 rounded-xl bg-white/5 disabled:opacity-30"
              >
                ↓ Mover abaixo
              </button>
            </div>
            <p className="text-xs text-zinc-400">Prescrição por série</p>
            {sets.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[18px_1fr_1fr_1fr] items-end gap-2 text-[10px]"
              >
                <span className="pb-3 text-zinc-500">{i + 1}</span>
                {(["reps", "restSeconds", "load"] as const).map((key) => (
                  <label key={key}>
                    {key === "reps"
                      ? "Reps"
                      : key === "load"
                        ? "Carga kg"
                        : "Descanso s"}
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
                        if (key === "load" && !e.target.value) delete next.load;
                        else next[key] = Number(e.target.value);
                        updateSets(sets.map((v, n) => (n === i ? next : v)));
                      }}
                      className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 text-sm text-white"
                    />
                  </label>
                ))}
              </div>
            ))}
            <AdvancedPrescriptionFields value={item} onChange={onChange} />
            <button
              type="button"
              onClick={() => {
                setPanel(null);
                onRemove();
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-sm text-rose-300"
            >
              <Trash2 size={16} />
              Remover exercício
            </button>
          </>
        )}
      </TacticalSheet>
    </div>
  );
}
