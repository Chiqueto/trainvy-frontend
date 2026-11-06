"use client";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import type { GetMyLegalDocuments200Item } from "@/app/_lib/api/fetch-generated";
import {
  acceptLegalDocumentAction as acceptLegalDocument,
  getMyLegalDocumentsAction as getMyLegalDocuments,
} from "@/app/_actions/legal";
import { Button } from "@/components/ui/button";

export function LegalConsent({
  onReady,
}: {
  onReady?: (ready: boolean) => void;
}) {
  const [documents, setDocuments] = useState<GetMyLegalDocuments200Item[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    getMyLegalDocuments()
      .then((res) => {
        if (active && res.status === 200)
          setDocuments(
            res.data.filter((d) => d.targetAudience !== "PROFESSIONAL"),
          );
      })
      .catch(() => {
        if (active)
          setMessage(
            "Não foi possível carregar os termos. Recarregue a página.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const ready =
    documents.length > 0 &&
    documents.filter((d) => d.requiresClickwrap).every((d) => d.accepted);
  useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);
  return (
    <section className="w-full space-y-3 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Termos e consentimento de saúde</h2>
      {documents.map((d) => (
        <div key={`${d.id}:${d.version}`} className="space-y-2">
          <details>
            <summary className="cursor-pointer text-sm">
              {d.title} · v{d.version}
              {d.accepted && " · Aceito"}
            </summary>
            <div className="max-h-80 overflow-auto py-3 text-sm">
              <Streamdown>{d.contentMd}</Streamdown>
            </div>
          </details>
          {!d.accepted && (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const res = await acceptLegalDocument(d.slug, {
                    version: d.version,
                    contentHash: d.contentHash,
                    accepted: true,
                  });
                  if (res.status === 200)
                    setDocuments((docs) =>
                      docs.map((item) =>
                        item.id === d.id ? { ...item, accepted: true } : item,
                      ),
                    );
                    else {
                      setMessage(res.data.error);
                      if (res.status === 409) {
                        const latest = await getMyLegalDocuments();
                        if (latest.status === 200) setDocuments(latest.data.filter((item) => item.targetAudience !== "PROFESSIONAL"));
                      }
                    }
                } catch {
                  setMessage("Falha ao registrar aceite.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <input className="mt-1" type="checkbox" required />
                {d.category === "HEALTH_PARQ_CONSENT"
                  ? "Li as perguntas de prontidão e autorizo especificamente o tratamento dos meus dados físicos e de saúde e seu processamento por IA, conforme este termo."
                  : `Li e aceito ${d.title}.`}
              </label>
              <Button type="submit" size="sm" disabled={busy}>
                Registrar aceite
              </Button>
            </form>
          )}
        </div>
      ))}
      <p role="status" className="text-sm">
        {message}
      </p>
    </section>
  );
}
