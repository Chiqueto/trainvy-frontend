interface Targets {
  repsMin?: number | null;
  repsMax?: number | null;
  targetRir?: number | null;
  targetLoadInGrams?: number | null;
  tempo?: string | null;
}
export function repetitionTarget(value: Targets & { reps?: number | null }) {
  return value.repsMin != null && value.repsMax != null
    ? `${value.repsMin}–${value.repsMax}`
    : (value.reps ?? null);
}
export function PrescriptionTargets({
  value,
  showRange = true,
}: {
  value: Targets;
  showRange?: boolean;
}) {
  const items = [
    showRange && value.repsMin != null && value.repsMax != null
      ? `${value.repsMin}–${value.repsMax} reps`
      : null,
    value.targetRir != null ? `RIR alvo ${value.targetRir}` : null,
    value.targetLoadInGrams != null
      ? `Carga alvo ${(value.targetLoadInGrams / 1000).toLocaleString("pt-BR")} kg`
      : null,
    value.tempo ? `Cadência ${value.tempo}` : null,
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div
      aria-label="Metas prescritas"
      className="flex flex-wrap gap-2 text-xs text-muted-foreground"
    >
      {items.map((item) => (
        <span key={item} className="rounded-lg bg-primary/5 px-2 py-1">
          {item}
        </span>
      ))}
    </div>
  );
}
