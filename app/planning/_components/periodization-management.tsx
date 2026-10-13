"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Dumbbell,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { GetPlanningOverview200PlansItem } from "@/app/_lib/api/fetch-generated";
import {
  addWorkoutPlanToPeriodizationAction,
  deletePeriodizationAction,
  updatePeriodizationAction,
} from "@/app/planning/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanningConfirmDialog } from "./planning-confirm-dialog";

type PeriodizationStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
type DialogKind = "edit" | "add" | "delete" | null;

interface PeriodizationManagementProps {
  id: string;
  status: PeriodizationStatus;
  name: string;
  goal: string | null;
  notes: string | null;
  plans: GetPlanningOverview200PlansItem[];
}

export function PeriodizationManagement({
  id,
  status,
  name,
  goal,
  notes,
  plans,
}: PeriodizationManagementProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editGoal, setEditGoal] = useState(goal ?? "");
  const [editNotes, setEditNotes] = useState(notes ?? "");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [blockNotes, setBlockNotes] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | undefined
  >();
  const [isPending, startTransition] = useTransition();

  const eligiblePlans = useMemo(
    () => plans.filter((plan) => !plan.isActive && plan.periodization === null),
    [plans],
  );

  function openEdit() {
    setEditName(name);
    setEditGoal(goal ?? "");
    setEditNotes(notes ?? "");
    setFeedback(undefined);
    setDialog("edit");
  }

  function openAddExisting() {
    setIsAddMenuOpen(false);
    setFeedback(undefined);
    setSelectedPlanId("");
    setPlannedStartDate("");
    setPlannedEndDate("");
    setBlockNotes("");
    setDialog("add");
  }

  function saveMetadata() {
    if (!editName.trim()) {
      setFeedback({
        kind: "error",
        message: "Informe o nome da periodização.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updatePeriodizationAction(id, {
        name: editName,
        goal: editGoal.trim() || null,
        notes: editNotes.trim() || null,
      });
      if (!result.success) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setDialog(null);
      setFeedback({
        kind: "success",
        message: "Dados atualizados com sucesso.",
      });
      router.refresh();
    });
  }

  function addExistingPlan() {
    if (!selectedPlanId) {
      setFeedback({ kind: "error", message: "Escolha um plano." });
      return;
    }
    if (
      plannedStartDate &&
      plannedEndDate &&
      plannedEndDate < plannedStartDate
    ) {
      setFeedback({
        kind: "error",
        message: "A data final não pode ser anterior à data inicial.",
      });
      return;
    }

    startTransition(async () => {
      const result = await addWorkoutPlanToPeriodizationAction(id, {
        workoutPlanId: selectedPlanId,
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
        notes: blockNotes.trim() || null,
      });
      if (!result.success) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setDialog(null);
      setFeedback({
        kind: "success",
        message: "Plano adicionado como nova etapa.",
      });
      router.refresh();
    });
  }

  function deleteDraft() {
    startTransition(async () => {
      const result = await deletePeriodizationAction(id);
      if (!result.success) {
        setDialog(null);
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      router.push("/planning");
      router.refresh();
    });
  }

  return (
    <section
      aria-label="Gerenciar periodização"
      className="flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-11 rounded-full"
          onClick={openEdit}
        >
          <Pencil />
          Editar
        </Button>

        {status !== "COMPLETED" && (
          <div className="relative">
            <Button
              className="h-11 w-full rounded-full"
              onClick={() => setIsAddMenuOpen((open) => !open)}
              aria-expanded={isAddMenuOpen}
            >
              <Plus />
              Adicionar etapa
            </Button>
            {isAddMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Fechar opções"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsAddMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-60 rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-accent"
                    onClick={openAddExisting}
                  >
                    <Dumbbell className="size-4 text-primary" />
                    Usar plano existente
                  </button>
                  <Link
                    href={`/planning/periodizations/${id}/plans/new`}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-accent"
                  >
                    <Plus className="size-4 text-primary" />
                    Criar novo plano
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        className="h-11 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDialog("delete")}
      >
        <Trash2 />
        Excluir periodização definitivamente
      </Button>

      {feedback && !dialog && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
            feedback.kind === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {feedback.kind === "success" && <CheckCircle2 className="size-4" />}
          {feedback.message}
        </p>
      )}

      {dialog === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-periodization-title"
            className="flex max-h-[90svh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl bg-card p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="edit-periodization-title"
                className="font-heading text-base font-semibold"
              >
                Editar periodização
              </h2>
              <button
                type="button"
                aria-label="Fechar"
                disabled={isPending}
                onClick={() => setDialog(null)}
                className="flex size-11 items-center justify-center rounded-full hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome *
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Objetivo
              <Input
                value={editGoal}
                onChange={(event) => setEditGoal(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Observações
              <textarea
                value={editNotes}
                rows={4}
                onChange={(event) => setEditNotes(event.target.value)}
                className="min-h-28 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {feedback?.kind === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-full"
                disabled={isPending}
                onClick={() => setDialog(null)}
              >
                Cancelar
              </Button>
              <Button
                className="h-11 rounded-full"
                disabled={isPending}
                onClick={saveMetadata}
              >
                {isPending && <LoaderCircle className="animate-spin" />}
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {dialog === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-plan-title"
            className="flex max-h-[90svh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl bg-card p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="add-plan-title"
                className="font-heading text-base font-semibold"
              >
                Escolha um plano
              </h2>
              <button
                type="button"
                aria-label="Fechar"
                disabled={isPending}
                onClick={() => setDialog(null)}
                className="flex size-11 items-center justify-center rounded-full hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            {eligiblePlans.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nenhum plano inativo e standalone está disponível.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {eligiblePlans.map((plan) => (
                  <label
                    key={plan.id}
                    className="flex min-h-14 items-center gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="eligible-plan"
                      value={plan.id}
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="size-5 accent-primary"
                    />
                    <span className="text-sm">
                      <span className="block font-semibold">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {plan.workoutDaysCount}{" "}
                        {plan.workoutDaysCount === 1 ? "dia" : "dias"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

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
              Notas
              <textarea
                value={blockNotes}
                rows={3}
                onChange={(event) => setBlockNotes(event.target.value)}
                className="min-h-24 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {feedback?.kind === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-full"
                disabled={isPending}
                onClick={() => setDialog(null)}
              >
                Cancelar
              </Button>
              <Button
                className="h-11 rounded-full"
                disabled={isPending || eligiblePlans.length === 0}
                onClick={addExistingPlan}
              >
                {isPending && <LoaderCircle className="animate-spin" />}
                {isPending ? "Adicionando..." : "Adicionar etapa"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PlanningConfirmDialog
        open={dialog === "delete"}
        title="Excluir periodização definitivamente?"
        description={
          <>
            <p>Esta periodização nunca mais será exibida para você.</p>
            <p className="mt-2 text-muted-foreground">
              Os planos de treino vinculados continuarão disponíveis separadamente e o histórico de treinos já realizados será preservado.
            </p>
          </>
        }
        confirmLabel="Excluir definitivamente"
        pendingLabel="Excluindo..."
        destructive
        isPending={isPending}
        onCancel={() => setDialog(null)}
        onConfirm={deleteDraft}
      />
    </section>
  );
}
