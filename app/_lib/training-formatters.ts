const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) {
    return "Não informada";
  }
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0
      ? `${hours}h ${minutes.toString().padStart(2, "0")}min`
      : `${hours}h`;
  }

  if (minutes > 0) return `${minutes}min`;
  return `${safeSeconds}s`;
}

export function formatSetDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}min`;
  return `${minutes}min ${seconds}s`;
}

export function formatWeightKg(weightInKg: number): string {
  return `${NUMBER_FORMATTER.format(weightInKg)} kg`;
}

export function formatWeightInGrams(weightInGrams: number): string {
  return formatWeightKg(weightInGrams / 1000);
}

export function formatHistoryDate(
  isoDate: string,
  options: { timeZone?: string; long?: boolean } = {},
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Data inválida";

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: options.long ? "long" : "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const month = value("month").replace(".", "");
  const dateLabel = options.long
    ? `${value("day")} de ${month}`
    : `${value("day")} ${month}`;

  return `${dateLabel} • ${value("hour")}:${value("minute")}`;
}

export function formatDateOnly(
  dateValue: string,
  options: { long?: boolean } = {},
): string {
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Data inválida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: options.long ? "long" : "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function getHistorySessionTitle(session: {
  origin: "PLANNED" | "FREE";
  workoutDayNameSnapshot: string | null;
  workoutPlanNameSnapshot: string | null;
}): string {
  if (session.origin === "FREE") return "Treino avulso";
  return (
    session.workoutDayNameSnapshot ??
    session.workoutPlanNameSnapshot ??
    "Treino planejado"
  );
}

export function getSetTypeLabel(type: "WARMUP" | "WORKING"): string {
  return type === "WARMUP" ? "Aquec." : "Válida";
}
