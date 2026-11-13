"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog } from "radix-ui";
import { CircleHelp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeTourAction, loadToursAction } from "../_tour-actions";

const workspaceSteps = [
  {
    title: "Sua assessoria começa aqui",
    text: "Vamos conhecer os atalhos para cadastrar alunos, preparar treinos e acompanhar sua assessoria. Você pode pular e rever este guia quando quiser.",
  },
  {
    title: "Cadastre seu primeiro aluno",
    text: "Em Cadastrar aluno, informe o nome e comece a preparar as fichas, mesmo que ele ainda não tenha conta. Se preferir, use Convidar aluno para enviar apenas um convite.",
    target: '[data-tour="student-actions"]',
  },
  {
    title: "Abra o aluno para montar o treino",
    text: "Selecione um aluno nesta lista e abra suas prescrições para criar uma ficha. No cadastro sem conta, use Vincular conta para gerar o convite: após o aceite, as fichas ficam vinculadas à conta dele.",
    target: '[data-tour="athletes"]',
  },
  {
    title: "Reaproveite seu trabalho",
    text: "Em Modelos de Treino, salve suas divisões para usar com outros alunos. Em Exercícios Personalizados, cadastre os movimentos que faltam no catálogo.",
    target: '[data-tour="personal-tabs"]',
  },
  {
    title: "Acompanhe os próximos passos",
    text: "Consulte os convites enviados aqui. Depois que o aluno entrar e autorizar o compartilhamento, acompanhe sua evolução na página dele.",
    target: '[data-tour="invitations"]',
  },
];
const builderSteps = [
  {
    title: "Conheça o novo editor de treinos",
    text: "O deck 3D organiza sua ficha em um espaço visual. Este guia apresenta os controles; depois você pode explorar no seu ritmo.",
  },
  {
    title: "Organize a divisão",
    text: "Selecione os treinos A, B, C… e use o botão + para adicionar outro treino. Cada treino tem sua própria sequência de exercícios.",
    target: '[data-tour="builder-days"]',
  },
  {
    title: "Monte a ficha no espaço visual",
    text: "Adicione exercícios pelo catálogo e selecione os cartões para ajustar séries, repetições, carga e descanso. No espaço 3D, arraste os cartões para organizar a mesa; confira a ordem da ficha antes de salvar.",
    target: '[data-tour="builder-arena"]',
  },
  {
    title: "Escolha sua visualização",
    text: "Escolha Deck 3D para organizar os exercícios na mesa ou Cards para editar no formulário tradicional. A ficha é a mesma e sua preferência fica salva.",
    target: '[data-tour="builder-views"]',
  },
  {
    title: "Salve e revise antes de enviar",
    text: "Salve o rascunho para continuar depois. Na prescrição de um aluno, revise e aprove o treino antes de enviar. Você também pode preparar a ficha antes de ele criar uma conta.",
    target: '[data-tour="builder-save"]',
  },
];

export function CoachGuidedTour({ tour }: { tour: "workspace" | "builder" }) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const steps: { title: string; text: string; target?: string }[] =
    tour === "workspace" ? workspaceSteps : builderSteps;
  const current = steps[step];

  useEffect(() => {
    let alive = true;
    loadToursAction()
      .then((state) => {
        if (!alive || !state) return;
        setAvailable(true);
        setOpen(
          !(tour === "workspace"
            ? state.coachOnboardingCompleted
            : state.workoutBuilderOnboardingCompleted),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tour]);

  useEffect(() => {
    if (!open || !current.target) return;
    const target = Array.from(
      document.querySelectorAll<HTMLElement>(current.target),
    ).find((element) => element.getClientRects().length > 0);
    if (!target) return;
    target.scrollIntoView?.({ block: "center", behavior: "instant" });
    const update = () => {
      const box = target.getBoundingClientRect();
      setRect({
        top: Math.max(4, box.top - 4),
        left: Math.max(4, box.left - 4),
        width: Math.min(box.width + 8, window.innerWidth - 8),
        height: Math.min(box.height + 8, window.innerHeight - 8),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      setRect(null);
    };
  }, [open, current.target]);

  function finish() {
    startTransition(async () => {
      const saved = await completeTourAction(tour);
      setOpen(false);
      if (!saved)
        toast.error(
          "Guia fechado. Não foi possível salvar sua escolha; ele pode aparecer no próximo acesso.",
        );
    });
  }
  if (!available) return null;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) finish();
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep(0);
            setOpen(true);
          }}
          className="gap-2 text-xs"
        >
          <CircleHelp className="size-4" />
          {tour === "workspace" ? "Rever guia" : "Guia do editor"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55" />
        {rect && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[81] rounded-xl border-2 border-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.5)]"
            style={rect}
          />
        )}
        <Dialog.Content
          onPointerDownOutside={(event) => event.preventDefault()}
          className="fixed bottom-4 left-1/2 z-[82] max-h-[65dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none sm:bottom-8"
        >
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Guia do personal
            </span>
            <span aria-live="polite">
              {step + 1} de {steps.length}
            </span>
          </div>
          <div className="mb-4 flex gap-1" aria-hidden="true">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <Dialog.Title className="font-heading text-lg font-bold">
            {current.title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {current.text}
          </Dialog.Description>
          <div className="mt-5 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={finish}
            >
              Pular
            </Button>
            <div className="ml-auto flex gap-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setStep(step - 1)}
                >
                  Voltar
                </Button>
              )}
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  step === steps.length - 1 ? finish() : setStep(step + 1)
                }
              >
                {pending
                  ? "Salvando…"
                  : step === steps.length - 1
                    ? "Concluir"
                    : "Próximo"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
