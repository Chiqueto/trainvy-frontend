import Link from "next/link";
import { ArrowRight, IdCard } from "lucide-react";
import type { GetCommercialContext200ProfessionalVerification } from "@/app/_lib/api/fetch-generated";

const labels: Record<string, string> = {
  DECLARED_ACTIVE: "CREF declarado",
  VERIFIED_ADMIN: "Conferido pela administração",
  VERIFIED: "Verificado",
  PENDING_VERIFICATION: "Em análise",
  REJECTED: "Cadastro precisa de revisão",
  EXPIRED: "Verificação expirada",
  SUSPENDED: "Cadastro suspenso",
  SUSPENDED_FRAUD: "Cadastro suspenso",
};

export function ProfessionalProfileCard({
  verification,
}: {
  verification: GetCommercialContext200ProfessionalVerification;
}) {
  const status =
    verification?.crefVerificationStatus ?? verification?.status ?? "";
  return (
    <Link
      href="/personal/verification"
      className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <IdCard className="size-5" />
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-sm font-semibold">
          Cadastro profissional
        </span>
        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {labels[status] ?? "Complete seus dados profissionais"}
        </span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          Consulte e atualize seu CREF e seus dados de registro.
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}
