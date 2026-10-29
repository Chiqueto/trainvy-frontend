"use client";
import { submitProfessionalRegistrationAction } from "../_verification-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type GetProfessionalRegistration200,
  type SubmitProfessionalRegistrationBody,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
const labels: Record<string, string> = {
  PENDING_VERIFICATION: "Aguardando verificação",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
  EXPIRED: "Verificação expirada",
  SUSPENDED: "Suspenso",
};
export function ProfessionalRegistrationForm({
  registration,
}: {
  registration: GetProfessionalRegistration200;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          Verificação profissional
        </h1>
        <p className="text-sm text-muted-foreground">
          {labels[registration?.status ?? "PENDING_VERIFICATION"]}
        </p>
      </div>
      {registration && (
        <p className="text-sm">
          CREF {registration.cref}/{registration.region} ·{" "}
          {registration.category}
          <br />
          {registration.publicReason}
          {registration.validUntil && (
            <>
              {" "}
              · Validade:{" "}
              {new Date(registration.validUntil).toLocaleDateString("pt-BR")}
            </>
          )}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Informe seu nome conforme o registro. A equipe confere titularidade,
        situação e habilitação em fonte oficial. O preenchimento do CREF não
        libera os recursos profissionais.
      </p>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const form = new FormData(e.currentTarget);
          try {
            const result = await submitProfessionalRegistrationAction({
              fullName: String(form.get("fullName")),
              cref: String(form.get("cref")),
              region: String(
                form.get("region"),
              ) as SubmitProfessionalRegistrationBody["region"],
              category: String(form.get("category")),
            });
            setMessage(
              result.status === 200
                ? "Cadastro enviado para revisão."
                : "Revise os dados. Se necessário, procure o suporte.",
            );
            if (result.status === 200) router.refresh();
          } catch {
            setMessage("Não foi possível enviar. Tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="grid gap-1 text-sm">
          Nome completo
          <input
            className="rounded-lg border bg-background p-3"
            name="fullName"
            required
            minLength={5}
            maxLength={180}
            defaultValue={registration?.fullName}
          />
        </label>
        <label className="grid gap-1 text-sm">
          CREF (ex.: 123456-G)
          <input
            className="rounded-lg border bg-background p-3"
            name="cref"
            required
            pattern="[0-9]{4,8}-[GgPp]"
            defaultValue={registration?.cref}
          />
        </label>
        <label className="grid gap-1 text-sm">
          UF do registro
          <select
            className="rounded-lg border bg-background p-3"
            name="region"
            required
            defaultValue={registration?.region ?? ""}
          >
            <option value="">Selecione</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Categoria e habilitação declaradas
          <input
            className="rounded-lg border bg-background p-3"
            name="category"
            required
            minLength={3}
            maxLength={160}
            defaultValue={registration?.category}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Não inclua CPF, documentos de saúde ou dados de alunos. Alterar o
          cadastro exige uma nova revisão.
        </p>
        <Button disabled={busy}>
          {busy ? "Enviando…" : "Enviar para verificação"}
        </Button>
        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}
