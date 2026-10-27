"use client";
import type { ListAdminPlans200Item } from "@/app/_lib/api/fetch-generated";
import { entitlementLabels } from "../_lib/presentation";
export type PlanPermission = ListAdminPlans200Item["entitlements"][number];
export function PlanPermissionsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: PlanPermission[];
  onChange: (next: PlanPermission[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="mb-3 text-sm font-semibold">
        Permissões do plano
      </legend>
      {(Object.keys(entitlementLabels) as PlanPermission["entitlement"][]).map(
        (key) => {
          const current = value.find((e) => e.entitlement === key);
          return (
            <div key={key} className="rounded-xl border border-border p-3">
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(current)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...value, { entitlement: key, limitValue: null }]
                        : value.filter((e) => e.entitlement !== key),
                    )
                  }
                />
                {entitlementLabels[key]}
              </label>
              {key === "MANAGE_ATHLETES" && current && (
                <label className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                  Limite de atletas (vazio = sem limite)
                  <input
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    value={current.limitValue ?? ""}
                    onChange={(event) =>
                      onChange(
                        value.map((e) =>
                          e.entitlement === key
                            ? {
                                ...e,
                                limitValue:
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                              }
                            : e,
                        ),
                      )
                    }
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </label>
              )}
              {key === "SOURCE_LIBRARY" && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Recurso futuro; a biblioteca ainda não está disponível.
                </p>
              )}
            </div>
          );
        },
      )}
      <p className="text-xs text-muted-foreground">
        As alterações atualizam as permissões comerciais do plano. Os recursos
        individuais e as proteções técnicas do beta continuam seguindo as regras
        atuais.
      </p>
    </fieldset>
  );
}
