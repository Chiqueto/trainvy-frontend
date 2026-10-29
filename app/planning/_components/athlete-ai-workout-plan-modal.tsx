"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mic, Square, FileUp } from "lucide-react";
import { toast } from "sonner";
import {
  confirmWorkoutImportAction,
  generateWorkoutPlanWithAiAction,
} from "@/app/planning/_actions";
import {
  type ConfirmWorkoutImportBody,
  type GenerateWorkoutPlanDraftWithAi200,
} from "@/app/_lib/api/fetch-generated";
import {
  useVoiceRecorder,
  formatRecordingTime,
} from "@/app/_hooks/use-voice-recorder";
import type { WorkoutPlanDraftDay } from "@/app/planning/_lib/workout-plan-builder";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (data: {
    name: string;
    notes?: string | null;
    workoutDays: WorkoutPlanDraftDay[];
  }) => void;
}
const weekDays = [
  ["MONDAY", "Segunda"],
  ["TUESDAY", "Terça"],
  ["WEDNESDAY", "Quarta"],
  ["THURSDAY", "Quinta"],
  ["FRIDAY", "Sexta"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"],
];
const numberFields = [
  ["sets", "Séries"],
  ["reps", "Repetições"],
  ["warmupSets", "Séries de aquecimento"],
  ["restTimeInSeconds", "Descanso (s)"],
] as const;
export function AthleteAiWorkoutPlanModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const recorder = useVoiceRecorder();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<{
    fileUrl: string;
    mediaType: string;
    filename: string;
  } | null>(null);
  const [draft, setDraft] = useState<GenerateWorkoutPlanDraftWithAi200 | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState(false);
  if (!isOpen) return null;
  const inputClass = "w-full rounded-lg border bg-background p-3 text-sm";
  function updateDay(index: number, key: string, value: unknown) {
    setConfirmed(false);
    setDraft((d) =>
      d
        ? {
            ...d,
            workoutDays: d.workoutDays.map((day, i) =>
              i === index ? { ...day, [key]: value } : day,
            ),
          }
        : null,
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="w-full max-w-2xl max-h-[90svh] overflow-y-auto rounded-3xl border bg-card p-5 space-y-5"
      >
        <div className="flex justify-between gap-3">
          <div>
            <h2
              id="import-title"
              className="font-heading text-xl font-semibold"
            >
              Organizador de Treinos
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Organize seus treinos com IA. Envie sua ficha ou informe os
              exercícios que deseja cadastrar.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar importação"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Você escolhe os exercícios e os parâmetros. Dados ausentes ficam em
          branco para você preencher. A importação não comprova aprovação
          profissional.
        </p>
        {!draft ? (
          <>
            <label className="grid gap-2 text-sm">
              Sua ficha ou lista, na ordem desejada
              <textarea
                className={inputClass}
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Informe os exercícios, séries, repetições e descansos que deseja registrar."
                maxLength={20000}
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
              <FileUp className="size-5 shrink-0" />
              PDF, imagem ou áudio (até 10 MB)
              <input
                aria-label="Anexar ficha"
                type="file"
                className="min-w-0 text-xs"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.mp4,.wav,.webm,.ogg"
                onChange={async (e) => {
                  const selected = e.target.files?.[0];
                  if (!selected) return;
                  if (selected.size > 10 * 1024 * 1024) {
                    setError("O limite é 10 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setFile({
                      fileUrl: String(reader.result),
                      mediaType: selected.type,
                      filename: selected.name,
                    });
                  reader.readAsDataURL(selected);
                }}
              />
            </label>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  if (recorder.isRecording) {
                    const audio = await recorder.stopRecording();
                    if (audio)
                      setFile({
                        fileUrl: audio.dataUrl,
                        mediaType: audio.mediaType,
                        filename: audio.filename,
                      });
                  } else await recorder.startRecording();
                } catch {
                  setError("Não foi possível gravar o áudio.");
                }
              }}
            >
              {recorder.isRecording ? <Square /> : <Mic />}
              {recorder.isRecording
                ? `Parar · ${formatRecordingTime(recorder.recordingSeconds)}`
                : "Gravar áudio"}
            </Button>
            {file && (
              <p className="text-sm">
                {file.filename}{" "}
                <button className="underline" onClick={() => setFile(null)}>
                  Remover
                </button>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              O conteúdo será enviado ao provedor de IA configurado para
              extração. Os arquivos originais não são armazenados pelo Trainvy.
              Evite dados de saúde e dados de terceiros.
            </p>
            <Button
              disabled={
                busy || recorder.isRecording || (!prompt.trim() && !file)
              }
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await generateWorkoutPlanWithAiAction({
                    prompt:
                      prompt.trim() ||
                      "Transcreva somente os dados explícitos do arquivo.",
                    ...file,
                  });
                  if (result.success) setDraft(result.data);
                  else setError(result.error);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Extraindo…" : "Extrair e revisar ficha"}
            </Button>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const workoutDays = draft.workoutDays.map((day, i) => ({
                  ...day,
                  order: i,
                  name: day.name!,
                  weekDay: day.weekDay!,
                  isRest: day.isRest!,
                  estimatedDurationInSeconds: day.estimatedDurationInSeconds!,
                  exercises: day.exercises.map((ex, j) => ({
                    ...ex,
                    order: j,
                    sets: ex.sets!,
                    reps: ex.reps!,
                    warmupSets: ex.warmupSets!,
                    restTimeInSeconds: ex.restTimeInSeconds!,
                  })),
                }));
                const result = await confirmWorkoutImportAction({
                  previewToken: draft.previewToken,
                  confirmed: true,
                  name: draft.name!,
                  workoutDays,
                } as ConfirmWorkoutImportBody);
                if (result.status === 201) {
                  toast.success("Ficha pessoal salva como rascunho.");
                  onClose();
                  router.push(`/workout-plans/${result.data.id}`);
                  router.refresh();
                } else
                  setError(
                    (result.data as { error?: string }).error ??
                      "Revise os campos ausentes antes de salvar.",
                  );
              } catch {
                setError(
                  "Não foi possível salvar. Seus dados continuam nesta prévia.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3 className="font-semibold">Revise e complete a ficha</h3>
            {draft.questions.map((q, i) => (
              <p key={i} className="text-sm text-amber-600 dark:text-amber-400">
                {q}
              </p>
            ))}
            <label className="grid gap-1 text-sm">
              Nome do plano
              <input
                required
                maxLength={100}
                className={inputClass}
                value={draft.name ?? ""}
                onChange={(e) => {
                  setConfirmed(false);
                  setDraft({ ...draft, name: e.target.value });
                }}
              />
            </label>
            {draft.workoutDays.map((day, i) => (
              <fieldset key={i} className="rounded-xl border p-4 space-y-3">
                <legend className="px-2 text-sm font-semibold">
                  Treino {i + 1}
                </legend>
                <label className="grid gap-1 text-sm">
                  Nome
                  <input
                    required
                    className={inputClass}
                    value={day.name ?? ""}
                    onChange={(e) => updateDay(i, "name", e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Dia
                  <select
                    required
                    className={inputClass}
                    value={day.weekDay ?? ""}
                    onChange={(e) => updateDay(i, "weekDay", e.target.value)}
                  >
                    <option value="">Informe o dia</option>
                    {weekDays.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Tipo
                  <select
                    required
                    className={inputClass}
                    value={day.isRest === null ? "" : String(day.isRest)}
                    onChange={(e) =>
                      updateDay(i, "isRest", e.target.value === "true")
                    }
                  >
                    <option value="">Informe</option>
                    <option value="false">Treino</option>
                    <option value="true">Descanso</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Duração informada (segundos)
                  <input
                    required
                    min={0}
                    type="number"
                    className={inputClass}
                    value={day.estimatedDurationInSeconds ?? ""}
                    onChange={(e) =>
                      updateDay(
                        i,
                        "estimatedDurationInSeconds",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </label>
                {day.exercises.map((ex, j) => (
                  <div key={j} className="rounded-xl bg-muted/40 p-3 space-y-2">
                    <label className="grid gap-1 text-sm">
                      Exercício
                      <input
                        required
                        className={inputClass}
                        value={ex.name}
                        onChange={(e) =>
                          updateDay(
                            i,
                            "exercises",
                            day.exercises.map((v, k) =>
                              k === j ? { ...v, name: e.target.value } : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {numberFields.map(([key, label]) => (
                        <label key={key} className="grid gap-1 text-xs">
                          {label}
                          <input
                            required
                            min={key === "sets" || key === "reps" ? 1 : 0}
                            type="number"
                            className={inputClass}
                            value={ex[key] ?? ""}
                            onChange={(e) =>
                              updateDay(
                                i,
                                "exercises",
                                day.exercises.map((v, k) =>
                                  k === j
                                    ? {
                                        ...v,
                                        [key]:
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value),
                                      }
                                    : v,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["targetLoadInGrams", "Carga informada (gramas)"],
                          ["targetRir", "RIR informado"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="grid gap-1 text-xs">
                          {label} · opcional
                          <input
                            min={0}
                            type="number"
                            className={inputClass}
                            value={ex[key] ?? ""}
                            onChange={(e) =>
                              updateDay(
                                i,
                                "exercises",
                                day.exercises.map((v, k) =>
                                  k === j
                                    ? {
                                        ...v,
                                        [key]:
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value),
                                      }
                                    : v,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="grid gap-1 text-xs">
                      Cadência informada · opcional
                      <input
                        className={inputClass}
                        value={ex.tempo ?? ""}
                        onChange={(e) =>
                          updateDay(
                            i,
                            "exercises",
                            day.exercises.map((v, k) =>
                              k === j
                                ? { ...v, tempo: e.target.value || null }
                                : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {draft.provenance
                        .filter((p) =>
                          p.path.startsWith(`workoutDays.${i}.exercises.${j}.`),
                        )
                        .map((p) => p.quote)
                        .filter((v, k, a) => a.indexOf(v) === k)
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </fieldset>
            ))}
            {!draft.workoutDays.some((d) => d.exercises.length > 0) && (
              <p className="text-sm">
                Não foram identificados exercícios explícitos. Volte e informe
                sua lista ou envie uma ficha legível.
              </p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Revisei a ficha e confirmei os valores. Os dados que completei
              foram informados por mim.
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setDraft(null);
                  setConfirmed(false);
                }}
              >
                Voltar
              </Button>
              <Button
                disabled={
                  busy ||
                  !confirmed ||
                  !draft.workoutDays.some((d) => d.exercises.length > 0)
                }
              >
                {busy ? "Salvando…" : "Confirmar e salvar rascunho pessoal"}
              </Button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
