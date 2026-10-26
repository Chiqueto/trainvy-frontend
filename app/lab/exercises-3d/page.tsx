"use client";

import Link from "next/link";
import { useState } from "react";
import { Exercise3DViewer } from "@/app/_components/exercise-3d/exercise-3d-viewer";
import {
  EXERCISE_ANIMATIONS,
  type ExerciseDefinition,
  type ExerciseAnimation,
} from "@/app/_components/exercise-3d/exercises";

export default function Exercise3DLab() {
  const [exercise, setExercise] = useState<ExerciseAnimation>("squat");
  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar ao Trainvy
      </Link>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Trainvy Lab
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          O movimento, de todos os ângulos.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Explore o agachamento e o supino. Pause o
          personagem, gire a câmera e acompanhe cada etapa da repetição.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3" aria-label="Selecionar exercício">
        {(
          Object.entries(EXERCISE_ANIMATIONS) as [
            ExerciseAnimation,
            ExerciseDefinition,
          ][]
        ).map(([key, item]) => (
          <button
            type="button"
            key={key}
            aria-pressed={exercise === key}
            onClick={() => setExercise(key)}
            className={`rounded-xl border p-4 text-left ${exercise === key ? "border-primary bg-primary/10" : "border-border bg-card"}`}
          >
            <span className="block font-semibold">{item.name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {item.equipment}
            </span>
          </button>
        ))}
      </div>
      <Exercise3DViewer exercise={exercise} />
      <p className="text-xs text-muted-foreground">
        Teste de visualização. Você também encontra essa opção em “Ver execução”
        nos exercícios compatíveis do seu treino.
      </p>
    </main>
  );
}
