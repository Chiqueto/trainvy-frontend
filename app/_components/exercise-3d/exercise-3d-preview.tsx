"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { ExerciseAnimation } from "./exercises";

const Viewer = dynamic(
  () =>
    import("./exercise-3d-viewer").then((module) => module.Exercise3DViewer),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="p-4 text-sm text-muted-foreground">
        Carregando visualizador 3D...
      </p>
    ),
  },
);

/** Load the engine and 13 MB model only after an explicit click. */
export function Exercise3DPreview({
  exercise,
}: {
  exercise: ExerciseAnimation;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 w-full rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary"
      >
        {open ? "Fechar animação 3D" : "Testar animação 3D"}
      </button>
      {open && <Viewer exercise={exercise} />}
    </div>
  );
}
