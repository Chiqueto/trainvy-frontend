import {
  listProfessionalRegistrations,
  type ListProfessionalRegistrationsParams,
} from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";
import { ProfessionalReview } from "./review";
import { ProfessionalCrefSearch } from "./search";
import { CREF_REGIONS } from "./official-sources";
export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; region?: string }>;
}) {
  const filters = await searchParams;
  const q = typeof filters.q === "string" ? filters.q.slice(0, 180) : "";
  const region =
    typeof filters.region === "string" &&
    CREF_REGIONS.some((uf) => uf === filters.region)
      ? (filters.region as ListProfessionalRegistrationsParams["region"])
      : undefined;
  const registrations = await readAdmin(
    listProfessionalRegistrations({ q, region }, { cache: "no-store" }),
  );
  return (
    <AdminDashboardLayout>
      <h1 className="font-heading text-2xl font-semibold">
        Verificação de profissionais
      </h1>
      <p className="rounded-xl border p-4 text-sm">A ativação por declaração de CPF, CREF/UF e responsabilidade é obrigatória para atos profissionais. A revisão administrativa registra uma conferência adicional. Consulte também a <a className="underline" href="/admin/compliance">Central jurídica</a>.</p>
      <ProfessionalCrefSearch q={q} region={region} />
      <p className="text-sm text-muted-foreground">
        Consulte a fonte oficial e confira identidade, situação e âmbito de
        atuação. Não aprove por autodeclaração. Sem confirmação da fonte,
        mantenha pendente.
      </p>
      <p className="text-sm text-muted-foreground">
        {registrations.length} cadastro(s) encontrado(s), até 100 por busca.
      </p>
      {registrations.length === 0 && (
        <p className="rounded-xl border p-4 text-sm">
          Nenhum cadastro encontrado. Você pode consultar o CREF na fonte
          oficial acima. Para aprovar uma conta no Trainvy, o profissional
          precisa enviar seu cadastro.
        </p>
      )}
      {registrations.map((r) => (
        <ProfessionalReview key={r.userId} registration={r} />
      ))}
    </AdminDashboardLayout>
  );
}
