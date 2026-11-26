"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ListAdminAsaasErrors200 } from "@/app/_lib/api/fetch-generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadAdminAsaasErrors } from "../_actions";
import { adminDate } from "../_lib/presentation";
import { fieldClass } from "./list-controls";

export function AsaasErrorsList({
  initial,
}: {
  initial: ListAdminAsaasErrors200;
}) {
  const [items, setItems] = useState(initial.items);
  const [processName, setProcessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loadAdminAsaasErrors({
      processName: processName.trim() || undefined,
      limit: 50,
    });
    setLoading(false);
    if (!res.success) {
      setError("Não foi possível carregar os logs de erro.");
      return;
    }
    setItems(res.data.items);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Logs de Erro do Asaas
          </h1>
          <p className="text-xs text-muted-foreground">
            Registra exclusivamente falhas de integração, webhook e reconciliação com o Asaas.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-xs">
          <AlertTriangle className="size-3.5 text-destructive" />
          <span>{items.length} erros exibidos</span>
        </Badge>
      </div>

      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-xs font-medium min-w-[240px]">
          Filtrar por processo
          <input
            className={fieldClass}
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            placeholder="Ex.: AsaasClient, ProcessAsaasWebhook"
          />
        </label>
        <Button type="submit" disabled={loading} className="gap-1.5">
          {loading && <Loader2 className="size-4 animate-spin" />}
          <span>{loading ? "Buscando..." : "Filtrar"}</span>
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Nenhum erro registrado na tabela de logs do Asaas.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">
                        {item.httpStatus ? `HTTP ${item.httpStatus}` : item.errorType}
                      </Badge>
                      <span className="font-mono font-semibold text-foreground">
                        {item.processName}
                      </span>
                      {item.requestMethod && item.requestPath && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.requestMethod} {item.requestPath}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {adminDate(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-foreground break-words">
                    {item.shortMessage}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      User: {item.userId ?? "—"} · Sub: {item.subscriptionId ?? "—"} · Ref:{" "}
                      {item.externalReference ?? "—"}
                    </span>
                    {(item.responseBody || item.detailedStacktrace) && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                        className="text-primary hover:underline font-medium"
                      >
                        {isExpanded ? "Ocultar detalhes" : "Ver stack/resposta"}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 rounded-xl bg-muted/50 p-3 font-mono text-[11px] overflow-x-auto">
                      {item.responseBody && (
                        <div>
                          <strong className="block text-foreground mb-1">
                            Response Body:
                          </strong>
                          <pre className="whitespace-pre-wrap break-all">
                            {item.responseBody}
                          </pre>
                        </div>
                      )}
                      {item.detailedStacktrace && (
                        <div>
                          <strong className="block text-foreground mb-1">
                            Stacktrace:
                          </strong>
                          <pre className="whitespace-pre-wrap break-all">
                            {item.detailedStacktrace}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
