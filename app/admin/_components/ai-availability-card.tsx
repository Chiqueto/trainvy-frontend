"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { GetAdminAiAvailability200 } from "@/app/_lib/api/fetch-generated";
import { updateAiAvailabilityAction } from "../_actions/ai-availability";

export function AiAvailabilityCard({
  initial,
}: {
  initial: GetAdminAiAvailability200 | null;
}) {
  const [policy, setPolicy] = useState(initial);
  const [professional, setProfessional] = useState(
    initial?.professionalAiEnabled ?? false,
  );
  const [athlete, setAthlete] = useState(initial?.athleteAiEnabled ?? false);
  const [message, setMessage] = useState("");
  const [busy, startTransition] = useTransition();
  function save() {
    if (!policy) return;
    startTransition(async () => {
      setMessage("");
      const result = await updateAiAvailabilityAction({
        professionalAiEnabled: professional,
        athleteAiEnabled: athlete,
        revision: policy.revision,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setPolicy(result.data);
      setMessage("Configuração salva.");
      window.dispatchEvent(new Event("ai-availability-changed"));
    });
  }
  return (
    <section className="mb-5 rounded-2xl border bg-card p-5 space-y-4">
      <h2 className="font-heading text-lg font-semibold">
        Disponibilidade da IA
      </h2>
      <p className="text-sm text-muted-foreground">
        Controles independentes. As permissões e cotas dos planos continuam
        valendo quando a IA está habilitada.
      </p>
      {!policy && (
        <p role="alert" className="text-sm text-destructive">
          Configuração indisponível. Confira a migration e atualize a página.
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="professional-ai" className="text-sm font-medium">
          IA para profissionais
        </label>
        <Switch
          id="professional-ai"
          aria-label="IA para profissionais"
          checked={professional}
          onCheckedChange={setProfessional}
          disabled={busy || !policy}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="athlete-ai" className="text-sm font-medium">
          IA para alunos
        </label>
        <Switch
          id="athlete-ai"
          aria-label="IA para alunos"
          checked={athlete}
          onCheckedChange={setAthlete}
          disabled={busy || !policy}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Desligar bloqueia novas chamadas e oculta os acessos correspondentes.
        Solicitações já enviadas podem terminar. Treinos e rascunhos existentes
        continuam disponíveis.
      </p>
      <Button
        onClick={save}
        disabled={
          busy ||
          !policy ||
          (professional === policy.professionalAiEnabled &&
            athlete === policy.athleteAiEnabled)
        }
      >
        {busy ? "Salvando..." : "Salvar disponibilidade da IA"}
      </Button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
