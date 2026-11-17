"use client";

import dynamic from "next/dynamic";
import {
  EXERCISE_ANIMATIONS,
  type ExerciseAnimation,
} from "@/app/_components/exercise-3d/exercises";
import { YoutubePlayer } from "@/app/_components/exercise-media/youtube-player";
import { youtubeVideoId } from "@/app/_lib/youtube";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Viewer = dynamic(
  () =>
    import("@/app/_components/exercise-3d/exercise-3d-viewer").then(
      (m) => m.Exercise3DViewer,
    ),
  { ssr: false },
);

export type DemonstrationValue = {
  youtubeUrl: string;
  animationKey: ExerciseAnimation | "";
};

export function DemonstrationFields({
  value,
  onChange,
  disabled,
  name,
}: {
  value: DemonstrationValue;
  onChange: (value: DemonstrationValue) => void;
  disabled?: boolean;
  name: string;
}) {
  const invalid = Boolean(
    value.youtubeUrl.trim() && !youtubeVideoId(value.youtubeUrl.trim()),
  );
  return (
    <fieldset
      className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4"
      disabled={disabled}
    >
      <legend className="px-1 text-sm font-semibold">
        Demonstração do exercício
      </legend>
      <p className="text-xs text-muted-foreground">
        Adicione seu vídeo, escolha uma execução 3D ou use os dois. Seus alunos
        com vínculo ativo verão esta demonstração.
      </p>
      <div className="space-y-2">
        <Label htmlFor="demonstration-youtube">Link do YouTube</Label>
        <Input
          id="demonstration-youtube"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value.youtubeUrl}
          aria-invalid={invalid}
          aria-describedby={invalid ? "youtube-error" : undefined}
          onChange={(e) => onChange({ ...value, youtubeUrl: e.target.value })}
        />
        {invalid && (
          <p id="youtube-error" className="text-xs text-destructive">
            Informe um link HTTPS válido de um vídeo do YouTube.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Vídeos públicos ou não listados com incorporação permitida. A
          visibilidade no YouTube depende das configurações do vídeo.
        </p>
      </div>
      {youtubeVideoId(value.youtubeUrl.trim()) && (
        <YoutubePlayer
          key={value.youtubeUrl}
          url={value.youtubeUrl.trim()}
          title={name || "Exercício"}
        />
      )}
      <div className="space-y-2">
        <Label htmlFor="demonstration-animation">
          Execução da biblioteca 3D
        </Label>
        <select
          id="demonstration-animation"
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={value.animationKey}
          onChange={(e) =>
            onChange({
              ...value,
              animationKey: e.target.value as ExerciseAnimation | "",
            })
          }
        >
          <option value="">Usar demonstração padrão, quando disponível</option>
          {Object.entries(EXERCISE_ANIMATIONS)
            .sort((a, b) => a[1].name.localeCompare(b[1].name, "pt-BR"))
            .map(([key, exercise]) => (
              <option key={key} value={key}>
                {exercise.name}
              </option>
            ))}
        </select>
      </div>
      {value.animationKey && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Referência: {EXERCISE_ANIMATIONS[value.animationKey].name}. Os
            músculos e a execução ilustrados pertencem a essa referência.
          </p>
          <Viewer exercise={value.animationKey} compact inDialog />
        </div>
      )}
    </fieldset>
  );
}
