import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Dumbbell,
  Layers3,
  Repeat,
  Scale,
} from "lucide-react";

import type {
  GetWorkoutHistorySession200,
  GetWorkoutHistorySession200ExercisesItem,
  GetWorkoutHistorySession200ExercisesItemSetsItem,
} from "@/app/_lib/api/fetch-generated";
import { LocalDate } from "@/app/_components/local-date";
import {
  formatDateOnly,
  formatDuration,
  formatSetDuration,
  formatWeightInGrams,
  formatWeightKg,
  getHistorySessionTitle,
  getSetTypeLabel,
} from "@/app/_lib/training-formatters";
import { Badge } from "@/components/ui/badge";

export function HistorySessionDetail({
  session,
}: {
  session: GetWorkoutHistorySession200;
}) {
  const title = getHistorySessionTitle(session);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <Link
        href="/history"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg pr-3 font-heading text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Histórico
      </Link>

      <header className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              {title}
            </h1>
            {session.timePrecision === "DATE_ONLY" && session.sessionDate ? (
              <span className="mt-1 block text-sm text-muted-foreground">
                {formatDateOnly(session.sessionDate, { long: true })}
              </span>
            ) : (
              <LocalDate
                isoDate={session.completedAt}
                long
                className="mt-1 block text-sm text-muted-foreground"
              />
            )}
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-1.5">
            {session.isRetroactive && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 font-heading text-[10px] uppercase tracking-wide text-amber-500"
              >
                Retroativo
              </Badge>
            )}
            <Badge variant="secondary">
              {session.origin === "PLANNED" ? "Planejado" : "Avulso"}
            </Badge>
          </div>
        </div>
        {session.origin === "PLANNED" &&
          session.workoutPlanNameSnapshot &&
          session.workoutPlanNameSnapshot !== title && (
            <p className="mt-2 text-sm font-medium text-primary">
              {session.workoutPlanNameSnapshot}
            </p>
          )}
      </header>

      <section
        aria-labelledby="history-summary-title"
        className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <h2 id="history-summary-title" className="sr-only">
          Resumo do treino
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryMetric
            icon={Layers3}
            value={String(session.summary.workingSetsCount)}
            label="Séries válidas"
          />
          <SummaryMetric
            icon={Dumbbell}
            value={String(session.summary.exercisesCount)}
            label="Exercícios"
          />
          <SummaryMetric
            icon={Clock3}
            value={formatDuration(session.durationInSeconds)}
            label="Duração"
          />
          <SummaryMetric
            icon={Scale}
            value={
              session.summary.totalLoadVolumeKg > 0
                ? formatWeightKg(session.summary.totalLoadVolumeKg)
                : "—"
            }
            label={
              session.summary.totalLoadVolumeKg > 0
                ? "Volume"
                : "Sem carga registrada"
            }
          />
        </div>
        {session.summary.warmupSetsCount > 0 && (
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {session.summary.warmupSetsCount} séries de aquecimento concluídas
          </p>
        )}
      </section>

      <div className="mt-6 space-y-4">
        {session.exercises.map((exercise) => (
          <ExerciseSection
            key={exercise.id}
            exercise={exercise}
            showPlanned={session.origin === "PLANNED"}
          />
        ))}
      </div>
    </main>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Layers3;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <Icon className="size-4 text-primary" aria-hidden="true" />
      <p className="mt-2 truncate font-heading text-lg font-semibold text-foreground">
        {value}
      </p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseSection({
  exercise,
  showPlanned,
}: {
  exercise: GetWorkoutHistorySession200ExercisesItem;
  showPlanned: boolean;
}) {
  const hasPlanned = Object.values(exercise.planned).some(
    (value) => value !== null,
  );
  const plannedFacts = [
    exercise.planned.warmupSets !== null
      ? `${exercise.planned.warmupSets} aquec.`
      : null,
    exercise.planned.workingSets !== null
      ? `${exercise.planned.workingSets} válidas`
      : null,
    exercise.planned.reps !== null ? `${exercise.planned.reps} reps` : null,
    exercise.planned.restTimeInSeconds !== null
      ? `${exercise.planned.restTimeInSeconds}s descanso`
      : null,
  ].filter(Boolean);
  const performedFacts = [
    exercise.performed.warmupSetsCount > 0
      ? `${exercise.performed.warmupSetsCount} aquec.`
      : null,
    `${exercise.performed.workingSetsCount} válidas`,
    exercise.performed.loadVolumeKg > 0
      ? formatWeightKg(exercise.performed.loadVolumeKg)
      : null,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-foreground">
          {exercise.exerciseNameSnapshot}
        </h2>
        {exercise.wasSubstituted && (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-medium"
          >
            <Repeat className="mr-1 size-3" />
            Substituído
          </Badge>
        )}
      </div>

      {exercise.wasSubstituted && exercise.plannedExerciseNameSnapshot && (
        <p className="mt-1 text-xs text-muted-foreground">
          Original planejado:{" "}
          <span className="font-medium text-foreground/90">
            {exercise.plannedExerciseNameSnapshot}
          </span>
        </p>
      )}

      {exercise.exerciseId && (
        <Link
          href={`/stats/exercises/${exercise.exerciseId}`}
          className="mt-1 inline-flex min-h-9 items-center gap-1 rounded-md pr-2 font-heading text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver evolução
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
      {exercise.notes && (
        <p className="mt-2 rounded-lg bg-secondary/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {exercise.notes}
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {showPlanned && hasPlanned && (
          <FactBlock title="Planejado" facts={plannedFacts as string[]} />
        )}
        <FactBlock title="Realizado" facts={performedFacts as string[]} />
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[1.25rem_minmax(3.6rem,1fr)_minmax(3.4rem,.9fr)_minmax(2.5rem,.55fr)_minmax(2rem,.45fr)] gap-1 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-2 sm:text-xs">
          <span>#</span>
          <span>Tipo</span>
          <span>Carga</span>
          <span>Reps</span>
          <span>RIR</span>
        </div>
        <div className="divide-y divide-border/70">
          {exercise.sets.map((set) => (
            <SetRow key={set.id} set={set} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FactBlock({ title, facts }: { title: string; facts: string[] }) {
  return (
    <div className="rounded-xl bg-secondary/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-foreground">
        {facts.length > 0 ? facts.join(" • ") : "Sem séries concluídas"}
      </p>
    </div>
  );
}

function SetRow({
  set,
}: {
  set: GetWorkoutHistorySession200ExercisesItemSetsItem;
}) {
  const repsOrDuration =
    set.reps !== null
      ? String(set.reps)
      : set.durationInSeconds !== null
        ? formatSetDuration(set.durationInSeconds)
        : "—";

  return (
    <div className="py-2.5">
      <div className="grid grid-cols-[1.25rem_minmax(3.6rem,1fr)_minmax(3.4rem,.9fr)_minmax(2.5rem,.55fr)_minmax(2rem,.45fr)] items-center gap-1 text-[11px] text-foreground sm:gap-2 sm:text-sm">
        <span className="text-muted-foreground">{set.order}</span>
        <span>{getSetTypeLabel(set.type)}</span>
        <span>
          {set.weightInGrams !== null
            ? formatWeightInGrams(set.weightInGrams)
            : "—"}
        </span>
        <span>{repsOrDuration}</span>
        <span>{set.rir !== null ? set.rir : "—"}</span>
      </div>
      {set.notes && (
        <p className="mt-1.5 pl-5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {set.notes}
        </p>
      )}
    </div>
  );
}
