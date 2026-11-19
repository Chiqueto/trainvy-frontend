"use client";
import {
  ViewModeToggle,
  useBuilderMode,
} from "@/app/planning/_components/tactical/view-mode-toggle";
import { TacticalPlanWorkspace } from "@/app/planning/_components/tactical/tactical-plan-workspace";
import { WorkoutCardsWorkspace } from "@/app/planning/_components/workout-cards-workspace";
import { SealButton } from "@/app/planning/_components/tactical/seal-button";

import { trainingDaysOnly } from "@/app/_lib/training-days";
import {
  AiFeature,
  useAiAvailability,
} from "@/app/_components/ai-availability-provider";
import { trackProductEvent } from "@/app/_lib/product-events";
import { serializeAdvancedPrescription } from "@/app/planning/_lib/workout-plan-builder";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { toast } from "sonner";
import { LoaderCircle, Send, Sparkles } from "lucide-react";

import {
  createPrescriptionDraftAction,
  sendPrescriptionAction,
  updatePrescriptionDraftAction,
} from "@/app/personal/_actions";
import {
  createClientDayId,
  createInitialWorkoutDays,
  validateWorkoutPlanDraft,
  WEEK_DAYS,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "@/app/planning/_lib/workout-plan-builder";
import {
  WorkoutPlanReviewDialog,
  WorkoutPlanSummary,
} from "@/app/planning/_components/workout-plan-review-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAiPrescriptionModal } from "./coach-ai-prescription-modal";

export interface InitialPrescriptionData {
  originType?: string;
  allowStudentSubstitution?: boolean;
  id?: string;
  name: string;
  notes?: string | null;
  version?: number;
  workoutDays?: Array<{
    name: string;
    order?: number;
    weekDay?: (typeof WEEK_DAYS)[number]["value"];
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      exerciseId?: string | null;
      alternative1ExerciseId?: string | null;
      alternative2ExerciseId?: string | null;
      name: string;
      order?: number;
      sets: number;
      warmupSets?: number;
      reps: number;
      repsMin?: number | null;
      repsMax?: number | null;
      targetRir?: number | null;
      targetLoadInGrams?: number | null;
      tempo?: string | null;
      supersetGroupId?: string | null;
      runes?: WorkoutPlanDraftExercise["runes"];
      runeConfig?: WorkoutPlanDraftExercise["runeConfig"];
      setPrescription?: WorkoutPlanDraftExercise["setPrescription"];
      restTimeInSeconds: number;
      alternative1ExerciseName?: string | null;
      alternative2ExerciseName?: string | null;
    }>;
  }>;
}

interface CoachPrescriptionBuilderProps {
  athleteId: string;
  athleteName: string;
  initialData?: InitialPrescriptionData;
}

