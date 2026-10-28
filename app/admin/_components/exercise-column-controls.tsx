"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  catalogColumns,
  defaultColumns,
  defaultHidden,
  type CatalogColumn,
} from "../_lib/exercise-table";

const key = "trainvy:admin:exercise-columns:v1";
const event = "trainvy:admin:exercise-columns";
const defaults = JSON.stringify({
  order: defaultColumns,
  hidden: defaultHidden,
});
function snapshot() {
  try {
    return localStorage.getItem(key) ?? defaults;
  } catch {
    return defaults;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(event, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(event, listener);
  };
}
export function useExerciseColumns() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => defaults);
  const preferences = useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      const order: CatalogColumn[] = Array.isArray(parsed.order)
        ? [
            ...new Set<CatalogColumn>(
              parsed.order.filter((c: string) =>
                Object.hasOwn(catalogColumns, c),
              ),
            ),
          ]
        : [];
      const hidden: CatalogColumn[] = Array.isArray(parsed.hidden)
        ? parsed.hidden.filter(
            (c: string) =>
              Object.hasOwn(catalogColumns, c) &&
              c !== "name" &&
              c !== "details",
          )
        : defaultHidden;
      return {
        order: [...order, ...defaultColumns.filter((c) => !order.includes(c))],
        hidden,
      };
    } catch {
      return { order: defaultColumns, hidden: defaultHidden };
    }
  }, [raw]);
  function save(value: typeof preferences) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(event));
  }
  return {
    ...preferences,
    visible: preferences.order.filter((c) => !preferences.hidden.includes(c)),
    save,
  };
}
export function ExerciseColumnControls({
  columns,
}: {
  columns: ReturnType<typeof useExerciseColumns>;
}) {
  return (
    <details className="rounded-xl border bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Organizar colunas
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Escolha o que exibir e use as setas para mover as colunas. Preferência
        salva neste navegador.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {columns.order.map((column, index) => {
          function move(offset: number) {
            const order = [...columns.order];
            [order[index], order[index + offset]] = [
              order[index + offset],
              order[index],
            ];
            columns.save({ order, hidden: columns.hidden });
          }
          return (
            <div
              key={column}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <label className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!columns.hidden.includes(column)}
                  disabled={column === "name" || column === "details"}
                  onChange={(e) =>
                    columns.save({
                      order: columns.order,
                      hidden: e.target.checked
                        ? columns.hidden.filter((c) => c !== column)
                        : [...columns.hidden, column],
                    })
                  }
                />
                {catalogColumns[column]}
              </label>
              <button
                type="button"
                disabled={index === 0}
                aria-label={`Mover ${catalogColumns[column]} para a esquerda`}
                className="min-h-9 min-w-9 rounded border disabled:opacity-30"
                onClick={() => move(-1)}
              >
                ←
              </button>
              <button
                type="button"
                disabled={index === columns.order.length - 1}
                aria-label={`Mover ${catalogColumns[column]} para a direita`}
                className="min-h-9 min-w-9 rounded border disabled:opacity-30"
                onClick={() => move(1)}
              >
                →
              </button>
            </div>
          );
        })}
      </div>
      <Button
        variant="outline"
        className="mt-3"
        onClick={() =>
          columns.save({ order: defaultColumns, hidden: defaultHidden })
        }
      >
        Restaurar colunas
      </Button>
    </details>
  );
}
