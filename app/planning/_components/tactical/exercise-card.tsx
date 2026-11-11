import { Popover } from "radix-ui";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, GripVertical, Link2, Minus, Plus, Trash2 } from "lucide-react";
import type { WorkoutPlanDraftExercise } from "../../_lib/workout-plan-builder";
import {
  haptic,
  cycleRune,
  runeLabel,
  toggleRune,
  RUNE_COLORS,
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
  dragRune,
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
  dragRune?: Rune | null;
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
  const [panel, setPanel] = useState<"combine" | "details" | null>(null);
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  const tint = (runeOver ? dragRune : selectedRune) ?? null;
  function changeRune(patch: Partial<WorkoutPlanDraftExercise>) {
    onChange(patch);
    setPulse((p) => p + 1);
    haptic(15);
  }
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
        style={
          tint
            ? {
                borderColor: RUNE_COLORS[tint],
                boxShadow: `0 0 18px ${RUNE_COLORS[tint]}40`,
              }
            : undefined
        }
        aria-label={`Exercício ${index + 1}: ${item.name}`}
        className={`relative grid min-h-[72px] grid-cols-[20px_minmax(0,1fr)_52px_90px] sm:grid-cols-[28px_minmax(0,1fr)_88px_120px] items-center gap-2 border bg-gradient-to-r from-zinc-900 to-zinc-950 px-2 py-1 shadow-lg ${grouped ? "border-transparent" : `rounded-xl ${zoneStyle[zone]}`} ${fusionReady || runeOver ? "z-10 border-dashed ring-1 ring-white/20" : ""}`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${item.name}`}
          className="flex h-full touch-none flex-col items-center justify-center gap-0.5 text-zinc-500"
        >
          <span className="font-mono text-[11px] text-zinc-300">
            {String(slot + 1).padStart(2, "0")}
          </span>
          <span
            className={`h-4 w-1 rounded-full ${demand === "high" ? "bg-rose-400 shadow-[0_0_8px_#fb718566]" : demand === "medium" ? "bg-amber-300" : "bg-cyan-300"}`}
          />
          <GripVertical size={12} />
        </button>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel("details")}
              aria-label={`Editar ${item.name}`}
              className="min-w-0 text-left"
            >
              <span className="block truncate text-xs font-semibold leading-tight text-white sm:text-sm">
                {item.name || "Escolha no deck"}
              </span>
            </button>
            <span className="hidden max-w-28 truncate text-[10px] text-zinc-500 xl:block">
              ● {muscle}
            </span>
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
          <div
            className="no-scrollbar mt-1 flex items-center gap-1 overflow-x-auto"
            aria-label={`Técnicas aplicadas a ${item.name}`}
          >
            <AnimatePresence initial={false}>
              {(item.runes ?? []).map((r) => (
                <motion.span
                  key={r}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="flex shrink-0 items-center rounded-md border border-current/20 bg-white/5 text-[10px]"
                  style={{ color: RUNE_COLORS[r] }}
                >
                  <button
                    type="button"
                    onClick={() => changeRune(cycleRune(item, r))}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      changeRune(toggleRune(item, r));
                    }}
                    title="Toque para alternar parâmetros"
                    className="h-7 px-1.5"
                  >
                    {runeLabel(item, r)}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${RUNES[r]} de ${item.name}`}
                    onClick={() => changeRune(toggleRune(item, r))}
                    className="h-7 w-6 border-l border-current/20"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label={`Técnicas de ${item.name}`}
                  className="h-7 shrink-0 rounded-md border border-dashed border-white/20 px-1.5 text-[10px] text-zinc-400"
                >
                  + Técnica
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="top"
                  align="start"
                  sideOffset={8}
                  aria-label="Técnicas do exercício"
                  className="dark z-[80] w-64 rounded-xl border border-white/15 bg-zinc-900 p-2 text-white shadow-2xl"
                >
                  {(Object.keys(RUNES) as Rune[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      aria-pressed={item.runes?.includes(r) ?? false}
                      onClick={() => changeRune(toggleRune(item, r))}
                      className="flex min-h-10 w-full items-center justify-between rounded-lg px-2 text-xs hover:bg-white/5"
                      style={{ color: RUNE_COLORS[r] }}
                      title={TECHNIQUES[r]}
                    >
                      {RUNES[r]}
                      {item.runes?.includes(r) && <Check size={14} />}
                    </button>
                  ))}
                  <Popover.Close className="mt-1 h-8 w-full rounded-lg bg-white/5 text-xs">
                    Concluir
                  </Popover.Close>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <button
              type="button"
              disabled={!candidates.length}
              aria-label={`Criar bi-set com ${item.name}`}
              onClick={() => {
                const next = candidates.find((c) => c.index === index + 1);
                if (next) {
                  onMerge(next.index);
                  haptic();
                } else setPanel("combine");
              }}
              className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-violet-400/10 px-1.5 text-[10px] text-violet-200 disabled:opacity-30"
            >
              <Link2 size={10} />
              Bi-set
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
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={sets.length <= 1}
            onClick={() => updateSets(sets.slice(0, -1))}
            aria-label={`Remover série de ${item.name}`}
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400 disabled:opacity-25"
          >
            <Minus size={12} />
          </button>
          <strong className="min-w-4 text-center text-sm tabular-nums">
            {sets.length}
          </strong>
          <button
            type="button"
            disabled={sets.length >= 100}
            onClick={() => {
              updateSets([...sets, { ...sets[sets.length - 1] }]);
              haptic();
            }}
            aria-label={`Adicionar série a ${item.name}`}
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200 disabled:opacity-25"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            aria-label={`Remover exercício ${item.name}`}
            onClick={onRemove}
            className="hidden h-9 w-5 text-zinc-500 hover:text-rose-300 sm:block"
          >
            ×
          </button>
        </div>
        <AnimatePresence>
          {pulse > 0 && !reduced && (
            <motion.span
              key={pulse}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-white"
            />
          )}
        </AnimatePresence>
        {selectedRune && (
          <button
            type="button"
            onClick={() => {
              onApplyRune();
              setPulse((p) => p + 1);
            }}
            aria-label={`Aplicar ${RUNES[selectedRune]} em ${item.name}`}
            aria-pressed={item.runes?.includes(selectedRune) ?? false}
            style={{ borderColor: RUNE_COLORS[selectedRune] }}
            className="absolute inset-0 z-20 rounded-xl border border-dashed bg-transparent"
          >
            <span className="sr-only">
              Aplicar ou remover {RUNES[selectedRune]}
            </span>
          </button>
        )}
        {(fusionReady || runeOver) && (
          <span className="pointer-events-none absolute inset-x-4 top-1 z-30 rounded-md bg-cyan-300 px-2 py-1 text-center text-[10px] font-semibold text-zinc-950">
            {runeOver
              ? `Encaixar ${dragRune ? runeLabel(item, dragRune) : "técnica"}`
              : "Solte para fundir bi-set"}
          </span>
        )}
      </motion.article>
      <TacticalSheet
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={panel === "combine" ? "Criar bi-set" : "Ajustar exercício"}
        description={
          panel === "combine"
            ? `Combine ${item.name} com outro exercício para executá-los em sequência.`
            : item.name
        }
      >
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
