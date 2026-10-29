"use client";
import { reviewProfessionalRegistrationAction } from "./_actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type ListProfessionalRegistrations200Item,
  type ReviewProfessionalRegistrationBody,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { officialCrefSource } from "./official-sources";
export function ProfessionalReview({
  registration: r,
}: {
  registration: ListProfessionalRegistrations200Item;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      className="rounded-2xl border bg-card p-5 grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          const result = await reviewProfessionalRegistrationAction(r.userId, {
            revision: r.revision,
            result: String(
              data.get("result"),
            ) as ReviewProfessionalRegistrationBody["result"],
            sourceUrl: String(data.get("sourceUrl")),
            evidence: String(data.get("evidence")),
            publicReason: String(data.get("publicReason")),
            checkedAt: new Date().toISOString(),
            identityMatched: data.has("identityMatched"),
            identityVerificationMethod: String(
              data.get("identityVerificationMethod"),
            ) as ReviewProfessionalRegistrationBody["identityVerificationMethod"],
            identityEvidenceReference: String(
              data.get("identityEvidenceReference"),
            ),
            registrationActive: data.has("registrationActive"),
            scopeConfirmed: data.has("scopeConfirmed"),
          });
          setMessage(
            result.status === 200
              ? "Revisão registrada."
              : ((result.data as { error?: string }).error ??
                  "Não foi possível registrar."),
          );
          if (result.status === 200) router.refresh();
        } catch {
          setMessage("Falha na comunicação.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-semibold">
        {r.fullName} · {r.cref}/{r.region}
      </h2>
      <p className="text-sm">
        {r.category} · {r.status} · Revisão {r.revision}
      </p>
      <a
        className="text-sm underline"
        href={officialCrefSource(r.region).url}
        target="_blank"
        rel="noreferrer"
      >
        {officialCrefSource(r.region).name}
      </a>
      <label className="grid gap-1 text-sm">
        Resultado
        <select name="result" className="border rounded-lg bg-background p-3">
          <option value="PENDING_VERIFICATION">
            Pendente / fonte indisponível
          </option>
          <option value="VERIFIED">Verificado</option>
          <option value="REJECTED">Rejeitado</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="EXPIRED">Expirado</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        URL oficial consultada
        <input
          name="sourceUrl"
          defaultValue={officialCrefSource(r.region).url}
          type="url"
          required
          className="border rounded-lg bg-background p-3"
        />
      </label>
      {[
        ["identityMatched", "Titularidade e nome conferidos"],
        ["registrationActive", "Registro ativo confirmado"],
        ["scopeConfirmed", "Categoria e habilitação compatíveis confirmadas"],
      ].map(([key, label]) => (
        <label key={key} className="flex gap-2 text-sm">
          <input name={key} type="checkbox" />
          {label}
        </label>
      ))}
      <p className="text-sm text-muted-foreground">
        Nome e CREF são dados públicos e não provam que a conta pertence ao
        titular. Confirme a identidade por procedimento seguro antes de aprovar.
      </p>
      <label className="grid gap-1 text-sm">
        Método de conferência da titularidade
        <select
          name="identityVerificationMethod"
          className="border rounded-lg bg-background p-3"
        >
          <option value="NOT_CONFIRMED">
            Titularidade ainda não confirmada
          </option>
          <option value="OFFICIAL_CONTACT">
            Confirmação por contato oficial
          </option>
          <option value="DOCUMENT_REVIEW">Revisão documental restrita</option>
          <option value="LIVE_IDENTITY_CHECK">
            Conferência de identidade assistida
          </option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Referência restrita da conferência
        <input
          name="identityEvidenceReference"
          required
          minLength={3}
          maxLength={200}
          className="border rounded-lg bg-background p-3"
          placeholder="Protocolo interno, sem CPF ou cópia de documento"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Evidência mínima (acesso restrito)
        <textarea
          name="evidence"
          minLength={10}
          maxLength={1500}
          required
          className="border rounded-lg bg-background p-3"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Descreva apenas a conferência e a referência oficial. Não copie CPF ou
        dados pessoais desnecessários.
      </p>
      <label className="grid gap-1 text-sm">
        Orientação visível ao profissional
        <input
          name="publicReason"
          minLength={3}
          maxLength={400}
          required
          className="border rounded-lg bg-background p-3"
        />
      </label>
      <Button disabled={busy}>
        {busy ? "Registrando…" : "Registrar revisão"}
      </Button>
      <p role="status">{message}</p>
    </form>
  );
}
