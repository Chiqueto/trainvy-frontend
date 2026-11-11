import { useDraggable } from "@dnd-kit/core";
import { RUNES, type Rune } from "../../_lib/tactical";
const icons: Record<Rune, string> = {
  DROP_SET: "🔥",
  REST_PAUSE: "⚡",
  ISOMETRIC_HOLD: "❄",
  CLUSTER_SET: "⛓",
  TEMPO_CONTROL: "◷",
};
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
      aria-label={RUNES[rune]}
      title={`${RUNES[rune]}: arraste ou toque e escolha o exercício`}
      aria-pressed={active}
      onClick={() => onSelect(rune)}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-base ${active ? "border-amber-300 bg-amber-300/20 shadow-[0_0_12px_#fbbf2440]" : "border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950"}`}
      style={{ touchAction: "pan-x pan-y" }}
    >
      {icons[rune]}
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
      className="flex shrink-0 gap-1"
      role="group"
      aria-label="Técnicas rápidas"
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
