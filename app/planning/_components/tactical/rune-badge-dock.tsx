import { useDraggable } from "@dnd-kit/core";
import { RUNES, type Rune } from "../../_lib/tactical";
function RuneToken({
  rune,
  active,
  onSelect,
}: {
  rune: Rune;
  active: boolean;
  onSelect: (r: Rune) => void;
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `rune:${rune}`,
    data: { type: "rune", rune },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-pressed={active}
      onClick={() => onSelect(rune)}
      className={`min-h-11 shrink-0 rounded-xl border px-3 text-xs ${active ? "border-amber-300 bg-amber-300/15 text-amber-200" : "border-slate-700 bg-slate-900 text-slate-300"}`}
      style={{ touchAction: "pan-x pan-y" }}
    >
      {RUNES[rune]}
    </button>
  );
}
export function RuneBadgeDock({
  selected,
  onSelect,
}: {
  selected: Rune | null;
  onSelect: (r: Rune) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      aria-label="Técnicas avançadas"
    >
      {(Object.keys(RUNES) as Rune[]).map((r) => (
        <RuneToken
          key={r}
          rune={r}
          active={selected === r}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
