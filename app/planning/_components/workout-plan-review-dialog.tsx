"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PrescriptionTargets,
  repetitionTarget,
} from "@/app/_components/prescription-targets";
import type { WorkoutPlanDraftDay } from "../_lib/workout-plan-builder";
import { WEEK_DAYS } from "../_lib/workout-plan-builder";
import { trainingDaysOnly } from "@/app/_lib/training-days";
import { RUNES } from "../_lib/tactical";

export function WorkoutPlanSummary({ days }: { days: WorkoutPlanDraftDay[] }) {
  const training = days.filter((day) => !day.isRest);
  const exercises = training
    .flatMap((day) => day.exercises)
    .filter((exercise) => exercise.name.trim());
  return (
    <p className="text-xs text-muted-foreground" aria-label="Resumo da ficha">
      {training.length} treino(s) · {exercises.length} exercício(s)
    </p>
  );
}

export function WorkoutPlanReviewDialog({
  name,
  days,
  notes,
  recipient,
  allowStudentSubstitution,
  pending,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  name: string;
  days: WorkoutPlanDraftDay[];
  notes?: string;
  recipient?: string;
  allowStudentSubstitution?: boolean;
  pending?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [approved, setApproved] = useState(false);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border bg-card shadow-xl">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b p-5">
            <div className="min-w-0 space-y-1">
              <Dialog.Title className="font-heading text-lg font-semibold">
                Revisar ficha
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {recipient
                  ? `Confira os treinos antes de enviar para ${recipient}.`
                  : "Confira a sequência e os parâmetros antes de salvar."}
              </Dialog.Description>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              aria-label="Fechar revisão"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-5">
            <div>
              <h3 className="break-words font-heading text-base font-semibold">
                {name}
              </h3>
              <WorkoutPlanSummary days={days} />
            </div>
            {notes?.trim() && (
              <p className="whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-3 text-sm">
                {notes}
              </p>
            )}
            {allowStudentSubstitution !== undefined && (
              <p className="text-xs text-muted-foreground">
                Substituições pelo aluno:{" "}
                {allowStudentSubstitution ? "permitidas" : "não permitidas"}.
              </p>
            )}
            {trainingDaysOnly(days).map((day, index) => (
              <section
                key={day.clientId ?? day.id ?? index}
                className="space-y-3 rounded-2xl border p-4"
              >
                <h4 className="break-words text-sm font-semibold">
                  {index + 1}. {day.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {`${day.estimatedDurationInMinutes} min`}
                    {day.weekDay &&
                      ` · ${WEEK_DAYS.find((weekDay) => weekDay.value === day.weekDay)?.label ?? day.weekDay}`}
                  </span>
                </h4>
                <ol className="space-y-3">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <li
                      key={exerciseIndex}
                      className="space-y-1 border-t pt-3 text-sm"
                    >
                      <p className="break-words font-medium">
                        {exerciseIndex + 1}. {exercise.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets} séries × {repetitionTarget(exercise)}{" "}
                        reps · {exercise.restTimeInSeconds}s de descanso
                        {exercise.warmupSets
                          ? ` · ${exercise.warmupSets} aquecimento(s)`
                          : ""}
                      </p>
                      <PrescriptionTargets value={exercise} showRange={false} />
                      {exercise.supersetGroupId && (
                        <p className="text-xs text-violet-500">
                          Grupo combinado{" "}
                          {days[index].exercises
                            .filter(
                              (e) =>
                                e.supersetGroupId === exercise.supersetGroupId,
                            )
                            .map((e) => e.name)
                            .join(" + ")}
                        </p>
                      )}
                      {!!exercise.runes?.length && (
                        <p className="text-xs text-amber-600">
                          {exercise.runes.map((r) => RUNES[r]).join(" · ")}
                        </p>
                      )}
                      {exercise.setPrescription?.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          Série {i + 1}: {s.reps} reps · {s.restSeconds}s
                          {s.load == null ? "" : ` · ${s.load} kg`}
                        </p>
                      ))}
                      {[exercise.alternative1Name, exercise.alternative2Name]
                        .filter((alternative) => alternative?.trim())
                        .map((alternative, alternativeIndex) => (
                          <p
                            key={alternativeIndex}
                            className="break-words text-xs text-muted-foreground"
                          >
                            Alternativa {alternativeIndex + 1}: {alternative}
                          </p>
                        ))}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <footer className="shrink-0 space-y-3 border-t p-5">
            {recipient && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(event) => setApproved(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  disabled={pending}
                />
                Revisei os exercícios e parâmetros e aprovo o envio desta ficha.
              </label>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={pending}
                className="sm:flex-1"
              >
                Voltar à edição
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={pending || (!!recipient && !approved)}
                className="sm:flex-1"
              >
                {pending ? "Salvando..." : confirmLabel}
              </Button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
