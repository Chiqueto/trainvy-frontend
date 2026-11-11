"use client";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ListAdminUsers200, ListAdminUsersParams } from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";
import { loadAdminUsers } from "../_actions";
import { statuses } from "../_lib/presentation";
import { fieldClass, ListFooter } from "./list-controls";
import { SubscriptionStatus } from "./subscription-status";
import { useAdminPage } from "./use-admin-page";
export function UsersList({ initial }: { initial: ListAdminUsers200 }) {
  const [q,setQ] = useState(""), [type,setType] = useState(""), [status,setStatus] = useState(""), [plan,setPlan] = useState("");
  const page = useAdminPage<ListAdminUsers200["items"][number], ListAdminUsersParams>(initial, loadAdminUsers);
  return <><h1 className="text-2xl font-semibold">Usuários</h1>
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={e => { e.preventDefault(); void page.reload({ q: q || undefined, accountType: (type || undefined) as ListAdminUsersParams["accountType"], subscriptionStatus: (status || undefined) as ListAdminUsersParams["subscriptionStatus"], planCode: plan || undefined }); }}>
      <label>Nome ou email<input className={fieldClass} value={q} onChange={e=>setQ(e.target.value)} /></label>
      <label>Tipo de conta<select className={fieldClass} value={type} onChange={e=>setType(e.target.value)}><option value="">Todos</option><option value="ATHLETE">Atletas</option><option value="COACH">Personals</option></select></label>
      <label>Status<select className={fieldClass} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Código do plano<input className={fieldClass} value={plan} onChange={e=>setPlan(e.target.value)} /></label>
      <Button type="submit" disabled={page.loading} className="self-end gap-1.5">
        {page.loading && <Loader2 className="size-4 animate-spin" />}
        <span>{page.loading ? "Buscando..." : "Buscar usuários"}</span>
      </Button>
    </form>
    <div aria-busy={page.loading} className="grid gap-3 lg:grid-cols-2">{page.data.items.map(u=><Link key={u.id} href={`/admin/users/${u.id}`} className="min-w-0 break-words rounded-2xl border p-4 hover:bg-muted"><h2 className="font-semibold">{u.name}</h2><p className="text-sm">{u.email}</p><p className="my-2 text-sm text-muted-foreground">{u.accountType === "COACH" ? "Personal" : "Atleta"} · {u.systemRole} · {u.plan?.name ?? "Sem plano"}</p><SubscriptionStatus value={u.subscription}/></Link>)}</div>
    {!page.loading && !page.error && page.data.items.length === 0 && <p>Nenhum usuário encontrado.</p>}
    <ListFooter {...page} hasMore={page.data.hasMore}/>
  </>;
}
