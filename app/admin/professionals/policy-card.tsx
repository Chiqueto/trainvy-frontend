"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, FlaskConical } from "lucide-react";
import type { GetProfessionalVerificationPolicy200 } from "@/app/_lib/api/fetch-generated";
import { updateProfessionalVerificationPolicyAction } from "./_actions";
import { Button } from "@/components/ui/button";

export function ProfessionalVerificationPolicyCard({
  policy,
}: {
  policy: GetProfessionalVerificationPolicy200;
}) {
  const router = useRouter();
  const [required, setRequired] = useState(policy.required);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section
      className={`rounded-2xl border bg-card p-5 space-y-4 ${policy.required ? "" : "border-amber-500/60 bg-amber-500/5"}`}
    >
      <div className="flex items-start gap-3">
        {policy.required ? (
          <ShieldCheck className="mt-1 size-6 text-primary" />
        ) : (
          <FlaskConical className="mt-1 size-6 text-amber-600" />
        )}
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Verificação de CREF
          </h2>
          <p className="text-sm text-muted-foreground">
            {policy.required
              ? "Exigência ativa para os recursos profissionais."
              : "Modo de testes ativo: CREF verificado não é exigido de cadastros pendentes ou expirados."}
          </p>
        </div>
      </div>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setBusy(true);
          setMessage("");
          try {
            const result = await updateProfessionalVerificationPolicyAction({
              required,
              revision: policy.revision,
              reason: String(form.get("reason")),
            });
            setMessage(
              result.status === 200
                ? "Configuração salva."
                : ((result.data as { error?: string }).error ??
                    "Não foi possível salvar."),
            );
            if (result.status === 200) router.refresh();
          } catch {
            setMessage(
              "Falha na comunicação. A configuração não foi confirmada.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium">
          <input
            type="checkbox"
            role="switch"
            checked={required}
            disabled={busy}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Exigir CREF verificado
        </label>
        <p className="text-xs text-muted-foreground">
          Desligue para testar os recursos do personal. Contas de aluno,
          assinaturas, vínculos e aprovação explícita continuam com seus
          controles. Cadastros suspensos ou rejeitados permanecem bloqueados.
          Aprovações de teste são identificadas como teste.
        </p>
        <label className="grid gap-1 text-sm">
          Motivo da alteração
          <input
            name="reason"
            required
            minLength={5}
            maxLength={500}
            defaultValue="Fase de testes da plataforma"
            className="rounded-lg border bg-background p-3"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={busy || required === policy.required}>
            {busy ? "Salvando…" : "Salvar configuração"}
          </Button>
          <Link className="text-sm underline" href="/admin/professionals">
            Buscar e validar CREFs
          </Link>
        </div>
        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}
