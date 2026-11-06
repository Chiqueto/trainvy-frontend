"use client";

import { useEffect, useState } from "react";
import type { GetMyLegalDocuments200Item } from "@/app/_lib/api/fetch-generated";
import {
  acceptLegalDocumentAction as acceptLegalDocument,
  getMyLegalDocumentsAction as getMyLegalDocuments,
} from "@/app/_actions/legal";
import { Button } from "@/components/ui/button";
import { LegalDocumentReader } from "./legal-document-reader";

const documentKey = (d: GetMyLegalDocuments200Item) =>
  `${d.id}:${d.version}:${d.contentHash}`;

export function LegalConsent({
  onReady,
}: {
  onReady?: (ready: boolean) => void;
}) {
  const [documents, setDocuments] = useState<GetMyLegalDocuments200Item[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyLegalDocuments()
      .then((res) => {
        if (!active) return;
        if (res.status !== 200) throw new Error("Failed to load documents");
        setDocuments(
          res.data.filter((d) => d.targetAudience !== "PROFESSIONAL"),
        );
      })
      .catch(() => {
        if (active)
          setMessage(
            "Não foi possível carregar os termos. Recarregue a página.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pending = documents.filter((d) => d.requiresClickwrap && !d.accepted);
  const ready = documents.length > 0 && pending.length === 0;
  useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);

  const core = pending.filter(
    (d) => d.category === "TERMS_OF_USE" || d.category === "PRIVACY_POLICY",
  );
  const groups = [
    ...(core.length
      ? [
          {
            documents: core,
            label:
              "Li e estou de acordo com os Termos de Uso e a Política de Privacidade do Trainvy.",
          },
        ]
      : []),
    ...pending
      .filter((d) => !core.includes(d))
      .map((d) => ({
        documents: [d],
        label:
          d.category === "HEALTH_PARQ_CONSENT"
            ? "Declaro ciência do Termo de Prontidão Física (PAR-Q) e autorizo expressamente o tratamento dos meus dados de saúde e físicos, inclusive pelo assistente de IA."
            : `Li o documento “${d.title}” e estou de acordo com seu conteúdo.`,
      })),
  ];

  return (
    <section
      className="w-full min-w-0 space-y-4 rounded-xl border bg-card p-4"
      aria-busy={loading || busy}
    >
      <h2 className="font-semibold">Termos e consentimento de saúde</h2>
      <p className="text-sm text-muted-foreground">
        Leia os documentos completos e confirme os aceites pendentes para
        continuar.
      </p>
      {loading && (
        <p role="status" className="text-sm">
          Carregando documentos...
        </p>
      )}
      <div className="space-y-2">
        {documents.map((d) => (
          <div key={documentKey(d)} className="space-y-1 rounded-lg border p-3">
            <LegalDocumentReader document={d} />
            <p className="text-xs text-muted-foreground">
              Versão {d.version} ·{" "}
              {d.accepted
                ? "Aceito"
                : d.requiresClickwrap
                  ? "Aceite pendente"
                  : "Para sua leitura"}
            </p>
          </div>
        ))}
      </div>
      {pending.length > 0 && (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || !pending.every((d) => checked[documentKey(d)])) return;
            setBusy(true);
            setMessage("");
            try {
              for (const d of pending) {
                const res = await acceptLegalDocument(d.slug, {
                  version: d.version,
                  contentHash: d.contentHash,
                  accepted: true,
                });
                if (res.status !== 200) {
                  setMessage(res.data.error);
                  if (res.status === 409) {
                    setChecked({});
                    setDocuments([]);
                    const latest = await getMyLegalDocuments();
                    if (latest.status === 200)
                      setDocuments(
                        latest.data.filter(
                          (item) => item.targetAudience !== "PROFESSIONAL",
                        ),
                      );
                  }
                  return;
                }
                setDocuments((docs) =>
                  docs.map((item) =>
                    documentKey(item) === documentKey(d)
                      ? { ...item, accepted: true }
                      : item,
                  ),
                );
              }
              setMessage("Aceites registrados com sucesso.");
            } catch {
              setMessage(
                "Falha ao registrar aceite. Tente novamente; os aceites já confirmados foram preservados.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {groups.map((group) => (
            <label
              key={group.documents.map(documentKey).join("|")}
              className="flex items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed"
            >
              <input
                className="mt-1 size-4 shrink-0"
                type="checkbox"
                required
                disabled={busy}
                checked={group.documents.every(
                  (d) => !!checked[documentKey(d)],
                )}
                onChange={(event) => {
                  const value = event.target.checked;
                  setChecked((previous) => ({
                    ...previous,
                    ...Object.fromEntries(
                      group.documents.map((d) => [documentKey(d), value]),
                    ),
                  }));
                }}
              />
              <span>{group.label}</span>
            </label>
          ))}
          <Button
            type="submit"
            className="w-full whitespace-normal"
            disabled={busy || !pending.every((d) => checked[documentKey(d)])}
          >
            {busy ? "Registrando aceites..." : "Registrar aceite"}
          </Button>
        </form>
      )}
      {ready && (
        <p className="text-sm text-muted-foreground">
          Todos os aceites obrigatórios estão em dia.
        </p>
      )}
      <p role="status" className="text-sm" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
