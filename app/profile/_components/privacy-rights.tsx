"use client";
import { useState } from "react";
import {
  eraseMyAccountAction as eraseMyAccount,
  exportMyDataAction as exportMyData,
  revokeHealthConsentAction as revokeHealthConsent,
} from "@/app/_actions/legal";
import { Button } from "@/components/ui/button";

export function PrivacyRights() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="w-full space-y-3 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Privacidade e meus dados</h2>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await exportMyData();
            if (result.status !== 200) {
              setMessage(result.data.error);
              return;
            }
            const url = URL.createObjectURL(
              new Blob([result.data.json], { type: "application/json" }),
            );
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "trainvy-meus-dados.json";
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch {
            setMessage("Falha ao exportar seus dados.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Exportar meus dados (JSON)
      </Button>
      <Button
        className="ml-2"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await revokeHealthConsent();
            setMessage(
              result.status === 200
                ? "Consentimento revogado. Novos tratamentos dependentes dele foram bloqueados."
                : result.data.error,
            );
          } catch {
            setMessage("Falha ao revogar consentimento.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Revogar consentimento de saúde/IA
      </Button>
      <details>
        <summary className="cursor-pointer text-sm">
          Excluir minha conta
        </summary>
        <p className="my-3 text-sm text-muted-foreground">
          Credenciais, perfil de saúde e sessões serão removidos. Prescrições
          históricas e evidências legalmente necessárias podem permanecer sob
          acesso restrito. Digite EXCLUIR MINHA CONTA para confirmar.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const confirmation = String(
              new FormData(e.currentTarget).get("confirmation"),
            );
            if (confirmation !== "EXCLUIR MINHA CONTA") {
              setMessage("Confira o texto de confirmação.");
              return;
            }
            setBusy(true);
            try {
              const result = await eraseMyAccount({ confirmation });
              if (result.status === 200) window.location.assign("/auth");
              else setMessage(result.data.error);
            } catch {
              setMessage("Falha ao excluir conta.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            name="confirmation"
            required
            className="w-full rounded-lg border bg-background p-3 text-sm"
            aria-label="Confirmação de exclusão"
            autoComplete="off"
          />
          <Button variant="destructive" disabled={busy}>
            Excluir minha conta
          </Button>
        </form>
      </details>
      <p role="status" className="text-sm">
        {message}
      </p>
    </section>
  );
}
