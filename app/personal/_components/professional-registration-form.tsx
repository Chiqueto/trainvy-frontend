"use client";
import {
  declareProfessionalCredentialsAction as declareProfessionalCredentials,
  getMyLegalDocumentsAction as getMyLegalDocuments,
} from "@/app/_actions/legal";
import { useEffect } from "react";
import { LegalDocumentReader } from "@/app/_components/legal-document-reader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type GetProfessionalRegistration200,
  type SubmitProfessionalRegistrationBody,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { maskCpf, maskCref } from "@/app/_lib/professional-input-masks";

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
  UNVERIFIED_SANDBOX: "Preencha seu cadastro profissional para continuar",
  DECLARED_ACTIVE: "Credenciais declaradas — sujeito a auditoria",
  VERIFIED_ADMIN: "Verificado pela administração",
  SUSPENDED_FRAUD: "Suspenso — revisão administrativa necessária",
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
  const [cpf, setCpf] = useState("");
  const [cref, setCref] = useState(maskCref(registration?.cref ?? ""));
  const [term, setTerm] = useState<{
    version: string;
    contentHash: string;
    contentMd: string;
  } | null>(null);
  useEffect(() => {
    getMyLegalDocuments()
      .then((res) => {
        if (res.status === 200)
          setTerm(
            res.data.find(
              (d) => d.slug === "declaracao-responsabilidade-cref",
            ) ?? null,
          );
      })
      .catch(() => setMessage("Falha ao carregar o termo."));
  }, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          Verificação profissional
        </h1>
        <p className="text-sm text-muted-foreground">
          {
            labels[
              registration?.crefVerificationStatus ??
                registration?.status ??
                "UNVERIFIED_SANDBOX"
            ]
          }
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
        Declare CPF e CREF/UF e aceite a responsabilidade técnica para liberar
        prescrições conforme seu plano. A declaração está sujeita a auditoria.
      </p>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const form = new FormData(e.currentTarget);
          try {
            if (!term) throw new Error("Termo indisponível");
            const result = await declareProfessionalCredentials({
              cpf: cpf.replace(/\D/g, ""),
              acceptance: {
                accepted: true,
                version: term.version,
                contentHash: term.contentHash,
              },
              fullName: String(form.get("fullName")),
              cref,
              region: String(
                form.get("region"),
              ) as SubmitProfessionalRegistrationBody["region"],
              category: String(form.get("category")),
            });
            setMessage(
              result.status === 200
                ? "Declaração registrada. Recursos profissionais liberados conforme seu plano."
                : "Revise os dados. Se necessário, procure o suporte.",
            );
            if (result.status === 200) {
              setCpf("");
              router.refresh();
            }
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
          CPF
          <input
            className="rounded-lg border bg-background p-3"
            name="cpf"
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
            value={cpf}
            onChange={(event) => setCpf(maskCpf(event.target.value))}
            disabled={busy}
          />
        </label>
        <label className="grid gap-1 text-sm">
          CREF (ex.: 123456-G)
          <input
            className="rounded-lg border bg-background p-3"
            name="cref"
            required
            pattern="[0-9]{6}-[GP]"
            placeholder="123456-G"
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            value={cref}
            onChange={(event) => setCref(maskCref(event.target.value))}
            disabled={busy}
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
        {term && (
          <LegalDocumentReader
            document={{
              ...term,
              title: "Declaração de Habilitação e Responsabilidade Técnica",
            }}
          />
        )}
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            className="mt-1 size-4 shrink-0"
            type="checkbox"
            required
            disabled={busy}
          />
          Declaro sob as penas da lei que possuo registro ativo no CREF
          informado e assumo responsabilidade técnica exclusiva pelas
          prescrições realizadas.
        </label>
        <Button disabled={busy || !term}>
          {busy ? "Enviando…" : "Ativar credenciais profissionais"}
        </Button>
        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}
