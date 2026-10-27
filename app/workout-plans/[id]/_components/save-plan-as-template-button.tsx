"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Layers, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTemplateFromPlanAction } from "@/app/personal/_actions";

interface SavePlanAsTemplateButtonProps {
  planId: string;
  planName: string;
}

export function SavePlanAsTemplateButton({
  planId,
  planName,
}: SavePlanAsTemplateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const res = await createTemplateFromPlanAction(planId, {
        name: planName,
        description: `Importado de treinos pessoais: ${planName}`,
      });

      if (res.success) {
        toast.success(`Treino "${planName}" salvo como modelo pré-definido!`);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={isPending || saved}
      className="rounded-xl h-9 px-3.5 text-xs font-heading font-semibold gap-1.5 border-border/80 bg-background/80 hover:bg-muted shadow-xs backdrop-blur-xs"
    >
      {isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Salvando modelo...</span>
        </>
      ) : saved ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span className="text-emerald-500">Modelo Salvo!</span>
        </>
      ) : (
        <>
          <Layers className="size-3.5 text-primary" />
          <span>Salvar como Modelo</span>
        </>
      )}
    </Button>
  );
}
