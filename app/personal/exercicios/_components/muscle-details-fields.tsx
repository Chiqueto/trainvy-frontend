"use client";

import options from "@/app/_lib/muscle-detail-options.json";
import {
  getMuscleGroupLabel,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";

export function MuscleDetailsFields({
  groups,
  value,
  onChange,
  disabled,
}: {
  groups: MuscleGroup[];
  value: Partial<Record<MuscleGroup, string[]>>;
  onChange: (group: MuscleGroup, ids: string[]) => void;
  disabled: boolean;
}) {
  return groups.map((group) => (
    <details
      key={group}
      className="rounded-xl border border-border/60 bg-background/40 p-3"
    >
      <summary className="cursor-pointer text-xs font-medium text-foreground">
        Detalhar {getMuscleGroupLabel(group)}{" "}
        <span className="text-muted-foreground">
          (opcional
          {value[group]?.length
            ? ` · ${value[group]!.length} selecionado(s)`
            : ""}
          )
        </span>
      </summary>
      <fieldset disabled={disabled} className="mt-3 grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">
          Regiões de {getMuscleGroupLabel(group)}
        </legend>
        {options[group].map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={value[group]?.includes(option.id) ?? false}
              onChange={(event) =>
                onChange(
                  group,
                  event.target.checked
                    ? [...(value[group] ?? []), option.id]
                    : (value[group] ?? []).filter((id) => id !== option.id),
                )
              }
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Sem seleção, o exercício mantém apenas o grupo geral.
      </p>
    </details>
  ));
}
