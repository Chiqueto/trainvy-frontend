"use client";
import {
  ViewModeToggle,
  useBuilderMode,
} from "@/app/planning/_components/tactical/view-mode-toggle";
import { TacticalPlanWorkspace } from "@/app/planning/_components/tactical/tactical-plan-workspace";
import { WorkoutCardsWorkspace } from "@/app/planning/_components/workout-cards-workspace";
import { SealButton } from "@/app/planning/_components/tactical/seal-button";

import {
  AiFeature,
  useAiAvailability,
} from "@/app/_components/ai-availability-provider";

import { useState, useTransition } from "react";
import { trainingDaysOnly } from "@/app/_lib/training-days";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/use-hydrated";
import { Eye, LoaderCircle, Sparkles } from "lucide-react";

import {
  createStandaloneWorkoutPlanAction,
  createWorkoutPlanInPeriodizationAction,
  editWorkoutPlanAction,
} from "@/app/planning/_actions";
import {
  createInitialWorkoutDays,
  deserializeWorkoutDays,
  serializeWorkoutDays,
  validateWorkoutPlanDraft,
} from "@/app/planning/_lib/workout-plan-builder";
import {
  WorkoutPlanReviewDialog,
  WorkoutPlanSummary,
} from "./workout-plan-review-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AthleteAiWorkoutPlanModal } from "./athlete-ai-workout-plan-modal";
import type { GetEditableWorkoutPlan200 } from "@/app/_lib/api/fetch-generated";

interface WorkoutPlanBuilderProps {
  mode: "standalone" | "periodization" | "edit";
  initialPlan?: GetEditableWorkoutPlan200;
  periodizationId?: string;
  initialOpenAi?: boolean;
}

