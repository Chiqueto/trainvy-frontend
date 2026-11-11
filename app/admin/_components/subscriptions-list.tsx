"use client";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ListAdminSubscriptions200, ListAdminSubscriptionsParams } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { loadAdminSubscriptions } from "../_actions";
import { adminDate, money, statuses } from "../_lib/presentation";
import { fieldClass, ListFooter } from "./list-controls";
import { SubscriptionStatus } from "./subscription-status";
import { useAdminPage } from "./use-admin-page";
export function SubscriptionsList({ initial }: { initial: ListAdminSubscriptions200 }) {
  const [q,setQ] = useState(""), [type,setType] = useState(""), [status,setStatus] = useState(""), [plan,setPlan] = useState(""), [provider,setProvider] = useState("");
  const page = useAdminPage<ListAdminSubscriptions200["items"][number], ListAdminSubscriptionsParams>(initial, loadAdminSubscriptions);
  return <><h1 className="text-2xl font-semibold">Assinaturas</h1><p className="text-sm text-muted-foreground">Status registrado e acesso efetivo são exibidos separadamente. Preços não representam receita.</p>
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={e=>{e.preventDefault(); void page.reload({ q:q||undefined, accountType:(type||undefined) as ListAdminSubscriptionsParams["accountType"], status:(status||undefined) as ListAdminSubscriptionsParams["status"], planCode:plan||undefined, billingProvider:(provider||undefined) as ListAdminSubscriptionsParams["billingProvider"] });}}>
      <label>Nome ou email<input className={fieldClass} value={q} onChange={e=>setQ(e.target.value)}/></label>
      <label>Status<select className={fieldClass} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Provider<select className={fieldClass} value={provider} onChange={e=>setProvider(e.target.value)}><option value="">Todos</option>{["NONE","MANUAL","ASAAS"].map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Tipo de conta<select className={fieldClass} value={type} onChange={e=>setType(e.target.value)}><option value="">Todos</option><option value="ATHLETE">Atletas</option><option value="COACH">Personals</option></select></label>
      <label>Código do plano<input className={fieldClass} value={plan} onChange={e=>setPlan(e.target.value)}/></label>
      <Button type="submit" disabled={page.loading} className="self-end gap-1.5">
        {page.loading && <Loader2 className="size-4 animate-spin" />}
        <span>{page.loading ? "Filtrando..." : "Filtrar assinaturas"}</span>
      </Button>
    </form>
    <div aria-busy={page.loading} className="grid gap-3 lg:grid-cols-2">{page.data.items.map(s=><Link href={`/admin/users/${s.user.id}`} key={s.id} className="min-w-0 break-words rounded-2xl border p-4 hover:bg-muted"><h2 className="font-semibold">{s.user.name}</h2><p className="text-sm">{s.user.email}</p><p className="my-2">{s.plan.name} · {money(s.priceInCentsSnapshot,s.currencySnapshot)}</p><SubscriptionStatus value={s}/><p className="mt-2 text-xs text-muted-foreground">Atualizada: {adminDate(s.updatedAt)} · Fim do período: {adminDate(s.currentPeriodEnd)}</p></Link>)}</div>
    {!page.loading && !page.error && page.data.items.length===0 && <p>Nenhuma assinatura encontrada.</p>}
    <ListFooter {...page} hasMore={page.data.hasMore}/>
  </>;
}
