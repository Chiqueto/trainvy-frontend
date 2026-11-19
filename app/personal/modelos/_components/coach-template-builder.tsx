"use client";
import {
  ViewModeToggle,
  useBuilderMode,
} from "@/app/planning/_components/tactical/view-mode-toggle";
import { TacticalPlanWorkspace } from "@/app/planning/_components/tactical/tactical-plan-workspace";
import { WorkoutCardsWorkspace } from "@/app/planning/_components/workout-cards-workspace";
import { SealButton } from "@/app/planning/_components/tactical/seal-button";

import { trainingDaysOnly } from "@/app/_lib/training-days";
import { serializeAdvancedPrescription } from "@/app/planning/_lib/workout-plan-builder";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, Save, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  createTemplateAction,
  updateTemplateAction,
} from "@/app/personal/_actions";
import {
  createInitialWorkoutDays,
  validateWorkoutPlanDraft,
  WEEK_DAYS,
  type WorkoutPlanDraftDay,
  type WorkoutPlanDraftExercise,
} from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InitialTemplateData {
  id?: string;
  name: string;
  description?: string | null;
  tags?: string[];
  workoutDays?: Array<{
    name: string;
    order?: number;
    weekDay?: (typeof WEEK_DAYS)[number]["value"];
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      exerciseId?: string | null;
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

interface CoachTemplateBuilderProps {
  initialData?: InitialTemplateData;
}

export function CoachTemplateBuilder({
  initialData,
}: CoachTemplateBuilderProps) {
  const router = useRouter();
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const { builderMode, changeMode, syncError } = useBuilderMode();
  const isEditing = Boolean(initialData?.id);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [tagsInput, setTagsInput] = useState(
    (initialData?.tags ?? []).join(", "),
  );

  const [days, setDays] = useState<WorkoutPlanDraftDay[]>(() => {
    if (initialData?.workoutDays && initialData.workoutDays.length > 0) {
      return trainingDaysOnly(initialData.workoutDays).map((d) => ({
        name: d.name,
        weekDay: d.weekDay ?? "MONDAY",
        isRest: d.isRest,
        estimatedDurationInMinutes: Math.max(
          1,
          Math.round(d.estimatedDurationInSeconds / 60),
        ),
        exercises: (d.exercises ?? []).map((e) => ({
          ...e,
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
    return createInitialWorkoutDays().map((day) => ({
      ...day,
      weekDay: "MONDAY" as const,
      exercises: [],
    }));
  });

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
        const exName = exercise.name.trim();
        let alt1 = exercise.alternative1Name?.trim() || null;
        let alt2 = exercise.alternative2Name?.trim() || null;

        if (alt1 && alt1.toLowerCase() === exName.toLowerCase()) alt1 = null;
        if (alt2 && alt2.toLowerCase() === exName.toLowerCase()) alt2 = null;
        if (alt1 && alt2 && alt1.toLowerCase() === alt2.toLowerCase())
          alt2 = null;
        if (!alt1 && alt2) {
          alt1 = alt2;
          alt2 = null;
        }

        return {
          exerciseId: exercise.exerciseId,
          alternative1ExerciseId: exercise.alternative1ExerciseId,
          alternative2ExerciseId: exercise.alternative2ExerciseId,
          name: exName,
          order: exerciseIndex,
          sets: exercise.sets,
          warmupSets: exercise.warmupSets ?? 0,
          reps: exercise.reps,
          ...serializeAdvancedPrescription(exercise),
          restTimeInSeconds: exercise.restTimeInSeconds,
          alternative1ExerciseName: alt1,
          alternative2ExerciseName: alt2,
        };
      }),
    }));
  }

  async function handleSave() {
    if (isPending) return;
    const validationError = validateWorkoutPlanDraft(name, days);
    if (validationError) {
      const invalidIndex = days.findIndex((day) =>
        validateWorkoutPlanDraft(name || "Modelo", [day]),
      );
      if (invalidIndex >= 0) setActiveDayIndex(invalidIndex);
      toast.error(validationError);
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        workoutDays: serializeDaysForApi(),
      };

      if (isEditing && initialData?.id) {
        const res = await updateTemplateAction(initialData.id, payload);
        if (res.success) {
          toast.success("Modelo de treino atualizado com sucesso!");
          router.push("/personal/modelos");
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createTemplateAction(payload);
        if (res.success) {
          toast.success("Modelo de treino criado com sucesso!");
          router.push("/personal/modelos");
        } else {
          toast.error(res.error);
        }
      }
    });
  }

  const planSettings = (
    <>
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              {isEditing ? "Editar Modelo de Treino" : "Novo Modelo de Treino"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure a estrutura dos dias e exercícios deste modelo
              reutilizável.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label
              htmlFor="template-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nome do Modelo *
            </Label>
            <Input
              id="template-name"
              placeholder="Ex: ABC Hipertrofia Clássico"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="template-description"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Descrição (Opcional)
            </Label>
            <Input
              id="template-description"
              placeholder="Ex: Foco em sobrecarga progressiva e descanso de 90s"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="template-tags"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Tags (Separadas por vírgula)
            </Label>
            <Input
              id="template-tags"
              placeholder="Ex: Hipertrofia, Intermediário, ABC"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-11 rounded-xl bg-background"
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/personal/modelos"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Voltar para Modelos</span>
        </Link>

        <Button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="rounded-xl h-10 px-5 font-heading font-semibold shadow-xs"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="size-4" />
              <span>{isEditing ? "Salvar Alterações" : "Salvar Modelo"}</span>
            </div>
          )}
        </Button>
      </div>

      {/* Dados Gerais do Modelo */}
      {builderMode === "classic" && planSettings}
      {/* Dias de Treino */}
      <ViewModeToggle
        value={builderMode}
        onChange={changeMode}
        syncError={syncError}
      />
      {builderMode === "tactical" ? (
        <TacticalPlanWorkspace
          planName={name}
          onPlanNameChange={setName}
          planNameMaxLength={100}
          saveLabel="Salvar modelo"
          settings={planSettings}
          onClassic={() => changeMode("classic")}
          syncError={syncError}
          onSave={() => void handleSave()}
          activeIndex={activeDayIndex}
          onActiveChange={setActiveDayIndex}
          days={days}
          onChange={setDays}
          disabled={isPending}
        />
      ) : (
        <WorkoutCardsWorkspace
          days={days}
          onChange={setDays}
          activeIndex={activeDayIndex}
          onActiveChange={setActiveDayIndex}
          disabled={isPending}
        />
      )}

      {/* Rodapé com Botão Salvar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        <Link href="/personal/modelos">
          <Button variant="outline" className="rounded-xl h-11 px-5">
            Cancelar
          </Button>
        </Link>
        {builderMode === "tactical" ? (
          <SealButton disabled={isPending} onSave={() => void handleSave()} />
        ) : (
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="rounded-xl h-11 px-7 font-heading font-semibold shadow-xs"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="size-4" />
                <span>{isEditing ? "Salvar Alterações" : "Salvar Modelo"}</span>
              </div>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
