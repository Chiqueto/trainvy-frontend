"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Cable,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  GripVertical,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { tacticalMetadata, patchExercise } from "../../_lib/tactical";
import {
  createDraftExercise,
  type WorkoutPlanDraftExercise,
} from "../../_lib/workout-plan-builder";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import {
  ExerciseConfiguration,
  type ExercisePanelTab,
} from "./exercise-configuration";
import { ExerciseActionsMenu } from "./exercise-actions-menu";
import { TacticalSheet } from "./tactical-sheet";
import { useHoldMenu } from "./use-hold-menu";
import type { Point } from "./spatial-utils";
import { useMobileStudio } from "./use-mobile-studio";
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
];
const searchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export interface PlayerHandProps {
  catalog: ListExercises200Item[];
  onSummonExercise: (
    entry: ListExercises200Item,
    patch?: Partial<WorkoutPlanDraftExercise>,
    point?: Point,
  ) => void;
  disabled?: boolean;
  isLoading?: boolean;
  isDropTarget?: boolean;
  onCatalogDrag?: (entry: ListExercises200Item | null, point?: Point) => void;
  onCatalogDrop?: (entry: ListExercises200Item, point: Point) => void;
}
export function PlayerHand({
  catalog,
  onSummonExercise,
  disabled,
  isLoading,
  isDropTarget,
  onCatalogDrag,
  onCatalogDrop,
}: PlayerHandProps) {
  const mobile = useMobileStudio();
  const [filterIndex, setFilterIndex] = useState(0),
    [query, setQuery] = useState(""),
    [collapsedOverride, setCollapsed] = useState<boolean | null>(null),
    [limit, setLimit] = useState(50),
    [scroll, setScroll] = useState({ left: 0, end: false });
  const collapsed = collapsedOverride ?? mobile;
  const listRef = useRef<HTMLDivElement>(null);
  const [configuration, setConfiguration] = useState<{
    entry: ListExercises200Item;
    item: WorkoutPlanDraftExercise;
    tab: ExercisePanelTab;
  } | null>(null);
  const filtered = useMemo(
    () =>
      catalog.filter(
        (entry) =>
          searchText(entry.name).includes(searchText(query)) &&
          (!filterIndex ||
            entry.muscles.some(
              (m) =>
                m.role === "PRIMARY" &&
                FILTERS[filterIndex].groups.includes(m.muscleGroup),
            )),
      ),
    [catalog, query, filterIndex],
  );
  function reset() {
    setLimit(50);
    setScroll({ left: 0, end: false });
    if (listRef.current) listRef.current.scrollLeft = 0;
  }
  function addExercise(
    entry: ListExercises200Item,
    patch?: Partial<WorkoutPlanDraftExercise>,
  ) {
    if (patch) onSummonExercise(entry, patch);
    else onSummonExercise(entry);
    if (mobile) {
      setCollapsed(true);
      setQuery("");
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    }
  }
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      e.stopPropagation();
      node.scrollLeft += e.deltaY;
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [collapsed]);
  return (
    <section
      data-deck-drop-zone
      aria-label="Catálogo de exercícios"
      className={`spatial-deck pointer-events-none absolute inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 flex flex-col items-center px-3 pb-2 sm:bottom-0 sm:px-6 sm:pb-[max(12px,env(safe-area-inset-bottom))] ${isDropTarget ? "spatial-deck-drop" : ""}`}
    >
      <div className="spatial-glass pointer-events-auto relative z-20 w-full max-w-5xl rounded-2xl p-2 sm:px-3">
        <div className="flex items-center gap-2">
          <div className="hidden shrink-0 items-center gap-2 border-r border-white/10 pr-3 sm:flex">
            <Sparkles size={15} className="text-cyan-300" />
            <span className="text-xs font-medium text-slate-200">Seu deck</span>
            <span className="font-mono text-[10px] text-slate-500">
              {filtered.length}
            </span>
          </div>
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
            <Search size={14} className="shrink-0 text-slate-500" />
            <input
              type="search"
              aria-label="Buscar exercícios no deck"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
                setCollapsed(false);
              }}
              placeholder="Buscar exercício…"
              onFocus={() => {
                if (mobile) setCollapsed(false);
              }}
              className="min-w-0 w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setQuery("");
                  reset();
                }}
              >
                <X size={13} />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expandir deck" : "Recolher deck"}
            className="spatial-icon-button !size-8 !border-0 !bg-transparent"
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {!collapsed && (
          <div
            role="group"
            aria-label="Filtrar grupo muscular"
            className="no-scrollbar mt-2 flex gap-1 overflow-x-auto"
          >
            {FILTERS.map((filter, i) => (
              <button
                key={filter.label}
                type="button"
                aria-pressed={filterIndex === i}
                onClick={() => {
                  setFilterIndex(i);
                  reset();
                }}
                className={`h-7 shrink-0 rounded-lg px-3 text-[11px] ${filterIndex === i ? "bg-cyan-300/10 text-cyan-200" : "text-slate-500 hover:bg-white/5"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {isDropTarget && (
        <p className="pointer-events-none absolute -top-10 rounded-xl border border-rose-300/30 bg-rose-950/95 px-4 py-2 text-xs text-rose-200">
          Solte aqui para remover do treino e devolver ao catálogo
        </p>
      )}
      {!collapsed && (
        <>
          <div
            ref={listRef}
            tabIndex={0}
            role="region"
            aria-label="Lista rolável de exercícios"
            onScroll={(e) => {
              const el = e.currentTarget;
              const end = el.scrollWidth - el.clientWidth - el.scrollLeft < 30;
              setScroll({ left: el.scrollLeft, end });
              if (end) setLimit((prev) => Math.min(filtered.length, prev + 50));
            }}
            className="spatial-hand no-scrollbar pointer-events-auto flex w-full max-w-5xl items-end gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-5 [touch-action:pan-x]"
          >
            {filtered.slice(0, limit).map((entry, i) => (
              <CatalogCard
                key={entry.id}
                entry={entry}
                index={i}
                disabled={disabled}
                onAdd={() => addExercise(entry)}
                onConfigure={(tab) =>
                  setConfiguration({
                    entry,
                    item: {
                      ...createDraftExercise(),
                      name: entry.name,
                      exerciseId: entry.id,
                      restTimeInSeconds: 75,
                    },
                    tab,
                  })
                }
                onDrag={(point) => onCatalogDrag?.(entry, point)}
                onDrop={(point) => {
                  onCatalogDrag?.(null);
                  onCatalogDrop?.(entry, point);
                }}
                onCancel={() => onCatalogDrag?.(null)}
              />
            ))}
            {!filtered.length && (
              <div
                role="status"
                className="flex h-32 w-full flex-col items-center justify-center gap-2 text-xs text-slate-400"
              >
                <Search size={22} />
                <span>
                  {isLoading
                    ? "Carregando exercícios…"
                    : "Nenhum exercício encontrado"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Tente outro nome ou grupo muscular.
                </span>
              </div>
            )}
          </div>
          <div className="pointer-events-auto flex min-h-8 items-center gap-2 text-[10px] text-slate-500">
            <button
              type="button"
              aria-label="Rolar exercícios para a esquerda"
              disabled={scroll.left <= 0}
              onClick={() =>
                listRef.current?.scrollBy({ left: -400, behavior: "smooth" })
              }
              className="spatial-icon-button !size-7 !border-0"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="max-w-[75vw] text-center">
              Role para explorar · clique para adicionar · arraste pela alça ·
              segure para opções
            </span>
            <button
              type="button"
              aria-label="Rolar exercícios para a direita"
              disabled={scroll.end && limit >= filtered.length}
              onClick={() =>
                listRef.current?.scrollBy({ left: 400, behavior: "smooth" })
              }
              className="spatial-icon-button !size-7 !border-0"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
      <TacticalSheet
        open={!!configuration}
        onClose={() => setConfiguration(null)}
        title={configuration?.entry.name ?? "Configurar exercício"}
        description="Configure a carta antes de adicioná-la ao treino."
        footer={
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (configuration) {
                addExercise(configuration.entry, configuration.item);
                setConfiguration(null);
              }
            }}
            className="min-h-11 rounded-xl bg-cyan-300 text-sm font-semibold text-slate-950"
          >
            Adicionar ao treino
          </button>
        }
      >
        {configuration && (
          <ExerciseConfiguration
            item={configuration.item}
            tab={configuration.tab}
            onTabChange={(tab) => setConfiguration({ ...configuration, tab })}
            onChange={(patch) =>
              setConfiguration({
                ...configuration,
                item: patchExercise(configuration.item, patch),
              })
            }
            disabled={disabled}
          />
        )}
      </TacticalSheet>
    </section>
  );
}
function CatalogCard({
  entry,
  index,
  disabled,
  onAdd,
  onConfigure,
  onDrag,
  onDrop,
  onCancel,
}: {
  entry: ListExercises200Item;
  index: number;
  disabled?: boolean;
  onAdd: () => void;
  onConfigure: (tab: ExercisePanelTab) => void;
  onDrag: (point: Point) => void;
  onDrop: (point: Point) => void;
  onCancel: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const hold = useHoldMenu(() => setMenu(true));
  const suppressClick = useRef(false),
    cleanupRef = useRef<(() => void) | null>(null);
  const meta = tacticalMetadata(entry);
  useEffect(() => () => cleanupRef.current?.(), []);
  function start(event: React.PointerEvent) {
    suppressClick.current = false;
    if (
      disabled ||
      event.button !== 0 ||
      (event.target as Element).closest("[data-card-actions]")
    )
      return;
    if (
      event.pointerType === "touch" &&
      !(event.target as Element).closest("[data-drag-handle]")
    )
      return;
    const point = { x: event.clientX, y: event.clientY };
    let moved = false;
    const move = (e: PointerEvent) => {
      if (hold.held.current) return;
      if (!moved && Math.hypot(e.clientX - point.x, e.clientY - point.y) < 8)
        return;
      moved = true;
      hold.cancel();
      suppressClick.current = true;
      e.preventDefault();
      onDrag({ x: e.clientX, y: e.clientY });
    };
    const clean = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      cleanupRef.current = null;
    };
    const end = (e: PointerEvent) => {
      if (moved) {
        if (e.type === "pointercancel") onCancel();
        else onDrop({ x: e.clientX, y: e.clientY });
      }
      clean();
    };
    cleanupRef.current?.();
    cleanupRef.current = clean;
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }
  return (
    <article
      inert={disabled || undefined}
      data-catalog-card={entry.id}
      {...{
        onPointerDownCapture: hold.onPointerDownCapture,
        onPointerMoveCapture: hold.onPointerMoveCapture,
        onPointerUpCapture: hold.onPointerUpCapture,
        onPointerCancelCapture: hold.onPointerCancelCapture,
      }}
      onPointerDown={start}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu(true);
      }}
      onClickCapture={(e) => {
        if (suppressClick.current || hold.held.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={
        {
          "--fan-angle": `${((index % 6) - 2.5) * 1.2}deg`,
          "--card-accent":
            meta.cnsDemand === "high"
              ? "#e5b979"
              : meta.cnsDemand === "low"
                ? "#6ed8b3"
                : "#67d9ee",
        } as CSSProperties
      }
      className="spatial-hand-card relative flex h-[144px] w-[150px] shrink-0 select-none flex-col rounded-xl border border-white/15 p-2 text-left"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-drag-handle
          aria-label={`Arrastar ${entry.name} para a mesa`}
          title="Arraste para a mesa"
          className="flex size-7 touch-none cursor-grab items-center justify-center text-slate-500"
        >
          <GripVertical size={15} />
        </button>
        <span className="max-w-20 truncate text-[9px] uppercase tracking-widest text-[var(--card-accent)]">
          {meta.primaryMuscles.map(getMuscleGroupLabel).slice(0, 1)}
        </span>
        <div data-card-actions>
          <ExerciseActionsMenu
            open={menu}
            onOpenChange={setMenu}
            ignoreOutside={hold.ignoreOutside}
            onConfigure={onConfigure}
            onAdd={onAdd}
          />
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Adicionar ${entry.name}`}
        onClick={onAdd}
        className="flex min-h-0 flex-1 flex-col text-left"
      >
        <div className="my-auto flex items-center gap-2 text-slate-500">
          {meta.equipment === "Máquina / cabo" ? (
            <Cable size={22} strokeWidth={1.2} />
          ) : (
            <Dumbbell size={22} strokeWidth={1.2} />
          )}
          <Plus size={12} />
        </div>
        <span className="line-clamp-2 min-h-8 text-[11px] font-medium leading-snug text-white">
          {entry.name}
        </span>
      </button>
    </article>
  );
}
