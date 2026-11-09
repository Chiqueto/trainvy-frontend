import Link from "next/link";
export function ProfessionalVerificationPolicyCard() {
  return (
    <section className="rounded-2xl border bg-card p-5 space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Cadastro profissional
      </h2>
      <p className="text-sm text-muted-foreground">
        Para usar os recursos profissionais, informe CPF, CREF/UF e aceite a
        declaração de responsabilidade. A liberação segue as permissões da
        assinatura.
      </p>
      <p className="text-sm text-muted-foreground">
        A conferência administrativa é adicional. A declaração não equivale a
        uma consulta oficial ao conselho. Suspensões e bloqueios continuam
        exigindo revisão administrativa.
      </p>
      <Link className="text-sm underline" href="/admin/professionals">
        Consultar cadastros e conferir CREFs
      </Link>
    </section>
  );
}
