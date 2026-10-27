import Link from "next/link";
import type { GetAdminAiUsage200 } from "@/app/_lib/api/fetch-generated";

const featureNames: Record<string, string> = {
  CHAT: "Coach AI", SESSION_CHAT: "Assistente durante o treino", ATHLETE_PLAN: "Geração de plano",
  COACH_PRESCRIPTION: "Prescrição do treinador", COACH_INSIGHTS: "Análise de evolução do aluno",
};
const integer = (n: number) => n.toLocaleString("pt-BR");
const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(n);

export function AiUsageDashboard({ data, days, userId }: { data: GetAdminAiUsage200; days: number; userId?: string }) {
  const maxDaily = Math.max(...data.daily.map(d => d.estimatedCostUsd), 0.000001);
  return <div className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold">Consumo e custos de IA</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tokens registrados e estimativa de custo do provedor, sem cobrança aos usuários.</p>
    </div>
    <form method="get" action="/admin/ai-usage" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
      <label className="flex flex-col gap-2 text-xs">Período (UTC)
        <select name="days" defaultValue={days} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs">ID do usuário (opcional)
        <input name="userId" defaultValue={userId ?? ""} maxLength={128} className="h-11 min-w-40 rounded-lg border border-input bg-background px-3 text-sm" />
      </label>
      <button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Filtrar</button>
      {userId && <Link href={`/admin/ai-usage?days=${days}`} className="inline-flex h-11 items-center text-sm text-primary">Limpar usuário</Link>}
    </form>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        ["Custo estimado", money(data.totals.estimatedCostUsd)], ["Chamadas ao modelo", integer(data.totals.calls)],
        ["Tokens de entrada", integer(data.totals.inputTokens)], ["Tokens de saída", integer(data.totals.outputTokens)],
      ].map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words font-heading text-xl font-bold">{value}</p>
      </div>)}
    </div>
    <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
      <p>Raciocínio: {integer(data.totals.reasoningTokens)} tokens, já incluídos na saída. Cache: {integer(data.totals.cachedInputTokens)} tokens, já incluídos na entrada.</p>
      <p>Falhas registradas: {integer(data.totals.errors)}. Chamadas sem custo calculável: {integer(data.totals.unpricedCalls)}; o subtotal não inclui essas chamadas.</p>
      <p>Cada etapa do chat que consulta o modelo conta como uma chamada. Uma mensagem pode gerar várias chamadas.</p>
      <p className="mt-2">Estimativa em USD pelas tarifas padrão pagas, com preços preservados no momento da chamada. Áudio misto usa a tarifa de áudio para toda a entrada, de forma conservadora. Não inclui impostos, câmbio, descontos, franquia gratuita ou tentativas internas do provedor sem uso reportado. A fatura pode diferir.</p>
      <p className="mt-2">{data.trackingStartedAt ? `Primeiro registro em ${new Date(data.trackingStartedAt).toLocaleString("pt-BR", { timeZone: "UTC" })} UTC.` : "Nenhum consumo registrado ainda."} O consumo anterior à implantação não é reconstruído. <a href={data.pricingSource} target="_blank" rel="noreferrer" className="text-primary underline">Tarifas de referência</a>.</p>
    </div>

    {data.totals.calls === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma chamada de IA registrada para este filtro.</p> : <>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Custo diário estimado (UTC)</h2>
        <div className="mt-4 flex h-36 items-end gap-1 overflow-x-auto" role="img" aria-label="Custo estimado por dia; valores disponíveis na legenda de cada coluna">
          {data.daily.map(d => <div key={d.date} className="flex h-full min-w-6 flex-1 flex-col justify-end gap-2 text-center" title={`${d.date}: ${money(d.estimatedCostUsd)}, ${d.calls} chamadas`}>
            <div className="min-h-1 rounded-t bg-primary/80" style={{ height: `${Math.max(2, d.estimatedCostUsd / maxDaily * 100)}%` }} />
            <span className="text-[9px] text-muted-foreground">{d.date.slice(8)}</span>
          </div>)}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Passe o cursor sobre uma coluna para consultar data, custo e chamadas. Dias sem registros são omitidos.</p>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Por funcionalidade e modelo</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr>
            {["Funcionalidade", "Modelo", "Chamadas", "Entrada", "Saída", "Custo estimado"].map(h => <th key={h} className="whitespace-nowrap p-3 font-medium">{h}</th>)}
          </tr></thead><tbody>{data.byFeature.map(f => <tr key={`${f.feature}-${f.model}`} className="border-b border-border/50 last:border-0">
            <td className="p-3">{featureNames[f.feature] ?? f.feature}</td><td className="p-3 font-mono">{f.model}</td><td className="p-3">{integer(f.calls)}</td>
            <td className="p-3">{integer(f.inputTokens)}</td><td className="p-3">{integer(f.outputTokens)}</td><td className="whitespace-nowrap p-3">{money(f.estimatedCostUsd)}</td>
          </tr>)}</tbody></table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Usuários com maior custo estimado (até 20)</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr>{["Usuário", "Chamadas", "Tokens", "Custo estimado"].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.byUser.map(u => <tr key={u.userId} className="border-b border-border/50 last:border-0">
              <td className="p-3"><Link href={`/admin/ai-usage?days=${days}&userId=${encodeURIComponent(u.userId)}`} className="font-semibold text-primary">{u.name}</Link><p className="text-muted-foreground">{u.email}</p></td>
              <td className="p-3">{integer(u.calls)}</td><td className="p-3">{integer(u.inputTokens + u.outputTokens)}</td><td className="whitespace-nowrap p-3">{money(u.estimatedCostUsd)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Últimas 30 chamadas</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr>{["Data (UTC)", "Usuário", "Funcionalidade", "Status", "Entrada / saída", "Estimativa"].map(h => <th key={h} className="whitespace-nowrap p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.recent.map(e => <tr key={e.id} className="border-b border-border/50 last:border-0">
              <td className="whitespace-nowrap p-3">{new Date(e.createdAt).toLocaleString("pt-BR", { timeZone: "UTC" })}</td>
              <td className="max-w-40 truncate p-3"><Link href={`/admin/users/${encodeURIComponent(e.userId)}`} className="text-primary">{e.userId}</Link></td>
              <td className="p-3">{featureNames[e.feature] ?? e.feature}</td><td className="p-3">{e.status === "ERROR" ? "Falha" : "Concluída"}</td>
              <td className="whitespace-nowrap p-3">{e.inputTokens === null ? "—" : integer(e.inputTokens)} / {e.outputTokens === null ? "—" : integer(e.outputTokens)}</td>
              <td className="whitespace-nowrap p-3">{e.estimatedCostUsd === null ? "Não informado" : money(e.estimatedCostUsd)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </>}
  </div>;
}
