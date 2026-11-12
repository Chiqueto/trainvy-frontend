"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  LayoutGroup,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Dumbbell,
  Link2,
  Plus,
  Search,
  X,
  PersonStanding,
  Cable,
  Minus,
} from "lucide-react";
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
  toggleRune,
  mergeExercises,
  normalizeGroups,
  reorderExercises,
  patchExercise,
  tacticalMetadata,
  telemetry,
  unmergeExercises,
  RUNES,
  RUNE_COLORS,
  type Rune,
} from "../../_lib/tactical";
import { TrainingBioPanel, TrainingBioDetails } from "./training-bio-panel";
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
const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const muscleColors: Record<string, string> = {
  CHEST: "#fb7185",
  BACK: "#38bdf8",
  SHOULDERS: "#c084fc",
  BICEPS: "#fbbf24",
  TRICEPS: "#fbbf24",
  FOREARMS: "#fbbf24",
  CORE: "#2dd4bf",
  QUADRICEPS: "#a3e635",
  HAMSTRINGS: "#a3e635",
  GLUTES: "#a3e635",
  CALVES: "#a3e635",
  ADDUCTORS: "#a3e635",
};
function DeckCard({
  entry,
  onAdd,
  animationId,
  justAdded,
}: {
  entry: ListExercises200Item;
  onAdd: () => void;
  animationId?: string;
  justAdded: boolean;
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `deck:${entry.id}`,
    data: { type: "deck", entry },
  });
  const meta = tacticalMetadata(entry),
    color =
      meta.cnsDemand === "high"
        ? "text-rose-300"
        : meta.cnsDemand === "medium"
          ? "text-amber-200"
          : "text-cyan-200";
  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      layoutId={animationId}
      onClick={onAdd}
      aria-label={`Adicionar ${entry.name}`}
      animate={{ y: justAdded ? -3 : 0 }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -6, scale: 1.03 }}
      title={entry.name}
      className="relative flex h-[120px] w-[136px] shrink-0 snap-start flex-col rounded-xl border border-white/15 bg-gradient-to-b from-zinc-800/80 to-zinc-950 p-2 shadow-lg hover:border-[var(--muscle-color)]"
      style={
        {
          touchAction: "pan-x pan-y",
          "--muscle-color": muscleColors[meta.primaryMuscles[0]] ?? "#94a3b8",
        } as CSSProperties
      }
    >
      <div
        className={`flex w-full items-center justify-between text-[9px] ${color}`}
      >
        <span aria-label={`Custo SNC ${meta.cnsDemand}`}>
          {meta.cnsDemand === "high"
            ? "ϟϟϟ"
            : meta.cnsDemand === "medium"
              ? "ϟϟ"
              : "ϟ"}
        </span>
        <span className="max-w-20 truncate rounded bg-white/5 px-1 text-[9px] uppercase">
          {meta.primaryMuscles.map(getMuscleGroupLabel).join(" · ")}
        </span>
        <Plus size={12} />
      </div>
      <div
        className={`relative mx-auto my-auto flex h-8 w-12 items-center justify-center ${color}`}
      >
        <span className="absolute inset-0 rounded-full bg-current opacity-10 blur-xl" />
        {meta.equipment === "Barra" ? (
          <Minus size={30} />
        ) : meta.equipment === "Máquina / cabo" ? (
          <Cable size={30} />
        ) : meta.equipment === "Halteres" ? (
          <Dumbbell size={30} strokeWidth={1.1} />
        ) : (
          <PersonStanding size={30} />
        )}
      </div>
      <span className="line-clamp-2 min-h-8 w-full shrink-0 text-center text-xs font-medium leading-4 text-white">
        {entry.name}
      </span>
    </motion.button>
  );
}
function DropSlot() {
  const { setNodeRef, isOver } = useDroppable({ id: "append" });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed text-[10px] ${isOver ? "border-cyan-300 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-zinc-500"}`}
    >
      <Plus size={13} />
      Toque numa carta abaixo para adicionar
    </div>
  );
}
export function TacticalBuilderArena({
  day,
  onChange,
  disabled = false,
  navigation,
  actions,
  title,
  settingsAction,
}: {
  day: WorkoutPlanDraftDay;
  onChange: (patch: Partial<WorkoutPlanDraftDay>) => void;
  disabled?: boolean;
  navigation?: ReactNode;
  actions?: ReactNode;
  title?: ReactNode;
  settingsAction?: ReactNode;
}) {
  const { exercises: catalog, isSyncing, refresh } = useExerciseCatalog();
  const flightSequenceRef = useRef(0);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(0),
    [searchOpen, setSearchOpen] = useState(false);
  const [rune, setRune] = useState<Rune | null>(null),
    [announcement, setAnnouncement] = useState("");
  const [drag, setDrag] = useState<{
      label: string;
      type: string;
      rune?: Rune;
    } | null>(null),
    [targetIndex, setTargetIndex] = useState<number | null>(null),
    [fusion, setFusion] = useState<number | null>(null);
  const [flight, setFlight] = useState<{
    exerciseId: string;
    index: number;
    token: number;
  } | null>(null);
  const [impact, setImpact] = useState(0);
  const hover = useRef<{ target: number; since: number } | null>(null),
    table = useRef<HTMLDivElement>(null),
    scrollAfterAdd = useRef(false);
  const reduced = useReducedMotion(),
    scope = useId();
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
          searchText(e.name).includes(searchText(query)) &&
          (!filter ||
            (FILTERS[filter].groups.includes("POWER")
              ? tacticalMetadata(e).attributeWeights.power === 10
              : e.muscles.some(
                  (m) =>
                    m.role === "PRIMARY" &&
                    FILTERS[filter].groups.includes(m.muscleGroup),
                ))),
      ),
    [catalog, query, filter],
  );
  const groups = useMemo(() => {
    const result: {
      id: string;
      members: { item: WorkoutPlanDraftExercise; index: number }[];
      groupId?: string | null;
    }[] = [];
    day.exercises.forEach((item, index) => {
      if (!item.name && !item.exerciseId) return;
      const existing = item.supersetGroupId
        ? result.find((g) => g.groupId === item.supersetGroupId)
        : null;
      if (existing) existing.members.push({ item, index });
      else
        result.push({
          id: item.supersetGroupId ?? `single:${index}`,
          groupId: item.supersetGroupId,
          members: [{ item, index }],
        });
    });
    return result;
  }, [day.exercises]);
  useEffect(() => {
    if (scrollAfterAdd.current && table.current) {
      table.current.scrollTo?.({
        top: table.current.scrollHeight,
        behavior: reduced ? "instant" : "smooth",
      });
      scrollAfterAdd.current = false;
    }
  }, [day.exercises.length, reduced]);
  useEffect(() => {
    if (!flight) return;
    const timer = setTimeout(() => setFlight(null), 380);
    return () => clearTimeout(timer);
  }, [flight]);
  function commit(items: WorkoutPlanDraftExercise[]) {
    if (disabled) return;
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
    if (disabled) return;
    const item = {
      ...createDraftExercise(),
      name: entry.name,
      exerciseId: entry.id,
      restTimeInSeconds: 75,
    };
    const empty = day.exercises.findIndex((e) => !e.name && !e.exerciseId),
      index = empty >= 0 ? empty : day.exercises.length;
    let items = [...day.exercises];
    if (empty >= 0) items[empty] = item;
    else items.push(item);
    if (target !== undefined && merge && target !== index)
      items = mergeExercises(items, index, target);
    else if (target !== undefined && target !== index)
      items = reorderExercises(items, index, target);
    setFlight({
      exerciseId: entry.id,
      index: items.indexOf(item),
      token: ++flightSequenceRef.current,
    });
    scrollAfterAdd.current = target === undefined;
    commit(items);
    setAnnouncement(`${entry.name} adicionado`);
    haptic(20);
    if (tacticalMetadata(entry).cnsDemand === "high" && !reduced)
      setImpact((n) => n + 1);
  }
  function applyRune(index: number, selected: Rune) {
    const item = day.exercises[index];
    update(index, toggleRune(item, selected));
    setAnnouncement(
      RUNES[selected] +
        (item.runes?.includes(selected) ? " removida de " : " aplicada a ") +
        item.name,
    );
    haptic();
  }
  function moving(event: DragMoveEvent) {
    const index = event.over?.data.current?.index as number | undefined,
      source = event.active.data.current;
    setTargetIndex(index ?? null);
    const rect = event.active.rect.current.translated,
      over = event.over?.rect,
      center = rect ? rect.top + rect.height / 2 : 0;
    if (
      index === undefined ||
      source?.index === index ||
      source?.type === "rune" ||
      !over ||
      center < over.top + over.height * 0.2 ||
      center > over.bottom - over.height * 0.2
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
  useEffect(() => {
    if (!drag) return;
    const timer = setInterval(() => {
      if (hover.current && Date.now() - hover.current.since >= 300)
        setFusion(hover.current.target);
    }, 60);
    return () => clearInterval(timer);
  }, [drag]);
  function clearDrag() {
    setDrag(null);
    setTargetIndex(null);
    setFusion(null);
    hover.current = null;
  }
  function dropped(event: DragEndEvent) {
    const source = event.active.data.current,
      target = event.over?.data.current?.index as number | undefined;
    const merge = target !== undefined && fusion === target;
    clearDrag();
    if (!event.over || !source || disabled) return;
    if (source.type === "deck") add(source.entry, target, merge);
    if (source.type === "rune" && target !== undefined)
      applyRune(target, source.rune as Rune);
    if (source.type === "item" && source.index !== target) {
      if (target !== undefined)
        commit(
          merge
            ? mergeExercises(day.exercises, source.index, target)
            : reorderExercises(day.exercises, source.index, target),
        );
      else if (event.over.id === "append")
        commit(
          reorderExercises(
            day.exercises,
            source.index,
            day.exercises.length - 1,
          ),
        );
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={scope}>
        <fieldset
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Escape" && rune) {
              event.preventDefault();
              event.stopPropagation();
              setRune(null);
            }
          }}
          className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100"
        >
          <legend className="sr-only">Arena tática de {day.name}</legend>
          <DndContext
            sensors={sensors}
            collisionDetection={(args) =>
              args.pointerCoordinates
                ? pointerWithin(args)
                : closestCenter(args)
            }
            onDragStart={(e) => {
              const source = e.active.data.current;
              setDrag({
                type: source?.type ?? "item",
                rune: source?.type === "rune" ? source.rune : undefined,
                label:
                  source?.type === "rune"
                    ? RUNES[source.rune as Rune]
                    : (source?.entry?.name ??
                      day.exercises[source?.index]?.name ??
                      "Carta"),
              });
            }}
            onDragMove={moving}
            onDragOver={moving}
            onDragEnd={dropped}
            onDragCancel={clearDrag}
          >
            <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-white/10 bg-zinc-950 px-2 sm:gap-2 sm:px-3">
              {title}
              <div className="min-w-0 max-w-20 sm:max-w-40">{navigation}</div>
              <TrainingBioPanel data={data} />
              <span className="hidden whitespace-nowrap text-[10px] text-zinc-500 2xl:block">
                {data.sets} séries · {groups.length} blocos
              </span>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {settingsAction}
                {actions}
              </div>
            </header>
            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
              <aside className="no-scrollbar hidden w-80 shrink-0 overflow-y-auto border-r border-white/10 bg-zinc-900/25 p-3 lg:block xl:w-96">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Leitura do treino
                </p>
                <TrainingBioDetails data={data} />
              </aside>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex h-7 shrink-0 items-center justify-between px-3 text-[9px] uppercase tracking-widest text-zinc-500">
                  <span>{day.name}</span>
                  <span>
                    {data.sets} séries · {groups.length} blocos
                  </span>
                </div>
                <motion.div
                  ref={table}
                  data-testid="tactical-table"
                  animate={impact && !reduced ? { x: [0, -1, 1, 0] } : { x: 0 }}
                  className="no-scrollbar relative isolate min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[radial-gradient(#ffffff11_1px,transparent_1px)] px-2 pb-2 [background-size:16px_16px]"
                >
                  <SortableContext
                    items={day.exercises.map((_, i) => `item:${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <>
                      {groups.map((group, slot) => (
                        <div
                          key={group.id}
                          role={group.groupId ? "group" : undefined}
                          aria-label={
                            group.groupId
                              ? `${group.members.length === 2 ? "Bi-set" : "Super-set"}: ${group.members.map((m) => m.item.name).join(" + ")}`
                              : undefined
                          }
                          className={
                            group.groupId
                              ? "overflow-hidden rounded-xl border border-violet-400/70 bg-violet-500/10 shadow-[0_0_16px_#8b5cf615]"
                              : ""
                          }
                        >
                          {group.groupId && (
                            <div className="flex h-7 items-center justify-between border-b border-violet-300/15 px-3 text-[9px] text-violet-200">
                              <span className="flex items-center gap-1.5 font-semibold tracking-widest">
                                <Link2 size={12} />
                                {group.members.length === 2
                                  ? "BI-SET"
                                  : "SUPER-SET"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  commit(
                                    unmergeExercises(
                                      day.exercises,
                                      group.groupId!,
                                    ),
                                  );
                                  setAnnouncement(
                                    "Bi-set desfeito. Séries e técnicas preservadas.",
                                  );
                                }}
                                className="h-7 px-1"
                                aria-label="Desfazer bi-set"
                              >
                                Separar exercícios
                              </button>
                            </div>
                          )}
                          {group.members.map(({ item, index }) => {
                            const entry = catalog.find(
                                (e) => e.id === item.exerciseId,
                              ),
                              meta = entry ? tacticalMetadata(entry) : null;
                            return (
                              <ExerciseCard
                                key={`${item.id ?? item.exerciseId}-${index}`}
                                item={item}
                                index={index}
                                slot={slot}
                                muscle={
                                  meta?.primaryMuscles
                                    .map(getMuscleGroupLabel)
                                    .join(" · ") ?? ""
                                }
                                demand={meta?.cnsDemand ?? "medium"}
                                grouped={!!group.groupId}
                                fusionReady={fusion === index}
                                runeOver={
                                  drag?.type === "rune" && targetIndex === index
                                }
                                dragRune={drag?.rune ?? null}
                                selectedRune={rune}
                                onApplyRune={() =>
                                  rune && applyRune(index, rune)
                                }
                                onChange={(patch) => update(index, patch)}
                                onRemove={() =>
                                  commit(
                                    day.exercises.filter((_, n) => n !== index),
                                  )
                                }
                                candidates={day.exercises.flatMap((e, i) =>
                                  i !== index &&
                                  e.name &&
                                  (!item.supersetGroupId ||
                                    item.supersetGroupId !== e.supersetGroupId)
                                    ? [{ index: i, name: e.name }]
                                    : [],
                                )}
                                onMerge={(target) => {
                                  commit(
                                    mergeExercises(
                                      day.exercises,
                                      index,
                                      target,
                                    ),
                                  );
                                  setAnnouncement(
                                    `Bi-set criado com ${item.name} e ${day.exercises[target].name}`,
                                  );
                                }}
                                canMoveDown={index < day.exercises.length - 1}
                                onMove={(offset) =>
                                  commit(
                                    reorderExercises(
                                      day.exercises,
                                      index,
                                      index + offset,
                                    ),
                                  )
                                }
                                animationId={
                                  flight?.index === index
                                    ? `deck:${flight.exerciseId}`
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      ))}
                    </>
                  </SortableContext>
                  <DropSlot />
                </motion.div>
                <section
                  data-testid="tactical-deck"
                  aria-label="Deck de exercícios"
                  className="relative z-30 h-[202px] shrink-0 border-t border-white/10 bg-gradient-to-t from-zinc-900/90 to-zinc-950/60 shadow-[0_-12px_32px_#0002] backdrop-blur-md"
                >
                  {rune && (
                    <div
                      role="status"
                      style={{
                        color: RUNE_COLORS[rune],
                        borderColor: `${RUNE_COLORS[rune]}66`,
                      }}
                      className="absolute bottom-full left-3 right-3 z-30 mb-2 flex min-h-10 items-center justify-between gap-2 rounded-xl border bg-zinc-950/95 px-3 text-[11px]"
                    >
                      <span>
                        {RUNES[rune]} selecionado — Toque nos exercícios para
                        aplicar ou remover
                      </span>
                      <button
                        type="button"
                        onClick={() => setRune(null)}
                        className="flex size-10 items-center justify-center"
                        aria-label="Cancelar técnica selecionada"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                  <div className="no-scrollbar flex h-11 min-w-0 items-center gap-2 overflow-x-auto px-2">
                    <RuneBadgeDock
                      selected={rune}
                      onSelect={(value) =>
                        setRune(rune === value ? null : value)
                      }
                    />
                    <div className="h-6 w-px shrink-0 bg-white/10" />
                    <div className="no-scrollbar flex min-w-32 flex-1 gap-1 overflow-x-auto">
                      {FILTERS.map((f, i) => (
                        <button
                          type="button"
                          key={f.label}
                          aria-pressed={filter === i}
                          onClick={() => setFilter(i)}
                          className={`h-9 shrink-0 rounded-full px-2.5 text-[10px] ${filter === i ? "bg-cyan-300 text-zinc-950" : "bg-white/5 text-zinc-400"}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(!searchOpen)}
                      aria-label="Buscar exercícios no deck"
                      aria-expanded={searchOpen}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5"
                    >
                      <Search size={15} />
                    </button>
                  </div>
                  {searchOpen && (
                    <label className="absolute bottom-full left-2 right-2 z-20 mb-1 flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-zinc-950 p-2 shadow-xl">
                      <Search size={14} />
                      <input
                        autoFocus
                        type="search"
                        aria-label="Buscar no deck"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nome do exercício…"
                        className="h-9 min-w-0 flex-1 bg-transparent text-base outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setSearchOpen(false);
                        }}
                        aria-label="Fechar busca"
                        className="flex size-9 items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </label>
                  )}
                  <div
                    className="no-scrollbar flex h-[138px] snap-x items-center gap-3 overflow-x-auto px-4 py-2"
                    onWheel={(e) => {
                      if (
                        !e.shiftKey &&
                        Math.abs(e.deltaY) > Math.abs(e.deltaX)
                      )
                        e.currentTarget.scrollLeft += e.deltaY;
                    }}
                  >
                    {entries.slice(0, 80).map((e) => (
                      <DeckCard
                        key={e.id}
                        entry={e}
                        onAdd={() => add(e)}
                        justAdded={flight?.exerciseId === e.id}
                        animationId={
                          flight?.exerciseId === e.id
                            ? undefined
                            : `deck:${e.id}`
                        }
                      />
                    ))}
                    {!entries.length && (
                      <div className="flex h-36 items-center gap-2 text-xs text-zinc-400">
                        {isSyncing
                          ? "Carregando catálogo…"
                          : "Nenhum exercício encontrado."}
                        <button
                          type="button"
                          onClick={() => void refresh(true)}
                          className="min-h-11 text-cyan-300"
                        >
                          Atualizar
                        </button>
                      </div>
                    )}
                  </div>
                  <p
                    role="status"
                    aria-live="polite"
                    className="h-5 truncate px-3 text-[9px] leading-5 text-cyan-200/75"
                  >
                    {announcement ||
                      "Toque para adicionar · Técnica e bi-set direto no exercício"}
                  </p>
                </section>
              </div>
            </div>
            <DragOverlay dropAnimation={{ duration: 220, easing: "ease-out" }}>
              {drag ? (
                <div className="max-w-52 rounded-xl border border-cyan-300 bg-zinc-900 px-4 py-3 text-xs font-semibold text-cyan-100 shadow-xl">
                  {drag.label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </fieldset>
      </LayoutGroup>
    </MotionConfig>
  );
}
