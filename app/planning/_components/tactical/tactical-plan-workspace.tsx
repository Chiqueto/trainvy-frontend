"use client";
import { useState, type ReactNode } from "react";
import { CoachGuidedTour } from "@/app/personal/_components/coach-guided-tour";
import { Dialog } from "radix-ui";
import { Copy, Trash2 } from "lucide-react";
import { SpatialBuilderArena } from "./spatial-builder-arena";
import { TacticalSheet } from "./tactical-sheet";
import {
  createDraftWorkoutDay,
  duplicateDraftWorkoutDay,
  type WorkoutPlanDraftDay,
  WEEK_DAYS,
} from "../../_lib/workout-plan-builder";
import { Input } from "@/components/ui/input";
import { AiFeature } from "@/app/_components/ai-availability-provider";

export function TacticalPlanWorkspace({
  days,
  onChange,
  disabled,
  activeIndex,
  onActiveChange,
  onClassic,
  settings,
  planName,
  onPlanNameChange,
  planNameMaxLength = 120,
  onSave,
  saveLabel,
  onReview,
  reviewLabel = "Revisar ficha",
  error,
  syncError,
  onAi,
}: {
  days: WorkoutPlanDraftDay[];
  onChange: (days: WorkoutPlanDraftDay[]) => void;
  disabled?: boolean;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  onClassic?: () => void;
  settings?: ReactNode;
  planName?: string;
  onPlanNameChange?: (name: string) => void;
  planNameMaxLength?: number;
  onSave?: () => void;
  saveLabel?: string;
  onReview?: () => void;
  reviewLabel?: string;
  error?: string | null;
  syncError?: boolean;
  onAi?: () => void;
}) {
  const [localActive, setLocalActive] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const active = activeIndex ?? localActive,
    index = Math.min(active, Math.max(0, days.length - 1)),
    day = days[index];
  function setActive(value: number) {
    setLocalActive(value);
    onActiveChange?.(value);
  }
  function updateDay(patch: Partial<WorkoutPlanDraftDay>) {
    onChange(days.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(value) => {
        if (!value) onClassic?.();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-zinc-950" />
        <Dialog.Content
          data-testid="tactical-viewport"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          className="dark fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100 outline-none"
        >
          <Dialog.Title className="sr-only">
            Montar plano · {planName}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Organize exercícios, séries e técnicas do plano.
          </Dialog.Description>
          <div className="absolute right-3 top-[120px] z-[60] rounded-xl bg-zinc-900 text-zinc-100 sm:bottom-3 sm:left-3 sm:right-auto sm:top-auto">
            <CoachGuidedTour tour="builder" />
          </div>
          <div
            data-tour="builder-arena"
            className="min-h-0 flex-1 overflow-hidden"
          >
            {day ? (
              <SpatialBuilderArena
                key={`spatial-${day.clientId ?? day.id ?? index}`}
                day={day}
                days={days}
                activeDayIndex={index}
                onSelectDay={setActive}
                onAddDay={() => {
                  onChange([
                    ...days,
                    {
                      ...createDraftWorkoutDay(
                        String.fromCharCode(65 + (days.length % 26)),
                      ),
                      exercises: [],
                    },
                  ]);
                  setActive(days.length);
                }}
                onChange={updateDay}
                disabled={disabled}
                onSave={onSave}
                saveLabel={saveLabel}
                onReview={onReview}
                reviewLabel={reviewLabel}
                planName={planName}
                onPlanNameChange={onPlanNameChange}
                planNameMaxLength={planNameMaxLength}
                error={error}
                syncError={syncError}
                onClassicView={onClassic}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : null}
          </div>
          <TacticalSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            title="Configurações do plano"
            description="Nome, informações gerais e organização das divisões."
          >
            <fieldset
              disabled={disabled}
              className="space-y-4 [&_section]:!border-white/10 [&_section]:!bg-zinc-900/50 [&_section]:!p-3 [&_input]:!bg-zinc-900 [&_textarea]:!bg-zinc-900"
            >
              {settings}
              {onAi && (
                <AiFeature capability="planning">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      onAi();
                    }}
                    className="min-h-11 w-full rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 text-sm text-cyan-200"
                  >
                    Abrir assistente de IA
                  </button>
                </AiFeature>
              )}
              {day && (
                <section className="space-y-3 rounded-xl border border-white/10 p-3">
                  <label className="block text-xs">
                    Nome do treino
                    <Input
                      value={day.name}
                      onChange={(e) => updateDay({ name: e.target.value })}
                      className="mt-1"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block text-xs">
                      Duração (min)
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={day.estimatedDurationInMinutes}
                        onChange={(event) =>
                          updateDay({
                            estimatedDurationInMinutes: Number(
                              event.target.value,
                            ),
                          })
                        }
                        className="mt-1"
                      />
                    </label>
                    <label className="block text-xs">
                      Dia de referência
                      <select
                        aria-label="Dia de referência"
                        value={day.weekDay ?? WEEK_DAYS[index % 7].value}
                        onChange={(event) =>
                          updateDay({
                            weekDay: event.target
                              .value as WorkoutPlanDraftDay["weekDay"],
                          })
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white"
                      >
                        {WEEK_DAYS.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    A divisão segue a ordem dos treinos. O dia é uma referência
                    e a duração informada será preservada.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = duplicateDraftWorkoutDay(day);
                        onChange([
                          ...days.slice(0, index + 1),
                          copy,
                          ...days.slice(index + 1),
                        ]);
                        setActive(index + 1);
                      }}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/5"
                    >
                      <Copy size={13} />
                      Duplicar treino
                    </button>
                    <button
                      type="button"
                      disabled={days.length <= 1}
                      onClick={() => {
                        onChange(days.filter((_, i) => i !== index));
                        setActive(Math.max(0, index - 1));
                      }}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-rose-300 disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                      Excluir treino
                    </button>
                    {([-1, 1] as const).map((offset) => (
                      <button
                        type="button"
                        key={offset}
                        disabled={
                          index + offset < 0 || index + offset >= days.length
                        }
                        onClick={() => {
                          const next = [...days];
                          [next[index], next[index + offset]] = [
                            next[index + offset],
                            next[index],
                          ];
                          onChange(next);
                          setActive(index + offset);
                        }}
                        className="min-h-11 rounded-xl bg-white/5 disabled:opacity-30"
                      >
                        {offset < 0 ? "← Mover antes" : "Mover depois →"}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </fieldset>
          </TacticalSheet>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
