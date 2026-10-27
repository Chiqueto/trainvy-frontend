"use client";
import { useState, useTransition } from "react";
import type { ListAdminPlans200Item } from "@/app/_lib/api/fetch-generated";
import { saveAdminEntitlements } from "../_actions";
import { adminError } from "../_lib/presentation";
import { Button } from "@/components/ui/button";
import { PlanPermissionsFields } from "./plan-permissions-fields";
export function PlanPermissionsEditor({
  plan,
  onSaved,
}: {
  plan: ListAdminPlans200Item;
  onSaved: (plan: ListAdminPlans200Item) => void;
}) {
  const [permissions, setPermissions] = useState(plan.entitlements);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <details className="mt-4 border-t border-border pt-3">
      <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
        Editar permissões
      </summary>
      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setSaved(false);
          startTransition(async () => {
            const result = await saveAdminEntitlements(plan.id, {
              entitlements: permissions,
            });
            if (!result.success) {
              setError(adminError(result.code));
              return;
            }
            onSaved(result.data);
            setSaved(true);
          });
        }}
      >
        <PlanPermissionsFields
          value={permissions}
          disabled={pending}
          onChange={(next) => {
            setPermissions(next);
            setSaved(false);
          }}
        />
        <p className="text-xs text-muted-foreground">
          As permissões passam a valer nas próximas verificações de acesso dos
          assinantes deste plano. Nenhum preço será alterado.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm text-emerald-500">
            Permissões salvas.
          </p>
        )}
        <Button disabled={pending} className="min-h-11 w-full rounded-full">
          {pending ? "Salvando..." : "Salvar permissões"}
        </Button>
      </form>
    </details>
  );
}
