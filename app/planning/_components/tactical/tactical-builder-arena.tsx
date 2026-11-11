"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import { Dumbbell, Plus, Search, Zap } from "lucide-react";
import { useExerciseCatalog } from "@/app/_lib/hooks/use-exercise-catalog";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import {
  createDraftExercise,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "../../_lib/workout-plan-builder";
import {
  haptic,
  mergeExercises,
  normalizeGroups,
  reorderExercises,
  patchExercise,
  tacticalMetadata,
  telemetry,
  unmergeExercises,
  RUNES,
  type Rune,
} from "../../_lib/tactical";
import { TelemetryHeader } from "./telemetry-header";
import { BodyHeatmapSVG } from "./body-heatmap-svg";
import { AttributeRadarChart } from "./attribute-radar-chart";
import { RuneBadgeDock } from "./rune-badge-dock";
import { ExerciseCard } from "./exercise-card";

const FILTERS = [
  { label: "Todos", groups: [] },
  { label: "Peito", groups: ["CHEST"] },
  { label: "Costas", groups: ["BACK"] },
  {
    label: "Pernas",
    groups: ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ADDUCTORS"],
  },
  { label: "Ombros", groups: ["SHOULDERS"] },
  { label: "Braços", groups: ["BICEPS", "TRICEPS", "FOREARMS"] },
  { label: "Core", groups: ["CORE"] },
  { label: "Potência", groups: ["POWER"] },
];
function subscribeDesktop(listener: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const desktopSnapshot = () => window.matchMedia("(min-width: 1024px)").matches;
function DeckCard({
  entry,
  selected,
  onSelect,
}: {
  entry: ListExercises200Item;
  selected: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `deck:${entry.id}`,
    data: { type: "deck", entry },
  });
  const meta = tacticalMetadata(entry);
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex min-h-48 w-40 shrink-0 snap-start flex-col rounded-2xl border bg-gradient-to-br from-slate-800 to-slate-950 p-3 text-left transition-colors hover:border-cyan-300/60 ${selected ? "border-cyan-300 ring-1 ring-cyan-300" : "border-slate-700"}`}
      style={{ touchAction: "pan-x pan-y" }}
    >
      <span
        className={`self-start rounded-md px-2 py-1 text-[9px] uppercase tracking-wider ${meta.cnsDemand === "high" ? "bg-orange-500/15 text-orange-200" : "bg-cyan-300/10 text-cyan-200"}`}
      >
        SNC{" "}
        {meta.cnsDemand === "high"
          ? "alto"
          : meta.cnsDemand === "medium"
            ? "médio"
            : "baixo"}
      </span>
      <Dumbbell className="my-4 size-9 text-slate-500" strokeWidth={1} />
      <span className="mt-auto text-xs font-semibold leading-relaxed text-slate-100">
        {entry.name}
      </span>
      <span className="mt-2 text-[10px] text-cyan-200/80">
        {meta.primaryMuscles.map(getMuscleGroupLabel).join(" · ") ||
          "Grupo não informado"}
      </span>
      <span className="mt-1 text-[9px] text-slate-500">{meta.equipment}</span>
    </button>
  );
}
function DropSlot({
  onClick,
  selected,
}: {
  onClick: () => void;
  selected: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "append" });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`flex min-h-24 w-full items-center justify-center gap-2 rounded-2xl border border-dashed text-xs ${isOver || selected ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-slate-700 text-slate-400"}`}
    >
      <Plus size={18} />
      {selected
        ? "Inserir carta selecionada"
        : "Arraste uma carta ou selecione no deck"}
    </button>
  );
}
export function TacticalBuilderArena({
  day,
  onChange,
  disabled = false,
}: {
  day: WorkoutPlanDraftDay;
  onChange: (patch: Partial<WorkoutPlanDraftDay>) => void;
  disabled?: boolean;
}) {
  const { exercises: catalog, isSyncing, refresh } = useExerciseCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(0);
  const [selected, setSelected] = useState<ListExercises200Item | null>(null);
  const [rune, setRune] = useState<Rune | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [fusion, setFusion] = useState<number | null>(null);
  const [impact, setImpact] = useState(0);
  const reduced = useReducedMotion();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    desktopSnapshot,
    () => false,
  );
  const hover = useRef<{ target: number; since: number } | null>(null);
  const data = useMemo(
    () => telemetry(day.exercises, catalog),
    [day.exercises, catalog],
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const entries = useMemo(
    () =>
      catalog.filter(
        (e) =>
          e.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
          (!filter || FILTERS[filter].groups.includes("POWER")
            ? !filter || tacticalMetadata(e).attributeWeights.power === 10
            : e.muscles.some(
                (m) =>
                  m.role === "PRIMARY" &&
                  FILTERS[filter].groups.includes(m.muscleGroup),
              )),
      ),
    [catalog, query, filter],
  );
  function commit(items: WorkoutPlanDraftExercise[]) {
    const exercises = normalizeGroups(items);
    onChange({
      exercises,
      estimatedDurationInMinutes: Math.max(
        1,
        telemetry(exercises, catalog).minutes,
      ),
    });
  }
  function update(index: number, patch: Partial<WorkoutPlanDraftExercise>) {
    commit(
      day.exercises.map((e, i) => (i === index ? patchExercise(e, patch) : e)),
    );
  }
  function add(entry: ListExercises200Item, target?: number, merge = false) {
    const item = {
      ...createDraftExercise(),
      name: entry.name,
      exerciseId: entry.id,
    };
    // Replace the editor's empty starter slot, without discarding any filled prescription.
    const empty = day.exercises.findIndex((e) => !e.name && !e.exerciseId);
    let items = [...day.exercises];
    const index = empty >= 0 ? empty : items.length;
    if (empty >= 0) items[empty] = item;
    else items.push(item);
    if (target !== undefined && merge && target !== index)
      items = mergeExercises(items, index, target);
    else if (target !== undefined && target !== index)
      items = arrayMove(items, index, target);
    commit(items);
    setSelected(null);
    setAnnouncement(`${entry.name} adicionado`);
    haptic(20);
    if (tacticalMetadata(entry).cnsDemand === "high" && !reduced)
      setImpact((n) => n + 1);
  }
  function apply(index: number) {
    if (rune) {
      update(index, {
        runes: Array.from(
          new Set([...(day.exercises[index].runes ?? []), rune]),
        ),
      });
      setAnnouncement(`${RUNES[rune]} aplicada`);
      setRune(null);
      haptic();
    } else if (selected) add(selected, index, true);
    else setAnnouncement("Selecione uma carta ou técnica no deck primeiro.");
  }
  function moving(event: DragMoveEvent) {
    const index = event.over?.data.current?.index as number | undefined;
    const source = event.active.data.current;
    const rect = event.active.rect.current.translated;
    const over = event.over?.rect;
    // A deliberate central hover distinguishes fusion from ordinary sorting.
    const center = rect && over ? rect.top + rect.height / 2 : 0;
    const inCenter =
      over &&
      center > over.top + over.height * 0.25 &&
      center < over.bottom - over.height * 0.25;
    if (
      index === undefined ||
      source?.index === index ||
      source?.type === "rune" ||
      !inCenter
    ) {
      hover.current = null;
      setFusion(null);
      return;
    }
    if (hover.current?.target !== index) {
      hover.current = { target: index, since: Date.now() };
      setFusion(null);
    }
  }
  // Timed hover also fires when the pointer is held still.
  useEffect(() => {
    if (!dragLabel) return;
    const timer = setInterval(() => {
      if (hover.current && Date.now() - hover.current.since >= 300)
        setFusion(hover.current.target);
    }, 80);
    return () => clearInterval(timer);
  }, [dragLabel]);
  function dropped(event: DragEndEvent) {
    const source = event.active.data.current;
    const target = event.over?.data.current?.index as number | undefined;
    const merge =
      target !== undefined &&
      hover.current?.target === target &&
      Date.now() - hover.current.since >= 300;
    setDragLabel(null);
    setFusion(null);
    hover.current = null;
    if (!event.over || !source) return;
    if (source.type === "deck") add(source.entry, target, merge);
    if (source.type === "rune" && target !== undefined) {
      update(target, {
        runes: Array.from(
          new Set([
            ...(day.exercises[target].runes ?? []),
            source.rune as Rune,
          ]),
        ),
      });
      haptic();
    }
    if (
      source.type === "item" &&
      target !== undefined &&
      source.index !== target
    ) {
      commit(
        merge
          ? mergeExercises(day.exercises, source.index, target)
          : reorderExercises(day.exercises, source.index, target),
      );
      haptic();
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <fieldset
        disabled={disabled}
        className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950 p-3 text-slate-100 sm:p-5"
      >
        <legend className="sr-only">Arena tática de {day.name}</legend>
        <DndContext
          sensors={sensors}
          collisionDetection={(args) =>
            args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)
          }
          onDragStart={(e) => {
            const source = e.active.data.current;
            setDragLabel(
              source?.type === "rune"
                ? RUNES[source.rune as Rune]
                : (source?.entry?.name ??
                    day.exercises[source?.index]?.name ??
                    "Carta"),
            );
          }}
          onDragMove={moving}
          onDragOver={moving}
          onDragEnd={dropped}
          onDragCancel={() => {
            setDragLabel(null);
            setFusion(null);
            hover.current = null;
          }}
        >
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-cyan-300">
            <Zap size={14} /> Tactical workout builder{" "}
            <span className="ml-auto text-slate-500">
              {day.exercises.filter((e) => e.name).length} cartas
            </span>
          </div>
          <TelemetryHeader data={data} />
          <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[210px_1fr]">
            <details
              open={desktop}
              className="h-fit rounded-2xl border border-slate-800 bg-slate-900/40 p-3"
            >
              <summary className="cursor-pointer py-2 text-xs font-semibold text-slate-300">
                Biofeedback ilustrativo
              </summary>
              <BodyHeatmapSVG volumes={data.muscles} />
              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-[10px] tracking-widest text-slate-400">
                  PERFIL DO TREINO
                </p>
                <AttributeRadarChart values={data.attributes} />
                <p className="text-[10px] text-slate-500">
                  Atributos e custo SNC são heurísticas editoriais.
                </p>
              </div>
            </details>
            <motion.div
              key={`${day.clientId ?? day.name}-${impact}`}
              animate={impact && !reduced ? { x: [0, -2, 2, 0] } : { x: 0 }}
              className="relative max-h-[65vh] min-w-0 space-y-3 overflow-y-auto overscroll-contain pr-1"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 500 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 top-12 h-[80%] w-full opacity-15"
              >
                <polyline
                  points={day.exercises
                    .map(
                      (e, i) =>
                        `${(i * 500) / Math.max(1, day.exercises.length - 1)},${95 - Math.min(85, e.sets * 8 + (e.runes?.length ?? 0) * 8)}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
              </svg>
              <SortableContext
                items={day.exercises.map((_, i) => `item:${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence initial={false}>
                  {day.exercises.map((e, i) => (
                    <ExerciseCard
                      key={`${e.id ?? e.exerciseId ?? "empty"}-${i}`}
                      item={e}
                      index={i}
                      fusionReady={fusion === i}
                      onChange={(patch) => update(i, patch)}
                      onRemove={() =>
                        commit(day.exercises.filter((_, n) => i !== n))
                      }
                      onApply={() => apply(i)}
                      onMerge={
                        i
                          ? () =>
                              commit(mergeExercises(day.exercises, i, i - 1))
                          : undefined
                      }
                      onUnmerge={() =>
                        commit(
                          unmergeExercises(day.exercises, e.supersetGroupId!),
                        )
                      }
                      canMoveDown={i < day.exercises.length - 1}
                      onMove={(offset) =>
                        commit(reorderExercises(day.exercises, i, i + offset))
                      }
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
              <DropSlot
                selected={!!selected}
                onClick={() =>
                  selected
                    ? add(selected)
                    : setAnnouncement(
                        "Selecione uma carta no deck para inserir.",
                      )
                }
              />
            </motion.div>
          </div>
          <div className="mt-6 min-w-0 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-3 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-widest">
                SEU DECK
              </h3>
              <span className="text-[10px] text-slate-400">
                {entries.length} disponíveis
              </span>
            </div>
            <label className="mb-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
              <Search size={15} className="text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar exercício…"
                aria-label="Buscar no deck"
                className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((f, i) => (
                <button
                  type="button"
                  key={f.label}
                  aria-pressed={filter === i}
                  onClick={() => setFilter(i)}
                  className={`min-h-10 shrink-0 rounded-full px-3 text-xs ${filter === i ? "bg-cyan-300 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div
              className="flex snap-x gap-3 overflow-x-auto pb-3"
              onWheel={(e) => {
                if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX))
                  e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              {entries.slice(0, 80).map((e) => (
                <DeckCard
                  key={e.id}
                  entry={e}
                  selected={selected?.id === e.id}
                  onSelect={() => {
                    setSelected(selected?.id === e.id ? null : e);
                    setRune(null);
                  }}
                />
              ))}
              {!entries.length && (
                <div className="py-6 text-xs text-slate-400">
                  {isSyncing
                    ? "Carregando catálogo…"
                    : "Nenhum exercício encontrado."}
                  <button
                    type="button"
                    onClick={() => void refresh(true)}
                    className="ml-2 min-h-11 text-cyan-300"
                  >
                    Atualizar catálogo
                  </button>
                </div>
              )}
            </div>
            {entries.length > 80 && (
              <p className="mb-2 text-[10px] text-slate-400">
                Exibindo 80 cartas. Refine a busca para encontrar mais.
              </p>
            )}
            <p className="my-2 text-[10px] text-slate-400">
              Arraste ou toque na carta e no slot. Para técnicas, selecione e
              use “Aplicar seleção”.
            </p>
            <RuneBadgeDock
              selected={rune}
              onSelect={(r) => {
                setRune(rune === r ? null : r);
                setSelected(null);
              }}
            />
            {(selected || rune) && (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-cyan-200">
                <span>{selected?.name ?? (rune && RUNES[rune])}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setRune(null);
                  }}
                  className="min-h-11 px-2"
                >
                  Cancelar seleção
                </button>
              </div>
            )}
          </div>
          <DragOverlay>
            {dragLabel ? (
              <div className="max-w-56 rounded-2xl border border-cyan-300 bg-slate-900 p-4 text-sm text-cyan-100 shadow-xl shadow-cyan-500/20">
                {dragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-xs text-cyan-200"
        >
          {announcement}
        </p>
      </fieldset>
    </MotionConfig>
  );
}
