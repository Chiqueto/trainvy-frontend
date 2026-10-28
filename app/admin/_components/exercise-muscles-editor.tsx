"use client";

import { useState } from "react";
import type {
  ListAdminExercises200Item,
  UpdateAdminExerciseMuscles200,
} from "@/app/_lib/api/fetch-generated";
import { ALL_MUSCLE_GROUPS, type MuscleGroup } from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";
import { saveAdminExerciseMuscles } from "../_actions";
import { adminError } from "../_lib/presentation";

export function ExerciseMusclesEditor({
  exercise,
  onSaved,
  onCancel,
}: {
  exercise: ListAdminExercises200Item;
  onSaved: (result: UpdateAdminExerciseMuscles200) => void;
  onCancel: () => void;
}) {
  const [primary, setPrimary] = useState<MuscleGroup[]>(
    exercise.muscles
      .filter((m) => m.role === "PRIMARY")
      .map((m) => m.muscleGroup),
  );
  const [secondary, setSecondary] = useState<MuscleGroup[]>(
    exercise.muscles
      .filter((m) => m.role === "SECONDARY")
      .map((m) => m.muscleGroup),
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4 rounded-xl border bg-background p-4"
      aria-label={`Editar músculos de ${exercise.name}`}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!primary.length) {
          setError("Selecione pelo menos um músculo principal.");
          return;
        }
        setPending(true);
        setError("");
        try {
          const result = await saveAdminExerciseMuscles(exercise.id, {
            expectedUpdatedAt: exercise.updatedAt,
            primaryMuscleGroups: primary,
            secondaryMuscleGroups: secondary,
          });
          if (!result.success) {
            setError(adminError(result.code));
            return;
          }
          onSaved(result.data);
        } catch {
          setError("Não foi possível salvar. Suas escolhas foram mantidas.");
        } finally {
          setPending(false);
        }
      }}
    >
      <p className="text-sm font-semibold">
        Classificação muscular · {exercise.name}
      </p>
      <p className="text-xs text-muted-foreground">
        Principais são os alvos do movimento; secundários são sinergistas ou
        estabilizadores relevantes. Um grupo não pode ocupar os dois papéis.
        Exercícios isolados podem ficar sem secundários.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(["PRIMARY", "SECONDARY"] as const).map((role) => {
          const selected = role === "PRIMARY" ? primary : secondary;
          const other = role === "PRIMARY" ? secondary : primary;
          const setSelected = role === "PRIMARY" ? setPrimary : setSecondary;
          return (
            <fieldset
              key={role}
              disabled={pending}
              className="rounded-lg border p-3"
            >
              <legend className="px-1 text-sm font-medium">
                {role === "PRIMARY" ? "Principais" : "Secundários"}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_MUSCLE_GROUPS.map((m) => (
                  <label
                    key={m.value}
                    className="flex items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(m.value)}
                      disabled={other.includes(m.value)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, m.value]
                            : selected.filter((v) => v !== m.value),
                        )
                      }
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar músculos"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar edição
        </Button>
      </div>
    </form>
  );
}
