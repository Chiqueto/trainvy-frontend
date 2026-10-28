"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, DropdownMenu } from "radix-ui";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  LoaderCircle,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";

import type { GetPlanningOverview200PlansItem } from "@/app/_lib/api/fetch-generated";
import {
  activateWorkoutPlanAction,
  deactivateWorkoutPlanAction,
  deleteWorkoutPlanAction,
  duplicateWorkoutPlanAction,
} from "@/app/planning/_actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanningConfirmDialog } from "./planning-confirm-dialog";

type DialogKind = "activate" | "deactivate" | "duplicate" | "delete" | null;

interface WorkoutPlanCardProps {
  plan: GetPlanningOverview200PlansItem;
}

export function WorkoutPlanCard({ plan }: WorkoutPlanCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [copyName, setCopyName] = useState(`${plan.name} - Cópia`);
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | undefined
  >();
  const [isPending, startTransition] = useTransition();

  const isStandalone = plan.periodization === null;
  const isStandaloneActive = plan.isActive && isStandalone;

  function openDialog(kind: Exclude<DialogKind, null>) {
    setFeedback(undefined);
    setIsMenuOpen(false);
    setDialog(kind);
    if (kind === "duplicate") setCopyName(`${plan.name} - Cópia`);
  }

  function handleMutation() {
    if (!dialog) return;

    startTransition(async () => {
      const result =
        dialog === "activate"
          ? await activateWorkoutPlanAction(plan.id)
          : dialog === "deactivate"
            ? await deactivateWorkoutPlanAction(plan.id)
            : dialog === "duplicate"
              ? await duplicateWorkoutPlanAction(plan.id, copyName)
              : await deleteWorkoutPlanAction(plan.id);

      if (!result.success) {
        setFeedback({ kind: "error", message: result.error });
        setDialog(null);
        return;
      }

      const successMessage =
        dialog === "activate"
          ? "Plano ativado com sucesso."
          : dialog === "deactivate"
            ? "Plano desativado com sucesso."
            : dialog === "duplicate"
              ? "Cópia criada como plano inativo."
              : "Plano de treino excluído definitivamente.";

      setFeedback({ kind: "success", message: successMessage });
      setDialog(null);
      router.refresh();
    });
  }

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        isStandaloneActive
          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card shadow-sm"
          : "border-border/80 bg-card hover:border-primary/40 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/workout-plans/${plan.id}`}
          className="group min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                {plan.name}
              </h3>

              {isStandaloneActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-heading text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PLANO ATUAL
                </span>
              )}

              {plan.periodization && (
                <Badge
                  variant={
                    plan.periodization.status === "ACTIVE"
                      ? "default"
                      : plan.periodization.status === "COMPLETED"
                        ? "outline"
                        : "secondary"
                  }
                  className="rounded-full px-2 py-0 text-[10px] font-semibold"
                >
                  {plan.periodization.status === "ACTIVE"
                    ? "Em andamento"
                    : plan.periodization.status === "COMPLETED"
                      ? "Concluído"
                      : "Planejado"}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted/60 px-2 py-0.5 font-heading text-[11px] font-medium text-foreground/80">
                {plan.workoutDaysCount}{" "}
                {plan.workoutDaysCount === 1 ? "dia" : "dias"}
              </span>
              {plan.periodization && (
                <span className="font-heading text-[11px] text-muted-foreground">
                  Ciclo:{" "}
                  <span className="font-semibold text-foreground/90">
                    {plan.periodization.name}
                  </span>{" "}
                  (Etapa {plan.periodization.order})
                </span>
              )}
            </div>
          </div>
        </Link>

        <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`Ações do plano ${plan.name}`}
              disabled={isPending}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <MoreHorizontal className="size-5" />
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              collisionPadding={{ top: 12, right: 12, bottom: 100, left: 12 }}
              className="z-[60] max-h-[var(--radix-dropdown-menu-content-available-height)] w-60 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href={`/workout-plans/${plan.id}`}
                  className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition hover:bg-accent"
                >
                  <ChevronRight className="size-4" />
                  Ver plano
                </Link>
              </DropdownMenu.Item>

              {isStandalone && (
                <DropdownMenu.Item
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium outline-none transition focus:bg-accent"
                  onSelect={() =>
                    openDialog(isStandaloneActive ? "deactivate" : "activate")
                  }
                >
                  {isStandaloneActive ? (
                    <PauseCircle className="size-4" />
                  ) : (
                    <PlayCircle className="size-4" />
                  )}
                  {isStandaloneActive ? "Desativar plano" : "Ativar plano"}
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Item
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium outline-none transition focus:bg-accent"
                onSelect={() => openDialog("duplicate")}
              >
                <Copy className="size-4" />
                Duplicar
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border/60" />

              <DropdownMenu.Item
                className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium text-destructive outline-none transition focus:bg-destructive/10"
                onSelect={() => openDialog("delete")}
              >
                <Trash2 className="size-4 text-destructive" />
                Excluir definitivamente
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`mt-3 flex items-center gap-1.5 border-t border-border/50 pt-3 text-xs ${
            feedback.kind === "error" ? "text-destructive" : "text-primary"
          }`}
        >
          {feedback.kind === "success" && <CheckCircle2 className="size-3.5" />}
          {feedback.message}
        </p>
      )}

      <PlanningConfirmDialog
        open={dialog === "activate"}
        title="Ativar plano"
        description="Tornar este seu plano atual?"
        confirmLabel="Ativar plano"
        pendingLabel="Ativando..."
        isPending={isPending}
        onCancel={() => setDialog(null)}
        onConfirm={handleMutation}
      />

      <PlanningConfirmDialog
        open={dialog === "deactivate"}
        title="Desativar plano"
        description={
          <>
            <p>Você ficará sem um plano ativo.</p>
            <p className="mt-2">Treinos avulsos continuarão disponíveis.</p>
          </>
        }
        confirmLabel="Desativar plano"
        pendingLabel="Desativando..."
        isPending={isPending}
        onCancel={() => setDialog(null)}
        onConfirm={handleMutation}
      />

      <PlanningConfirmDialog
        open={dialog === "delete"}
        title="Excluir plano definitivamente"
        destructive
        description={
          <>
            <p>
              Tem certeza que deseja excluir o plano &ldquo;{plan.name}&rdquo;?
            </p>
            <p className="mt-2 text-muted-foreground">
              Ele nunca mais será exibido para você. Treinos já concluídos no
              histórico continuarão preservados.
            </p>
          </>
        }
        confirmLabel="Excluir definitivamente"
        pendingLabel="Excluindo..."
        isPending={isPending}
        onCancel={() => setDialog(null)}
        onConfirm={handleMutation}
      />

      <Dialog.Root
        open={dialog === "duplicate"}
        onOpenChange={(open) => {
          if (!open && !isPending) setDialog(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6"
            onEscapeKeyDown={(event) => {
              if (isPending) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (isPending) event.preventDefault();
            }}
          >
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-heading text-base font-semibold text-foreground">
                Duplicar plano
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                A cópia será criada inativa e fora de periodizações.
              </Dialog.Description>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Nome da cópia
              <Input
                value={copyName}
                disabled={isPending}
                autoFocus
                maxLength={120}
                onChange={(event) => setCopyName(event.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full"
                disabled={isPending}
                onClick={() => setDialog(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-11 rounded-full"
                disabled={isPending || copyName.trim().length === 0}
                onClick={handleMutation}
              >
                {isPending && <LoaderCircle className="size-4 animate-spin" />}
                {isPending ? "Duplicando..." : "Criar cópia"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
