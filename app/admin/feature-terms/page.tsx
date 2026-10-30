import Link from "next/link";
import { listFeatureTermsEvidence } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";

export default async function FeatureTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const userId =
    typeof params.userId === "string"
      ? params.userId.trim().slice(0, 128) || undefined
      : undefined;
  const cursor =
    typeof params.cursor === "string" && /^[a-f0-9-]{36}$/i.test(params.cursor)
      ? params.cursor
      : undefined;
  const evidence = await readAdmin(
    listFeatureTermsEvidence(
      { userId, cursor, limit: 25 },
      { cache: "no-store" },
    ),
  );
  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold">Aceites de IA e 3D</h1>
      <p className="text-sm text-muted-foreground">
        Evidências restritas à administração. Datas exibidas no horário de
        Brasília. O registro do aceite não comprova avaliação profissional.
      </p>
      <form className="flex gap-2">
        <input
          name="userId"
          defaultValue={userId}
          aria-label="ID do usuário"
          placeholder="Filtrar por ID do usuário"
          className="min-w-0 flex-1 rounded-lg border p-2"
        />
        <button className="rounded-lg border px-4">Filtrar</button>
      </form>
      {evidence.items.length === 0 && <p>Nenhum aceite encontrado.</p>}
      {evidence.items.map((item) => (
        <details key={item.id} className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm">
            {item.feature === "AI_WORKOUT" ? "Treinos com IA" : "Exercícios 3D"}{" "}
            · {item.userId} ·{" "}
            {new Date(item.acceptedAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </summary>
          <div className="mt-4 space-y-3 break-words text-sm">
            <p>
              Registro: {item.id} · Versão: {item.version}
            </p>
            <p>SHA-256: {item.textHash}</p>
            <p>
              IP da conexão à API: {item.ipAddress}. Em acessos por proxy, pode
              identificar o servidor intermediário.
            </p>
            <p>Navegador informado: {item.userAgent ?? "Não informado"}</p>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="whitespace-pre-line">{item.text}</p>
            <p>
              {item.accessCount} acesso(s) autorizado(s). Até 20 eventos
              recentes:
            </p>
            <ul className="space-y-1">
              {item.recentAccessEvents.map((event) => (
                <li key={event.id}>
                  {new Date(event.createdAt).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  · {event.context}
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
      {evidence.nextCursor && (
        <Link
          href={`/admin/feature-terms?${new URLSearchParams({ cursor: evidence.nextCursor, ...(userId ? { userId } : {}) })}`}
          className="inline-block rounded-lg border px-4 py-2"
        >
          Próxima página
        </Link>
      )}
    </AdminDashboardLayout>
  );
}
