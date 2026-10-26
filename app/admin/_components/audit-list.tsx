"use client";

import { useState } from "react";
import { History, Shield, User } from "lucide-react";
import type { ListAdminAudit200 } from "@/app/_lib/api/fetch-generated";
import { actionLabels, adminDate } from "../_lib/presentation";
import { Badge } from "@/components/ui/badge";

export function AuditList({ initial }: { initial: ListAdminAudit200 }) {
  const [data] = useState(initial);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Auditoria Administrativa
          </h1>
          <p className="text-xs text-muted-foreground">
            Registro imutável de todas as ações administrativas, concessões de planos e alterações de assinatura.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-xs">
          <History className="size-3.5" />
          <span>{data.items.length} registros</span>
        </Badge>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {data.items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Nenhuma ação administrativa registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-heading">
                <tr>
                  <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  <th className="py-3 px-4 font-semibold">Ação</th>
                  <th className="py-3 px-4 font-semibold">Admin</th>
                  <th className="py-3 px-4 font-semibold">Alvo</th>
                  <th className="py-3 px-4 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {adminDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="font-heading text-[10px] font-bold">
                        {actionLabels[item.action] ?? item.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {item.admin?.name ?? item.adminUserId}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {item.targetUser?.name ?? item.targetUserId ?? item.entityId ?? "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {item.metadata ? JSON.stringify(item.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
