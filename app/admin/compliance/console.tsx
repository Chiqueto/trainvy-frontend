"use client";
import { useState, useTransition } from "react";
import { Streamdown } from "streamdown";
import { type GetAdminCompliance200 } from "@/app/_lib/api/fetch-generated";
import { complianceAction } from "./actions";
import { Button } from "@/components/ui/button";

const tabs = [
  "Documentação e matriz",
  "Profissionais CREF",
  "Revisão técnica 3D",
  "Aceites e consentimentos",
];
const classifications = {
  OBRIGATORIO_LEI: "🔴 Obrigatório por lei",
  RECOMENDAVEL_RISCO: "🟡 Recomendável para reduzir riscos",
  OPCIONAL: "🟢 Opcional",
};
const field = "w-full rounded-lg border bg-background p-2 text-sm";
export function ComplianceConsole({ data }: { data: GetAdminCompliance200 }) {
  const [tab, setTab] = useState(0);
  const [classification, setClassification] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function save(
    action: Parameters<typeof complianceAction>[0],
    id: string,
    body: Parameters<typeof complianceAction>[2],
  ) {
    start(async () => {
      try {
        setMessage(await complianceAction(action, id, body));
      } catch {
        setMessage("Falha ao salvar. Tente novamente.");
      }
    });
  }
  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Compliance"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((title, i) => (
          <Button
            key={title}
            role="tab"
            aria-selected={tab === i}
            variant={tab === i ? "default" : "outline"}
            onClick={() => setTab(i)}
          >
            {title}
          </Button>
        ))}
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
      <form className="flex gap-2">
        <input
          className={field}
          name="q"
          placeholder="Buscar nome, CREF, exercício ou usuário/email nos aceites"
          aria-label="Buscar registros"
        />
        <Button variant="outline">Buscar</Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Até 50 registros por busca. IP identifica a conexão recebida pela API;
        em acessos por proxy pode identificar o intermediário.
      </p>
      {tab === 0 && (
        <>
          <select
            aria-label="Classificação jurídica"
            className={field}
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            <option value="">Todas as classificações</option>
            {Object.entries(classifications).map(([key, title]) => (
              <option key={key} value={key}>
                {title}
              </option>
            ))}
          </select>
          <h2 className="text-lg font-semibold">Checklist</h2>
          {data.items
            .filter(
              (i) => !classification || i.classification === classification,
            )
            .map((i) => (
              <details key={i.id} className="rounded-xl border p-4">
                <summary>
                  {i.code} · {i.title} · {i.implementationStatus}
                </summary>
                <div className="mt-3 space-y-3 text-sm">
                  <p>
                    {classifications[i.classification]} · {i.legalBasis}
                  </p>
                  <Streamdown>{i.descriptionMd}</Streamdown>
                  <select
                    aria-label={`Status ${i.code}`}
                    className={field}
                    disabled={pending}
                    value={i.implementationStatus}
                    onChange={(e) =>
                      save("item", i.id, {
                        implementationStatus: e.target.value as
                          | "IMPLEMENTED"
                          | "PARTIAL"
                          | "PENDING",
                      })
                    }
                  >
                    {["PENDING", "PARTIAL", "IMPLEMENTED"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </details>
            ))}
          <h2 className="text-lg font-semibold">Documentos versionados</h2>
          {data.documents
            .filter(
              (d) => !classification || d.classification === classification,
            )
            .map((d) => (
              <details key={d.id} className="rounded-xl border p-4">
                <summary>
                  {d.title} · v{d.version}
                </summary>
                <div className="my-4 text-sm">
                  <Streamdown>{d.contentMd}</Streamdown>
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    save("document", d.id, {
                      expectedVersion: d.version,
                      title: String(form.get("title")),
                      contentMd: String(form.get("contentMd")),
                    });
                  }}
                >
                  <label className="grid gap-1 text-sm">
                    Título
                    <input
                      className={field}
                      name="title"
                      defaultValue={d.title}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Markdown
                    <textarea
                      className={field}
                      name="contentMd"
                      rows={15}
                      defaultValue={d.contentMd}
                      required
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Salvar gera nova versão e preserva o texto anterior para
                    auditoria. Termos exigirão novo aceite.
                  </p>
                  <Button disabled={pending}>Salvar nova versão</Button>
                </form>
              </details>
            ))}
        </>
      )}
      {tab === 1 && (
        <>
          <a
            className="underline"
            href="https://www.confef.org.br/confefv2/registrados/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar registro no CONFEF
          </a>
          {data.professionals.map((p) => (
            <article className="space-y-3 rounded-xl border p-4" key={p.userId}>
              <h2 className="font-semibold">{p.fullName}</h2>
              <p className="text-sm">
                CPF {p.cpf ?? "Não informado"} · CREF {p.cref}/{p.region} ·{" "}
                {p.crefVerificationStatus}
              </p>
              <p className="text-xs">
                Declaração:{" "}
                {p.crefDeclaredAt
                  ? new Date(p.crefDeclaredAt).toLocaleString("pt-BR")
                  : "Pendente"}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={pending}
                  onClick={() =>
                    save("professional", p.userId, { status: "VERIFIED_ADMIN" })
                  }
                >
                  Marcar verificado
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    save("professional", p.userId, {
                      status: "SUSPENDED_FRAUD",
                    })
                  }
                >
                  Suspender
                </Button>
              </div>
            </article>
          ))}
        </>
      )}
      {tab === 2 &&
        data.exercises.map((e) => (
          <details className="rounded-xl border p-4" key={e.id}>
            <summary>
              {e.name} · {e.biomechanicalReviewStatus}
            </summary>
            <p className="my-3 text-sm">
              {e.reviewedByProfessionalName} {e.reviewedByCref}{" "}
              {e.reviewedAt && new Date(e.reviewedAt).toLocaleString("pt-BR")}
            </p>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const f = new FormData(event.currentTarget);
                save("exercise", e.id, {
                  professionalName: String(f.get("professionalName")),
                  cref: String(f.get("cref")),
                  status: f.get("approved")
                    ? "REVIEWED_APPROVED"
                    : "PENDING_REVIEW",
                  safetyDisclaimerMd: String(f.get("safetyDisclaimerMd")),
                });
              }}
            >
              <label className="grid gap-1 text-sm">
                Nome do profissional revisor
                <input
                  name="professionalName"
                  className={field}
                  required
                  defaultValue={e.reviewedByProfessionalName ?? ""}
                />
              </label>
              <label className="grid gap-1 text-sm">
                CREF do revisor
                <input
                  name="cref"
                  className={field}
                  required
                  pattern="[0-9]{6}-[GP]/[A-Z]{2}"
                  placeholder="123456-G/SP"
                  defaultValue={e.reviewedByCref ?? ""}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Nota de segurança em Markdown
                <textarea
                  name="safetyDisclaimerMd"
                  className={field}
                  defaultValue={e.safetyDisclaimerMd ?? ""}
                />
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  name="approved"
                  defaultChecked={
                    e.biomechanicalReviewStatus === "REVIEWED_APPROVED"
                  }
                />
                Confirmo revisão técnica realizada por este profissional
              </label>
              <Button disabled={pending}>Registrar revisão</Button>
            </form>
          </details>
        ))}
      {tab === 3 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Usuário",
                    "Documento / versão",
                    "Data",
                    "IP",
                    "Navegador",
                    "Integridade",
                  ].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.acceptances.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.userId}</td>
                    <td className="p-3">
                      {a.documentSlug} v{a.documentVersion}
                      {a.revokedAt && " (revogado)"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(a.acceptedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">{a.ipAddress}</td>
                    <td className="max-w-64 break-words p-3">{a.userAgent}</td>
                    <td className="max-w-48 break-all p-3 font-mono text-xs">
                      {a.contentHash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.acceptances.length === 50 && (
            <a
              className="underline"
              href={`?cursor=${data.acceptances.at(-1)!.id}`}
            >
              Próxima página de aceites
            </a>
          )}
        </>
      )}
    </div>
  );
}
