"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Check, Search, RefreshCw, Minus } from "lucide-react";
import type { ListAdminExercises200Item } from "@/app/_lib/api/fetch-generated";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media/exercise-execution-dialog";
import {
  coverage,
  muscleLabels,
  normalizeCatalogSearch,
  priorityLabels,
  compareImplementationPriority,
  implementationQueue,
} from "../_lib/exercise-coverage";
import { Button } from "@/components/ui/button";

function Status({
  value,
  yes = "Disponível",
  no = "Pendente",
}: {
  value: boolean;
  yes?: string;
  no?: string;
}) {
  const Icon = value ? Check : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${value ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
    >
      <Icon aria-hidden className="size-3.5" />
      {value ? yes : no}
    </span>
  );
}

export function ExercisesCatalog({
  exercises,
}: {
  exercises: ListAdminExercises200Item[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [filter, setFilter] = useState("");
  const [muscle, setMuscle] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("priority");
  const queue = implementationQueue(exercises);
  const next = exercises.find((e) => queue.get(e.id) === 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<ListAdminExercises200Item | null>(
    null,
  );
  const families = [
    ...new Set(exercises.map((e) => e.family ?? "Sem família definida")),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const rows = exercises
    .filter((e) => {
      const c = coverage(e);
      return (
        normalizeCatalogSearch(`${e.name} ${e.id}`).includes(
          normalizeCatalogSearch(query),
        ) &&
        (!family || (e.family ?? "Sem família definida") === family) &&
        (!muscle || e.muscles.some((m) => m.muscleGroup === muscle)) &&
        (!priority ||
          (priority === "undefined"
            ? !e.priority3d
            : e.priority3d?.tier === Number(priority))) &&
        (!filter ||
          (filter === "3d" && !!c.animation) ||
          (filter === "no3d" && !c.animation) ||
          (filter === "images" && c.images) ||
          (filter === "noimages" && !c.images) ||
          (filter === "unclassified" && !c.classified) ||
          (filter === "noinstructions" && !c.instructions) ||
          (filter === "novisual" && !c.animation && !c.images && !c.motion))
      );
    })
    .sort(
      sort === "priority"
        ? compareImplementationPriority
        : (a, b) =>
            a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id),
    );
  const metrics = [
    { label: "Exercícios globais", value: exercises.length, filter: "" },
    {
      label: "Com animação 3D",
      value: exercises.filter((e) => coverage(e).animation).length,
      filter: "3d",
    },
    {
      label: "3D pendente",
      value: exercises.filter((e) => !coverage(e).animation).length,
      filter: "no3d",
    },
    {
      label: "Sem classificação muscular",
      value: exercises.filter((e) => !coverage(e).classified).length,
      filter: "unclassified",
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Biblioteca de movimentos
          </p>
          <h1 className="font-heading text-2xl font-bold">
            Catálogo de exercícios
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Confira o que está cadastrado e acompanhe a produção de conteúdo de
            cada movimento. Dados do catálogo global, sem exercícios
            particulares de usuários.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>
          <RefreshCw className="size-4" />
          Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={() => {
              setFilter(m.filter);
              setFamily("");
              setQuery("");
              setMuscle("");
              setPriority("");
            }}
            className={`rounded-2xl border bg-card p-4 text-left transition hover:border-primary ${filter === m.filter ? "border-primary/60" : "border-border"}`}
          >
            <span className="block text-3xl font-bold tabular-nums">
              {m.value}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {m.label}
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Fila de implementação 3D
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          P1: básicos essenciais → P2: musculação e core → P3: funcional e
          landmine → P4: potência e LPO → P5: habilidades avançadas. Ordem
          editorial por cobertura e complexidade, sem estatística de uso.
        </p>
        {next ? (
          <p className="mt-3 text-sm">
            <strong>Próximo: #1 · {next.name}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              {next.priority3d?.reason}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-sm">
            Nenhum exercício planejado aguardando 3D.
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {queue.size} exercícios na fila. Animações disponíveis ficam fora da
          fila; filtros preservam as posições originais.
        </p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Box className="mr-2 inline size-4 text-primary" />O 3D é contabilizado
        pelo suporte real do visualizador. Ter imagem não significa ter 3D.
        Músculos cadastrados e músculos ilustrados na animação são verificações
        separadas.
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-xs font-medium">
          Buscar por nome ou ID
          <div className="relative">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: landmine, supino…"
              className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm"
            />
          </div>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Família
          <select
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="">Todas as famílias</option>
            {families.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Conteúdo
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="">Todos os exercícios</option>
            <option value="3d">Com 3D</option>
            <option value="no3d">Sem 3D</option>
            <option value="images">Com imagens</option>
            <option value="noimages">Sem imagens</option>
            <option value="novisual">Sem qualquer visual</option>
            <option value="unclassified">Sem classificação muscular</option>
            <option value="noinstructions">Sem instruções cadastradas</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Grupo muscular
          <select
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="">Todos os grupos</option>
            {Object.entries(muscleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Prioridade 3D
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="">Todas as prioridades</option>
            {Object.entries(priorityLabels).map(([tier, label]) => (
              <option key={tier} value={tier}>
                {label}
              </option>
            ))}
            <option value="undefined">Sem prioridade definida</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Ordenação
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="priority">Fila de implementação 3D</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p role="status">
          {rows.length} de {exercises.length} exercícios · Totais dos cartões
          consideram todo o catálogo
        </p>
        <button
          className="min-h-9 text-primary underline"
          onClick={() => {
            setQuery("");
            setFamily("");
            setFilter("");
            setMuscle("");
            setPriority("");
          }}
        >
          Limpar filtros
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Cobertura de conteúdo por exercício
          </caption>
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              {[
                "Prioridade / fila",
                "Exercício / família",
                "Animação 3D",
                "Imagens",
                "Músculos",
                "Instruções",
                "Detalhes",
              ].map((h) => (
                <th
                  scope="col"
                  key={h}
                  className="whitespace-nowrap px-4 py-3 font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const c = coverage(e);
              const open = selected === e.id;
              return (
                <ExerciseRow
                  key={e.id}
                  exercise={e}
                  open={open}
                  toggle={() => setSelected(open ? null : e.id)}
                  preview={() => setPreview(e)}
                  content={c}
                  queuePosition={queue.get(e.id)}
                />
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div className="p-12 text-center">
            <p className="font-medium">Nenhum exercício encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente outro nome ou remova os filtros.
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        “Sem família definida” indica metadado ausente; não significa exercício
        inexistente. Imagens, movimento em arquivo e instruções consideram
        apenas mídias ativas. Instruções próprias do visualizador 3D não contam
        como instruções cadastradas.
      </p>
      {preview && (
        <ExerciseExecutionDialog
          key={preview.id}
          isOpen
          onClose={() => setPreview(null)}
          exerciseId={preview.id}
          exerciseName={preview.name}
        />
      )}
    </div>
  );
}

function ExerciseRow({
  exercise: e,
  content: c,
  open,
  toggle,
  preview,
  queuePosition,
}: {
  exercise: ListAdminExercises200Item;
  content: ReturnType<typeof coverage>;
  open: boolean;
  toggle: () => void;
  preview: () => void;
  queuePosition?: number;
}) {
  return (
    <>
      <tr className="border-b border-border/60 hover:bg-muted/20">
        <td className="min-w-36 px-4 py-4">
          <span className="block text-xs font-semibold">
            {e.priority3d
              ? priorityLabels[e.priority3d.tier]
              : "Sem prioridade definida"}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {c.animation
              ? "3D disponível · fora da fila"
              : queuePosition
                ? `#${queuePosition} na fila`
                : "Aguardando planejamento"}
          </span>
        </td>
        <th scope="row" className="min-w-60 px-4 py-4 font-medium">
          <span className="block">{e.name}</span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {e.family ?? "Sem família definida"}
          </span>
        </th>
        <td className="px-4">
          <Status value={!!c.animation} />
        </td>
        <td className="px-4">
          <Status value={c.images} no="Sem imagens" />
        </td>
        <td className="px-4">
          <Status value={c.classified} yes="Classificado" />
        </td>
        <td className="px-4">
          <Status value={c.instructions} />
        </td>
        <td className="px-4">
          <button
            className="min-h-11 text-xs font-semibold text-primary"
            aria-expanded={open}
            aria-label={`${open ? "Fechar" : "Ver detalhes"} de ${e.name}`}
            aria-controls={`details-${e.id}`}
            onClick={toggle}
          >
            {open ? "Fechar" : "Ver detalhes"}
            <span className="sr-only"> de {e.name}</span>
          </button>
        </td>
      </tr>
      {open && (
        <tr id={`details-${e.id}`}>
          <td colSpan={7} className="border-b bg-muted/20 p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Planejamento 3D
                </p>
                {e.priority3d ? (
                  <>
                    <p className="mt-2 text-sm font-medium">
                      {priorityLabels[e.priority3d.tier]} · {e.priority3d.batch}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.priority3d.reason}
                    </p>
                    <p className="mt-2 text-xs">
                      {c.animation
                        ? "Já disponível; sem nova produção na fila."
                        : queuePosition
                          ? `Posição global: #${queuePosition}.`
                          : "Aguardando planejamento."}{" "}
                      Ordem planejada: {e.priority3d.order}.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Este exercício ainda não recebeu prioridade de
                    implementação.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Identificação
                </p>
                <p className="mt-2 break-all font-mono text-xs select-all">
                  {e.id}
                </p>
                <p className="mt-2 text-xs">
                  Unilateral no cadastro: {e.isUnilateral ? "Sim" : "Não"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atualizado em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(e.updatedAt))}{" "}
                  (Brasília)
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Grupos musculares cadastrados
                </p>
                {["PRIMARY", "SECONDARY"].map((role) => (
                  <p key={role} className="mt-2 text-xs">
                    <strong>
                      {role === "PRIMARY" ? "Principais" : "Secundários"}:
                    </strong>{" "}
                    {e.muscles
                      .filter((m) => m.role === role)
                      .map((m) => muscleLabels[m.muscleGroup] ?? m.muscleGroup)
                      .join(", ") || "Não definidos"}
                  </p>
                ))}
              </div>
              <div className="text-xs">
                <p>Mídias ativas: {e.media.length}</p>
                <p className="mt-1">
                  Movimento em arquivo (vídeo/GIF):{" "}
                  {c.motion ? "Disponível" : "Não cadastrado"}
                </p>
                <p className="mt-1">
                  {c.animation
                    ? "Animação 3D disponível para este exercício."
                    : "Animação 3D ainda não implementada para este exercício."}
                </p>
              </div>
              <div className="flex items-center">
                {c.animation || c.images || c.motion ? (
                  <Button variant="outline" onClick={preview}>
                    Visualizar execução
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sem visual disponível. O exercício está cadastrado e pode
                    receber seu próprio 3D.
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
