"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flame, Heart, Trophy, Zap, ShieldAlert } from "lucide-react";
import { saveSessionFeedbackAction } from "@/app/_actions/session-feedback";
import type {
  GetSessionFeedback200,
  SaveSessionFeedbackBody,
} from "@/app/_lib/api/fetch-generated";
import { Button } from "@/components/ui/button";

const FEELINGS = [
  { id: "great", label: "Ótimo", icon: Trophy, desc: "Rendimento no topo" },
  { id: "energized", label: "Energizado", icon: Zap, desc: "Força e foco" },
  { id: "intense", label: "Intenso", icon: Flame, desc: "No limite muscular" },
  { id: "fatigued", label: "Cansado", icon: ShieldAlert, desc: "Alta fadiga" },
] as const;

export function SummaryFeedbackWidget({
  sessionId,
  initial = null,
  loadFailed = false,
}: {
  sessionId: string;
  initial?: GetSessionFeedback200;
  loadFailed?: boolean;
}) {
  const router = useRouter();
  const [feeling, setFeeling] = useState<
    SaveSessionFeedbackBody["feeling"] | null
  >(initial?.feeling ?? null);
  const [ratings, setRatings] = useState({
    pain: initial?.pain?.toString() ?? "",
    fatigue: initial?.fatigue?.toString() ?? "",
    sleepQuality: initial?.sleepQuality?.toString() ?? "",
  });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saved, setSaved] = useState(Boolean(initial));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function dirty() {
    setSaved(false);
    setError("");
  }
  function save() {
    if (!feeling || pending) return;
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveSessionFeedbackAction(sessionId, {
        feeling,
        pain: ratings.pain === "" ? null : Number(ratings.pain),
        fatigue: ratings.fatigue === "" ? null : Number(ratings.fatigue),
        sleepQuality:
          ratings.sleepQuality === "" ? null : Number(ratings.sleepQuality),
        notes: notes.trim() || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }
  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-label="Avaliação pós-treino"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Heart className="size-4 text-primary" />
          Como você se sentiu hoje?
        </h3>
        {saved && (
          <span
            role="status"
            className="inline-flex items-center gap-1 text-xs text-emerald-500"
          >
            <Check className="size-3" />
            Salvo
          </span>
        )}
      </div>
      {loadFailed ? (
        <div role="alert" className="space-y-3 text-sm">
          <p>Não foi possível carregar sua avaliação.</p>
          <Button variant="outline" onClick={() => router.refresh()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <p className="text-xs text-muted-foreground">
            Registre sua percepção para acompanhar a recuperação. Os campos
            adicionais são opcionais.
          </p>
          <fieldset disabled={pending} className="space-y-4">
            <legend className="sr-only">Sensação e recuperação</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FEELINGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={feeling === item.id}
                  onClick={() => {
                    setFeeling(item.id);
                    dirty();
                  }}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border p-3 text-xs disabled:opacity-60 ${feeling === item.id ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}
                >
                  <item.icon className="size-5 text-primary" />
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  ["pain", "Dor (0 nenhuma, 10 máxima)"],
                  ["fatigue", "Fadiga (0 nenhuma, 10 máxima)"],
                  ["sleepQuality", "Sono (0 ruim, 10 ótimo)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-2 text-xs">
                  {label}
                  <select
                    value={ratings[key]}
                    onChange={(event) => {
                      setRatings((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }));
                      dirty();
                    }}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Não informar</option>
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-2 text-xs">
              Observações
              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  dirty();
                }}
                rows={3}
                maxLength={2000}
                className="rounded-lg border border-input bg-background p-3 text-sm"
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={!feeling || pending || saved}
            className="min-h-11 w-full rounded-full"
          >
            {pending ? "Salvando..." : "Salvar avaliação"}
          </Button>
        </form>
      )}
    </section>
  );
}
