"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Dumbbell, Trophy } from "lucide-react";
import type { GetCurrentTrainingWeek200 } from "@/app/_lib/api/fetch-generated";
import { BodyHeatmapSVG } from "@/app/planning/_components/tactical/body-heatmap-svg";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import { Button } from "@/components/ui/button";

const number = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  });

export function WeeklySummary() {
  const [data, setData] = useState<GetCurrentTrainingWeek200 | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<"muscles" | "attributes">("muscles");
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(
          `/api/training-week?tz=${encodeURIComponent(tz)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("week");
        const result: GetCurrentTrainingWeek200 = await response.json();
        if (!controller.signal.aborted) setData(result);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  if (error)
    return (
      <section
        className="rounded-2xl border border-border bg-card p-5"
        role="alert"
      >
        <p className="text-sm">Não foi possível carregar o resumo da semana.</p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            setError(false);
            setAttempt((n) => n + 1);
          }}
        >
          Tentar novamente
        </Button>
      </section>
    );
  if (!data)
    return (
      <section
        aria-label="Carregando resumo da semana"
        aria-busy="true"
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-heading text-xl font-semibold">Resumo da semana</h2>
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </section>
    );

  const active = data.muscles
    .filter((m) => m.directWorkingSets + m.indirectWorkingSets > 0)
    .sort(
      (a, b) =>
        b.directWorkingSets - a.directWorkingSets ||
        b.indirectWorkingSets - a.indirectWorkingSets,
    );
  const volumes = Object.fromEntries(
    data.muscles.map((m) => [m.muscleGroup, m.directWorkingSets]),
  );
  const indirect = Object.fromEntries(
    data.muscles.map((m) => [m.muscleGroup, m.indirectWorkingSets]),
  );
  const attributes = [
    {
      label: "Força · faixa curta",
      range: "1–5 repetições",
      value: data.attributes.shortReps,
      color: "bg-sky-400",
    },
    {
      label: "Hipertrofia · faixa intermediária",
      range: "6–14 repetições",
      value: data.attributes.mediumReps,
      color: "bg-violet-400",
    },
    {
      label: "Resistência · faixa longa",
      range: "15+ repetições",
      value: data.attributes.longReps,
      color: "bg-amber-400",
    },
  ];
  const max = Math.max(1, ...attributes.map((a) => a.value));
  return (
    <section
      aria-labelledby="week-title"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {dateLabel(data.startDate)} – {dateLabel(data.endDate)}
            </p>
            <h2 id="week-title" className="font-heading text-xl font-semibold">
              Resumo da semana
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Domingo a sábado · treinos concluídos
            </p>
          </div>
          <span className="rounded-full bg-primary/10 p-2.5 text-primary">
            <Dumbbell className="size-5" />
          </span>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-border rounded-xl bg-secondary/60 py-3 text-center">
          {[
            [number(data.workoutsCompleted), "treinos"],
            [number(data.workingSets), "séries de trabalho"],
            [number(data.loadVolumeKg), "kg de volume"],
          ].map(([value, label]) => (
            <div key={label} className="px-1">
              <dd className="font-heading text-lg font-semibold sm:text-xl">
                {value}
              </dd>
              <dt className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                {label}
              </dt>
            </div>
          ))}
        </dl>
        <div
          className="grid grid-cols-7 gap-1"
          aria-label="Treinos por dia da semana"
        >
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((label, i) => {
            const day = new Date(`${data.startDate}T12:00:00Z`);
            day.setUTCDate(day.getUTCDate() + i);
            const date = day.toISOString().slice(0, 10);
            const count =
              data.days.find((d) => d.date === date)?.workoutsCompleted ?? 0;
            return (
              <div
                key={label}
                className="text-center"
                aria-label={`${label}: ${count} treinos`}
              >
                <span
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs ${count ? "bg-primary/15 font-semibold text-primary" : "bg-secondary text-muted-foreground"}`}
                >
                  {count || "·"}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {data.workoutsCompleted === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Sua semana começa aqui. Ao concluir um treino, seus registros
            aparecem neste resumo.
          </p>
        )}
        <div
          role="group"
          aria-label="Visão do resumo"
          className="grid grid-cols-2 rounded-xl bg-secondary p-1"
        >
          {(
            [
              ["muscles", "Mapa muscular"],
              ["attributes", "Atributos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`min-h-10 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring ${tab === value ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "muscles" ? (
          <div className="grid gap-5 md:grid-cols-2">
            <BodyHeatmapSVG
              volumes={volumes}
              recordedIndirectVolumes={indirect}
            />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">O que você treinou</h3>
              <p className="text-xs text-muted-foreground">
                Séries por grupo muscular, sem pesos estimados.
              </p>
              {active.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">
                  Ainda não há séries com músculos cadastrados nesta semana.
                </p>
              )}
              {(showAll ? active : active.slice(0, 4)).map((m) => (
                <div
                  key={m.muscleGroup}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="text-sm font-medium">
                    {getMuscleGroupLabel(m.muscleGroup)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {m.directWorkingSets}
                    </span>{" "}
                    diretas · {m.indirectWorkingSets} indiretas
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {number(m.directLoadVolumeKg)} kg de volume direto
                  </p>
                </div>
              ))}
              {active.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Ver menos" : `Ver todos (${active.length})`}
                </Button>
              )}
              {data.unclassifiedWorkingSets > 0 && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {data.unclassifiedWorkingSets} séries sem classificação
                  muscular. Elas contam no total, mas não colorem o mapa.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Seu perfil de séries na semana
              </h3>
            </div>
            {attributes.map((a) => (
              <div key={a.label}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.range}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {a.value} séries
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${a.color}`}
                    style={{ width: `${(a.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Contagem pelas repetições realizadas, com as mesmas faixas da
              montagem de treino. As faixas se sobrepõem em seus efeitos; não
              medem capacidade física nem ganhos. Explosão e estabilidade
              precisam de dados específicos e não recebem pontuação estimada.
            </p>
            {data.attributes.withoutReps > 0 && (
              <p className="text-xs text-muted-foreground">
                {data.attributes.withoutReps} séries sem repetições informadas
                ficam fora das faixas.
              </p>
            )}
          </div>
        )}
        <details className="border-t border-border pt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer py-1 font-medium">
            Como os números são calculados
          </summary>
          <p className="mt-2 leading-relaxed">
            Somente séries de trabalho concluídas em sessões concluídas. Volume
            = carga registrada × repetições, sem multiplicador automático por
            lado e sem estimar peso corporal. Cada série conta uma vez no total
            e pode envolver vários grupos. Músculos usam o cadastro atual do
            exercício, incluindo substituições registradas por série. Cores
            ilustram grupos principais e secundários; não representam ativação,
            EMG ou intensidade de esforço.
          </p>
        </details>
        <Link
          href="/history"
          className="flex min-h-11 items-center justify-between rounded-xl border border-border px-3 text-sm font-medium hover:bg-secondary"
        >
          Ver treinos e registros
          <ArrowRight className="size-4 text-primary" />
        </Link>
      </div>
    </section>
  );
}