export function CoachPrescriptionBuilder({
  athleteId,
  athleteName,
  initialData,
}: CoachPrescriptionBuilderProps) {
  const router = useRouter();
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const { builderMode, changeMode, syncError } = useBuilderMode();
  const hydrated = useHydrated();
  const [name, setName] = useState(initialData?.name ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [allowStudentSubstitution, setAllowStudentSubstitution] = useState(
    initialData?.allowStudentSubstitution ?? true,
  );
  const [aiAssisted, setAiAssisted] = useState(
    initialData?.originType === "PROFESSIONAL_AI_ASSISTED",
  );

  const [days, setDays] = useState<WorkoutPlanDraftDay[]>(() => {
    if (initialData?.workoutDays && initialData.workoutDays.length > 0) {
      return trainingDaysOnly(initialData.workoutDays).map((d, index) => ({
        clientId: createClientDayId(),
        name: d.name,
        weekDay: d.weekDay ?? WEEK_DAYS[index % 7].value,
        isRest: d.isRest,
        estimatedDurationInMinutes: Math.max(
          1,
          Math.round(d.estimatedDurationInSeconds / 60),
        ),
        exercises: (d.exercises ?? []).map((e) => ({
          exerciseId: e.exerciseId,
          alternative1ExerciseId: e.alternative1ExerciseId,
          alternative2ExerciseId: e.alternative2ExerciseId,
          name: e.name,
          sets: e.sets,
          warmupSets: e.warmupSets ?? 0,
          reps: e.reps,
          ...serializeAdvancedPrescription(e),
          restTimeInSeconds: e.restTimeInSeconds,
          alternative1Name: e.alternative1ExerciseName ?? "",
          alternative2Name: e.alternative2ExerciseName ?? "",
        })),
      }));
    }
    return createInitialWorkoutDays().map((day, index) => ({
      ...day,
      weekDay: WEEK_DAYS[(index * 2) % 7].value,
      exercises: [],
    }));
  });

  const [savedDraft, setSavedDraft] = useState({
    id: initialData?.id,
    version: initialData?.version,
  });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function reportError(message: string) {
    setError(message);
    toast.error(message);
  }
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { planningEnabled } = useAiAvailability();
  const aiModalVisible = planningEnabled && isAiModalOpen;
  const [isPending, startTransition] = useTransition();

  function serializeDaysForApi() {
    return trainingDaysOnly(days).map((day, dayIndex) => ({
      name: day.name.trim(),
      order: dayIndex,
      weekDay: day.weekDay ?? "MONDAY",
      isRest: false,
      estimatedDurationInSeconds: Math.round(
        day.estimatedDurationInMinutes * 60,
      ),
      exercises: day.exercises.map((exercise, exerciseIndex) => {
        const name = exercise.name.trim();
        const alternatives = [
          {
            id: exercise.alternative1ExerciseId,
            name: exercise.alternative1Name,
          },
          {
            id: exercise.alternative2ExerciseId,
            name: exercise.alternative2Name,
          },
        ].filter(
          (alternative, index, entries) =>
            alternative.id &&
            alternative.id !== exercise.exerciseId &&
            entries.findIndex((entry) => entry.id === alternative.id) === index,
        );

        return {
          name,
          exerciseId: exercise.exerciseId,
          order: exerciseIndex,
          sets: exercise.sets,
          warmupSets: exercise.warmupSets ?? 0,
          reps: exercise.reps,
          ...serializeAdvancedPrescription(exercise),
          restTimeInSeconds: exercise.restTimeInSeconds,
          alternative1ExerciseId: alternatives[0]?.id ?? null,
          alternative1ExerciseName: alternatives[0]?.name ?? null,
          alternative2ExerciseId: alternatives[1]?.id ?? null,
          alternative2ExerciseName: alternatives[1]?.name ?? null,
        };
      }),
    }));
  }

  async function handleSave(
    sendImmediately: boolean = false,
    reviewed = false,
  ) {
    if (isPending) return;
    const validationError =
      validateWorkoutPlanDraft(name, days) ||
      (name.trim().length > 100
        ? "O nome deve ter no máximo 100 caracteres."
        : null) ||
      (notes.trim().length > 1000
        ? "As orientações devem ter no máximo 1000 caracteres."
        : null) ||
      (sendImmediately &&
      !days.some((day) => !day.isRest && day.exercises.length > 0)
        ? "Adicione um dia de treino com exercícios antes de enviar."
        : null);
    if (validationError) {
      const invalidIndex = days.findIndex((day) =>
        validateWorkoutPlanDraft(name || "Plano", [day]),
      );
      if (invalidIndex >= 0) setActiveDayIndex(invalidIndex);
      reportError(validationError);
      return;
    }

    setError(null);
    if (sendImmediately && !reviewed) {
      setReviewOpen(true);
      return;
    }
    setReviewOpen(false);
    startTransition(async () => {
      try {
        const serializedWorkoutDays = serializeDaysForApi();

        let savedPrescriptionId = savedDraft.id;
        let reviewedVersion = savedDraft.version;

        if (savedDraft.id) {
          // Atualiza rascunho existente
          const updateRes = await updatePrescriptionDraftAction({
            id: savedDraft.id,
            athleteId,
            body: {
              name: name.trim(),
              notes: notes.trim() || null,
              allowStudentSubstitution,
              workoutDays: serializedWorkoutDays,
              version: savedDraft.version!,
            },
          });

          if (!updateRes.success) {
            reportError(updateRes.error);
            return;
          }
          reviewedVersion = updateRes.data.version;
          setSavedDraft({
            id: updateRes.data.id,
            version: updateRes.data.version,
          });
        } else {
          // Cria novo rascunho
          const createRes = await createPrescriptionDraftAction({
            athleteId,
            name: name.trim(),
            notes: notes.trim() || null,
            allowStudentSubstitution,
            workoutDays: serializedWorkoutDays,
          });

          if (!createRes.success) {
            reportError(createRes.error);
            return;
          }
          savedPrescriptionId = createRes.data.id;
          reviewedVersion = createRes.data.version;
          setSavedDraft({
            id: createRes.data.id,
            version: createRes.data.version,
          });
        }

        // Se solicitado envio imediato
        if (sendImmediately && savedPrescriptionId) {
          const sendRes = await sendPrescriptionAction({
            id: savedPrescriptionId,
            athleteId,
            version: reviewedVersion!,
          });
          if (!sendRes.success) {
            reportError(`Rascunho salvo. ${sendRes.error}`);
            return;
          }
          trackProductEvent("Prescription sent");
        }

        toast.success(
          sendImmediately
            ? "Prescrição enviada ao aluno!"
            : "Rascunho salvo com sucesso!",
        );
        router.push(`/personal/alunos/${athleteId}?tab=prescriptions`);
        router.refresh();
      } catch {
        reportError("Não foi possível concluir a operação. Tente novamente.");
      }
    });
  }

  const planSettings = (
    <>
      {/* Card de Configurações Básicas da Prescrição */}
      <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
            01
          </span>{" "}
          O plano do aluno
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-sm font-bold text-foreground">
            Informações do Planejamento
          </h2>
          <p className="text-xs text-muted-foreground">
            Defina o nome principal e as orientações para {athleteName}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="prescription-name"
              className="text-xs font-heading font-semibold text-foreground"
            >
              Nome do Planejamento *
            </label>
            <Input
              id="prescription-name"
              maxLength={100}
              placeholder="Ex: Hipertrofia ABCD - Foco em Superiores"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="prescription-notes"
              className="text-xs font-heading font-semibold text-foreground"
            >
              Orientações ao Aluno (opcional)
            </label>
            <textarea
              id="prescription-notes"
              maxLength={1000}
              placeholder="Instruções sobre descanso, cadência, progressão de carga ou metas..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              className="w-full rounded-xl border border-input bg-background p-3 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary resize-none min-h-[75px]"
            />
          </div>
        </div>
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-primary"
          checked={allowStudentSubstitution}
          onChange={(e) => setAllowStudentSubstitution(e.target.checked)}
        />
        <span>
          <span className="block font-semibold">
            Permitir substituições durante a sessão
          </span>
          <span className="text-muted-foreground">
            O aluno pode trocar exercícios sem alterar a ficha original. As
            alternativas que você prescrever ficam disponíveis na execução.
          </span>
        </span>
      </label>
      {/* Seção de Dias de Treino */}
    </>
  );

  return (
    <fieldset
      disabled={!hydrated || isPending}
      aria-busy={!hydrated || isPending}
      className="flex min-w-0 flex-col gap-6 disabled:opacity-80"
    >
      {/* Banner de Prescrição Assistida por IA */}
      {aiAssisted && (
        <p className="rounded-lg border p-3 text-sm">
          Sugestão gerada por IA — Revisão e aprovação profissional obrigatória
          antes de liberar ao aluno.
        </p>
      )}
      <AiFeature capability="planning">
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <h2 className="font-heading text-sm font-bold text-foreground">
                  Prescrição Assistida por IA
                </h2>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                Monte divisões e selecione exercícios canônicos ditando por voz,
                enviando uma ficha em PDF/foto ou descrevendo a estratégia para{" "}
                {athleteName}.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="h-10 rounded-xl font-heading text-xs font-bold gap-2 shadow-xs shrink-0"
            >
              <Sparkles className="size-3.5" />
              <span>Prescrever com IA</span>
            </Button>
          </div>
        </section>
      </AiFeature>

      {builderMode === "classic" && planSettings}
      <ViewModeToggle
        value={builderMode}
        onChange={changeMode}
        syncError={syncError}
      />
      {builderMode === "tactical" ? (
        !aiModalVisible && (
          <TacticalPlanWorkspace
            planName={name}
            onPlanNameChange={setName}
            planNameMaxLength={100}
            saveLabel="Salvar rascunho"
            settings={planSettings}
            onAi={() => setIsAiModalOpen(true)}
            onClassic={() => changeMode("classic")}
            syncError={syncError}
            onSave={() => void handleSave(false)}
            onReview={() => void handleSave(true)}
            reviewLabel="Revisar e enviar"
            error={error}
            activeIndex={activeDayIndex}
            onActiveChange={setActiveDayIndex}
            days={days}
            onChange={setDays}
            disabled={isPending}
          />
        )
      ) : (
        <WorkoutCardsWorkspace
          days={days}
          onChange={setDays}
          activeIndex={activeDayIndex}
          onActiveChange={setActiveDayIndex}
          disabled={isPending}
        />
      )}

      {/* Rodapé Fixo / Ações de Envio e Rascunho */}
      <div
        className="sticky z-20 space-y-2 rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-lg backdrop-blur-md"
        style={{ bottom: "var(--workout-builder-bottom, 1rem)" }}
      >
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <WorkoutPlanSummary days={days} />
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          {builderMode === "tactical" ? (
            <SealButton
              disabled={isPending}
              onSave={() => void handleSave(false)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="w-full sm:flex-1 h-11 rounded-xl font-heading text-xs font-semibold border-border/80"
            >
              {isPending && (
                <LoaderCircle className="size-3.5 animate-spin mr-1.5" />
              )}
              <span>Salvar Rascunho</span>
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            disabled={isPending}
            onClick={() => handleSave(true)}
            className="w-full sm:flex-1 h-11 rounded-xl font-heading text-xs font-bold gap-2 shadow-sm"
          >
            {isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span>Revisar e Aprovar Prescrição</span>
          </Button>
        </div>
      </div>
      {reviewOpen && (
        <WorkoutPlanReviewDialog
          name={name}
          days={days.map((day) => ({
            ...day,
            weekDay: day.weekDay ?? "MONDAY",
          }))}
          notes={notes}
          recipient={athleteName}
          allowStudentSubstitution={allowStudentSubstitution}
          confirmLabel="Confirmar e enviar ao aluno"
          onClose={() => setReviewOpen(false)}
          onConfirm={() => void handleSave(true, true)}
          pending={isPending}
        />
      )}

      <AiFeature capability="planning">
        <CoachAiPrescriptionModal
          athleteId={athleteId}
          athleteName={athleteName}
          isOpen={aiModalVisible}
          onClose={() => setIsAiModalOpen(false)}
          onApplyPrescription={(generated) => {
            setAiAssisted(true);
            setSavedDraft({
              id: generated.prescriptionId,
              version: generated.version,
            });
            setName(generated.name);
            if (generated.notes) {
              setNotes(generated.notes);
            }
            const generatedDays = trainingDaysOnly(generated.workoutDays).map(
              (day) => ({
                ...day,
                clientId: createClientDayId(),
              }),
            );
            setDays(generatedDays);
            setActiveDayIndex(0);
            setIsAiModalOpen(false);
          }}
        />
      </AiFeature>
    </fieldset>
  );
}
