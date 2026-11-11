"use client";
import { useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { ArrowLeft, Copy, Plus, Settings2, Trash2 } from "lucide-react";
import { TacticalBuilderArena } from "./tactical-builder-arena";
import { TacticalSheet } from "./tactical-sheet";
import { SealButton } from "./seal-button";
import {
  createDraftWorkoutDay,
  duplicateDraftWorkoutDay,
  type WorkoutPlanDraftDay,
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
  onSave,
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
  onSave?: () => void;
  onReview?: () => void;
  reviewLabel?: string;
  error?: string | null;
  syncError?: boolean;
  onAi?: () => void;
}) {
  const [localActive, setLocalActive] = useState(0),
    [settingsOpen, setSettingsOpen] = useState(false);
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
  const navigation = (
    <div className="flex min-w-0 items-center gap-1">
      <div
        className="flex min-w-0 gap-1 overflow-x-auto"
        role="tablist"
        aria-label="Treinos do plano"
      >
        {days.map((d, i) => (
          <button
            type="button"
            key={d.clientId ?? d.id ?? i}
            role="tab"
            aria-label={d.name}
            aria-selected={i === index}
            onClick={() => setActive(i)}
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${i === index ? "bg-cyan-300 text-zinc-950" : "bg-white/5 text-zinc-400"}`}
          >
            {String.fromCharCode(65 + (i % 26))}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Novo treino"
        disabled={disabled}
        onClick={() => {
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
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 text-zinc-400"
      >
        <Plus size={13} />
      </button>
      <button
        type="button"
        onClick={onClassic}
        aria-label="Modo Clássico"
        title="Modo Clássico"
        className="ml-auto flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[10px] text-zinc-400"
      >
        ⚡<span className="text-zinc-600">/</span>📋
      </button>
    </div>
  );
  const footer = (
    <>
      <div className="flex items-center gap-2">
        {onReview && (
          <button
            type="button"
            onClick={onReview}
            disabled={disabled}
            className="min-h-11 flex-1 rounded-xl border border-white/10 px-2 text-xs text-zinc-300 disabled:opacity-40"
          >
            {reviewLabel}
          </button>
        )}
        {onSave && <SealButton disabled={disabled} onSave={onSave} />}
      </div>
      {error && (
        <p
          role="alert"
          className="max-h-14 overflow-y-auto pt-1 text-xs text-rose-300"
        >
          {error}
        </p>
      )}
      {syncError && (
        <p className="pt-1 text-[9px] text-amber-200">
          Preferência local · sincronização indisponível
        </p>
      )}
    </>
  );
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
          <header className="flex h-[60px] shrink-0 items-center gap-3 px-3">
            <button
              type="button"
              onClick={onClassic}
              aria-label="Voltar ao editor clássico"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate text-sm font-semibold">
                {planName || "Montar plano"}
              </Dialog.Title>
              <Dialog.Description className="text-[10px] text-zinc-500">
                Tactical workout builder
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="Configurações do plano"
              onClick={() => setSettingsOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10"
            >
              <Settings2 size={17} />
            </button>
          </header>
          <div className="h-[calc(100dvh-60px)] min-h-0 overflow-hidden">
            {day && (
              <TacticalBuilderArena
                key={day.clientId ?? day.id ?? index}
                day={day}
                disabled={disabled}
                onChange={updateDay}
                navigation={navigation}
                footer={footer}
              />
            )}
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