export function WorkoutPlanBuilder({
  mode,
  periodizationId,
  initialOpenAi = false,
  initialPlan,
}: WorkoutPlanBuilderProps) {
  const router = useRouter();
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const { builderMode, changeMode, syncError } = useBuilderMode();
  const hydrated = useHydrated();
  const [name, setName] = useState(initialPlan?.name ?? "");
  const [activate, setActivate] = useState(false);
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(() =>
    initialPlan
      ? deserializeWorkoutDays(initialPlan)
      : createInitialWorkoutDays().map((day) => ({ ...day, exercises: [] })),
  );
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(initialOpenAi);
  const { planningEnabled } = useAiAvailability();
  const aiModalVisible = planningEnabled && isAiModalOpen;
  const backHref =
    mode === "edit" && initialPlan
      ? `/workout-plans/${initialPlan.id}`
      : undefined;

  function submit(reviewOnly = false) {
    if (isPending) return;
    const validationError = validateWorkoutPlanDraft(
      name,
      days,
      mode === "periodization" ? plannedStartDate : undefined,
      mode === "periodization" ? plannedEndDate : undefined,
    );
    if (validationError) {
      setError(validationError);
      const invalidIndex = days.findIndex((day) =>
        validateWorkoutPlanDraft(name || "Plano", [day]),
      );
      if (invalidIndex >= 0) setActiveDayIndex(invalidIndex);
      return;
    }
    if (mode === "periodization" && !periodizationId) {
      setError("Periodização inválida.");
      return;
    }

    setError(undefined);
    if (reviewOnly) {
      setReviewOpen(true);
      return;
    }
    startTransition(async () => {
      try {
        const workoutDays = serializeWorkoutDays(days);
        const result =
          mode === "edit" && initialPlan
            ? await editWorkoutPlanAction(initialPlan.id, {
                name: name.trim(),
                workoutDays,
              })
            : mode === "standalone"
              ? await createStandaloneWorkoutPlanAction({
                  name: name.trim(),
                  workoutDays,
                  activate,
                })
              : await createWorkoutPlanInPeriodizationAction(periodizationId!, {
                  name: name.trim(),
                  workoutDays,
                  plannedStartDate: plannedStartDate || null,
                  plannedEndDate: plannedEndDate || null,
                  notes: notes.trim() || null,
                });

        if (!result.success) {
          setError(result.error);
          return;
        }

        const destination =
          mode === "edit" && initialPlan
            ? `/workout-plans/${initialPlan.id}`
            : mode === "standalone"
              ? "/planning"
              : `/planning/periodizations/${periodizationId}`;
        router.push(destination);
        router.refresh();
      } catch {
        setError(
          "Não foi possível salvar. Seus dados continuam aqui; tente novamente.",
        );
      }
    });
  }

  const planSettings = (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome do plano *
          <Input
            value={name}
            maxLength={120}
            placeholder="Ex.: Upper / Lower"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        {mode === "standalone" ? (
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={activate}
              onChange={(event) => setActivate(event.target.checked)}
              className="size-5 accent-primary"
            />
            Tornar este meu plano atual
          </label>
        ) : mode === "periodization" ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Início previsto
                <Input
                  type="date"
                  value={plannedStartDate}
                  onChange={(event) => setPlannedStartDate(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Fim previsto
                <Input
                  type="date"
                  value={plannedEndDate}
                  onChange={(event) => setPlannedEndDate(event.target.value)}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Notas da etapa
              <textarea
                value={notes}
                rows={3}
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </label>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            As alterações valem para os próximos treinos. As sessões já
            registradas serão preservadas.
          </p>
        )}
      </section>
    </>
  );

  return (
    <fieldset
      disabled={!hydrated || isPending}
      aria-busy={!hydrated || isPending}
      aria-label="Editor de plano de treino"
      className="flex min-w-0 flex-col gap-6"
    >
      {(builderMode === "classic" || aiModalVisible) && (
        <div className="sticky top-0 z-30 bg-background py-2">
          <ViewModeToggle
            value={builderMode}
            onChange={changeMode}
            syncError={syncError}
            backHref={backHref}
          />
        </div>
      )}
      {/* Banner de Geração com IA / Importação de Ficha */}
      <AiFeature capability="planning">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold text-foreground">
                Organize seus exercícios ou importe sua ficha com IA
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Fale por voz ou anexe o PDF/foto da sua ficha antiga da academia
              </p>
            </div>
          </div>
          <AiFeature capability="planning">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="h-8 px-3 rounded-xl font-heading text-xs font-bold gap-1.5 shadow-sm"
            >
              <Sparkles className="size-3.5" />
              <span>Gerar com IA</span>
            </Button>
          </AiFeature>
        </div>
      </AiFeature>

      {builderMode === "classic" && planSettings}

      {builderMode === "tactical" && !aiModalVisible && (
        <TacticalPlanWorkspace
          planName={name}
          onPlanNameChange={setName}
          settings={planSettings}
          onAi={() => setIsAiModalOpen(true)}
          onClassic={() => changeMode("classic")}
          backHref={backHref}
          syncError={syncError}
          onSave={() => submit()}
          onReview={() => submit(true)}
          error={error}
          activeIndex={activeDayIndex}
          onActiveChange={setActiveDayIndex}
          days={days}
          onChange={setDays}
          disabled={isPending}
        />
      )}
      {builderMode === "classic" && (
        <WorkoutCardsWorkspace
          days={days}
          onChange={setDays}
          activeIndex={activeDayIndex}
          onActiveChange={setActiveDayIndex}
          disabled={isPending}
        />
      )}

      <div
        className="sticky z-20 space-y-2 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-md"
        style={{ bottom: "var(--workout-builder-bottom, 1rem)" }}
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <WorkoutPlanSummary days={days} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => submit(true)}
            disabled={isPending}
            className="h-12 rounded-full sm:flex-1"
          >
            <Eye className="size-4" />
            Revisar ficha
          </Button>{" "}
          {builderMode === "tactical" ? (
            <SealButton
              disabled={isPending || !hydrated}
              onSave={() => submit()}
            />
          ) : (
            <Button
              type="button"
              className="h-12 w-full rounded-full text-sm font-semibold sm:flex-1"
              disabled={isPending}
              onClick={() => submit()}
            >
              {isPending && <LoaderCircle className="animate-spin" />}
              {isPending
                ? mode === "edit"
                  ? "Salvando..."
                  : "Criando..."
                : mode === "edit"
                  ? "Salvar alterações"
                  : mode === "standalone"
                    ? "Criar plano"
                    : "Criar plano e adicionar etapa"}
            </Button>
          )}
        </div>
      </div>
      {reviewOpen && (
        <WorkoutPlanReviewDialog
          name={name}
          days={days}
          notes={
            mode === "standalone"
              ? activate
                ? "Este plano será definido como seu plano atual."
                : "Este plano será salvo sem ser ativado."
              : notes
          }
          confirmLabel="Confirmar e salvar"
          onClose={() => setReviewOpen(false)}
          onConfirm={() => {
            setReviewOpen(false);
            submit();
          }}
          pending={isPending}
        />
      )}

      <AiFeature capability="planning">
        <AthleteAiWorkoutPlanModal
          isOpen={aiModalVisible}
          onClose={() => setIsAiModalOpen(false)}
          onApplyPlan={(data) => {
            if (data.name) setName(data.name);
            if (data.notes) setNotes(data.notes);
            if (data.workoutDays?.length) {
              setDays(trainingDaysOnly(data.workoutDays));
              setActiveDayIndex(0);
            }
          }}
        />
      </AiFeature>
    </fieldset>
  );
}
