"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, Minus } from "lucide-react";
import type { ListAdminExercises200Item } from "@/app/_lib/api/fetch-generated";
import { anatomySearchTerms } from "@/app/_lib/exercise-anatomy";
import { ExerciseExecutionDialog } from "@/app/_components/exercise-media/exercise-execution-dialog";
import { Button } from "@/components/ui/button";
import {
  coverage,
  muscleLabels,
  normalizeCatalogSearch,
  priorityLabels,
  implementationQueue,
  trainingGroupLabels,
} from "../_lib/exercise-coverage";
import {
  catalogColumns,
  compareCatalogRows,
  groupNames,
  muscleNames,
  type CatalogColumn,
  type CatalogSort,
} from "../_lib/exercise-table";
import {
  ExerciseColumnControls,
  useExerciseColumns,
} from "./exercise-column-controls";
import { ExerciseMusclesEditor } from "./exercise-muscles-editor";

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
const selectClass = "h-10 w-full rounded-lg border bg-background px-2 text-sm";

export function ExercisesCatalog({
  exercises,
}: {
  exercises: ListAdminExercises200Item[];
}) {
  const router = useRouter();
  const columns = useExerciseColumns();
  const [overrides, setOverrides] = useState<
    Record<string, Pick<ListAdminExercises200Item, "muscles" | "updatedAt">>
  >({});
  const catalog = exercises.map((e) => {
    const saved = overrides[e.id];
    if (!saved || Date.parse(saved.updatedAt) <= Date.parse(e.updatedAt))
      return e;
    return {
      ...e,
      ...saved,
      anatomy: null,
      review: e.review ? { ...e.review, matches: false } : null,
    };
  });
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [group, setGroup] = useState("");
  const [filter, setFilter] = useState("");
  const [muscle, setMuscle] = useState("");
  const [muscleRole, setMuscleRole] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState<CatalogSort>({
    column: "priority",
    direction: "asc",
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const queue = implementationQueue(catalog);
  const next = catalog.find((e) => queue.get(e.id) === 1);
  const preview = catalog.find((e) => e.id === previewId);
  const families = [
    ...new Set(catalog.map((e) => e.family ?? "Sem família definida")),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const rows = catalog
    .filter((e) => {
      const c = coverage(e);
      return (
        normalizeCatalogSearch(
          `${e.name} ${e.id} ${anatomySearchTerms(e.anatomy).join(" ")} ${e.muscles.map((m) => muscleLabels[m.muscleGroup]).join(" ")} ${e.muscles.some((m) => m.muscleGroup === "CHEST") ? "peitoral" : ""}`,
        ).includes(normalizeCatalogSearch(query)) &&
        (!family || (e.family ?? "Sem família definida") === family) &&
        (!group ||
          (group === "undefined"
            ? !e.groups?.length
            : e.groups?.includes(group as keyof typeof trainingGroupLabels))) &&
        (!muscle ||
          e.muscles.some(
            (m) =>
              m.muscleGroup === muscle &&
              (!muscleRole || m.role === muscleRole),
          )) &&
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
    .sort((a, b) => compareCatalogRows(a, b, sort));
  function clearFilters() {
    setQuery("");
    setFamily("");
    setGroup("");
    setFilter("");
    setMuscle("");
    setMuscleRole("");
    setPriority("");
  }
  const metrics = [
    { label: "Exercícios globais", value: catalog.length, filter: "" },
    {
      label: "Com animação 3D",
      value: catalog.filter((e) => coverage(e).animation).length,
      filter: "3d",
    },
    {
      label: "3D pendente",
      value: catalog.filter((e) => !coverage(e).animation).length,
      filter: "no3d",
    },
    {
      label: "Sem classificação muscular",
      value: catalog.filter((e) => !coverage(e).classified).length,
      filter: "unclassified",
    },
  ];
  function select(
    label: string,
    value: string,
    set: (value: string) => void,
    options: Record<string, string>,
    empty: string,
    disabled = false,
  ) {
    return (
      <label className="space-y-1.5 text-xs font-medium">
        {label}
        <select
          value={value}
          onChange={(e) => set(e.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">{empty}</option>
          {Object.entries(options).map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </select>
      </label>
    );
  }
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
            Organize o catálogo global, confira os músculos de cada movimento e
            acompanhe a cobertura de conteúdo.
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
              clearFilters();
              setFilter(m.filter);
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
      <details className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Fila de implementação 3D · {queue.size} pendentes
        </summary>
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
          Animações disponíveis ficam fora da fila; filtros preservam as
          posições originais.
        </p>
      </details>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-xs font-medium">
          Buscar por nome ou ID
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: landmine, supino…"
            className={selectClass}
          />
        </label>
        {select(
          "Família",
          family,
          setFamily,
          Object.fromEntries(families.map((f) => [f, f])),
          "Todas as famílias",
        )}
        {select(
          "Grupo de exercícios",
          group,
          setGroup,
          { ...trainingGroupLabels, undefined: "Sem grupo definido" },
          "Todos os tipos de treino",
        )}
        {select(
          "Grupo muscular",
          muscle,
          setMuscle,
          muscleLabels,
          "Todos os grupos",
        )}
        {select(
          "Papel do músculo",
          muscleRole,
          setMuscleRole,
          { PRIMARY: "Somente principal", SECONDARY: "Somente secundário" },
          "Principal ou secundário",
          !muscle,
        )}
        {select(
          "Conteúdo",
          filter,
          setFilter,
          {
            "3d": "Com 3D",
            no3d: "Sem 3D",
            images: "Com imagens",
            noimages: "Sem imagens",
            novisual: "Sem qualquer visual",
            unclassified: "Sem classificação muscular",
            noinstructions: "Sem instruções cadastradas",
          },
          "Todos os exercícios",
        )}
        {select(
          "Prioridade 3D",
          priority,
          setPriority,
          { ...priorityLabels, undefined: "Sem prioridade definida" },
          "Todas as prioridades",
        )}
        <label className="space-y-1.5 text-xs font-medium">
          Ordenação
          <select
            value={`${sort.column}:${sort.direction}`}
            onChange={(e) => {
              const [column, direction] = e.target.value.split(":");
              setSort({
                column: column as CatalogSort["column"],
                direction: direction as CatalogSort["direction"],
              });
            }}
            className={selectClass}
          >
            {Object.entries(catalogColumns)
              .filter(([column]) => column !== "details")
              .flatMap(([column, label]) =>
                ["asc", "desc"].map((direction) => (
                  <option
                    key={`${column}:${direction}`}
                    value={`${column}:${direction}`}
                  >
                    {column === "priority" && direction === "asc"
                      ? "Fila de implementação 3D"
                      : `${label} (${direction === "asc" ? "crescente" : "decrescente"})`}
                  </option>
                )),
              )}
          </select>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Os grupos podem se combinar: um salto pode ser de potência e pliometria.
        Landmine é uma família de implemento e não indica, por si só, execução
        explosiva.
      </p>
      <ExerciseColumnControls columns={columns} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p role="status">
          {rows.length} de {catalog.length} exercícios · Totais dos cartões
          consideram todo o catálogo
        </p>
        <button
          className="min-h-9 text-primary underline"
          onClick={clearFilters}
        >
          Limpar filtros
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Catálogo global com músculos e cobertura de conteúdo. Clique nos
            títulos para ordenar.
          </caption>
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              {columns.visible.map((column) => (
                <th
                  key={column}
                  scope="col"
                  aria-sort={
                    sort.column === column
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="whitespace-nowrap px-4 py-3 font-medium"
                >
                  {column === "details" ? (
                    catalogColumns[column]
                  ) : (
                    <button
                      className="min-h-9 text-left"
                      onClick={() =>
                        setSort({
                          column,
                          direction:
                            sort.column === column && sort.direction === "asc"
                              ? "desc"
                              : "asc",
                        })
                      }
                    >
                      {catalogColumns[column]}
                      <span aria-hidden className="ml-1">
                        {sort.column === column
                          ? sort.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <ExerciseRow
                key={e.id}
                exercise={e}
                columns={columns.visible}
                open={selected === e.id}
                toggle={() => {
                  setSelected(selected === e.id ? null : e.id);
                  setEditing(null);
                }}
                preview={() => setPreviewId(e.id)}
                queuePosition={queue.get(e.id)}
                editing={editing === e.id}
                onEdit={() => setEditing(e.id)}
                onCancel={() => setEditing(null)}
                onSaved={(result) => {
                  setOverrides((previous) => ({ ...previous, [e.id]: result }));
                  setEditing(null);
                  router.refresh();
                }}
              />
            ))}
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
        Principais e secundários são grupos anatômicos ilustrativos, não medidas
        de ativação ou intensidade. “Nenhum cadastrado” não comprova isolamento
        muscular. Alterar a classificação pode atualizar relatórios por músculo
        de sessões anteriores; cargas, séries e histórico permanecem
        registrados. Ter imagem não significa ter 3D; músculos do cadastro e da
        animação são verificações separadas.
      </p>
      {preview && (
        <ExerciseExecutionDialog
          key={preview.id}
          isOpen
          onClose={() => setPreviewId(null)}
          exerciseId={preview.id}
          exerciseName={preview.name}
        />
      )}
    </div>
  );
}

function ExerciseRow({
  exercise: e,
  columns,
  open,
  toggle,
  preview,
  queuePosition,
  editing,
  onEdit,
  onCancel,
  onSaved,
}: {
  exercise: ListAdminExercises200Item;
  columns: CatalogColumn[];
  open: boolean;
  toggle: () => void;
  preview: () => void;
  queuePosition?: number;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: (
    result: Pick<ListAdminExercises200Item, "id" | "updatedAt" | "muscles">,
  ) => void;
}) {
  const c = coverage(e);
  function cell(column: CatalogColumn) {
    switch (column) {
      case "priority":
        return (
          <>
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
          </>
        );
      case "name":
        return e.name;
      case "family":
        return e.family ?? "Sem família definida";
      case "groups":
        return groupNames(e) || "Sem grupo definido";
      case "primary":
        return muscleNames(e, "PRIMARY") || "Não definidos";
      case "secondary":
        return muscleNames(e, "SECONDARY") || "Nenhum cadastrado";
      case "animation":
        return <Status value={!!c.animation} />;
      case "images":
        return <Status value={c.images} no="Sem imagens" />;
      case "instructions":
        return <Status value={c.instructions} />;
      case "updatedAt":
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo",
        }).format(new Date(e.updatedAt));
      case "details":
        return (
          <button
            className="min-h-11 text-xs font-semibold text-primary"
            aria-expanded={open}
            aria-label={`${open ? "Fechar" : "Ver detalhes"} de ${e.name}`}
            aria-controls={`details-${e.id}`}
            onClick={toggle}
          >
            {open ? "Fechar" : "Ver detalhes"}
          </button>
        );
    }
  }
  return (
    <>
      <tr className="border-b border-border/60 hover:bg-muted/20">
        {columns.map((column) =>
          column === "name" ? (
            <th
              key={column}
              scope="row"
              className="min-w-60 px-4 py-4 font-medium"
            >
              {cell(column)}
            </th>
          ) : (
            <td
              key={column}
              className={`px-4 py-4 ${["primary", "secondary", "family", "groups"].includes(column) ? "min-w-44 text-xs" : ""}`}
            >
              {cell(column)}
            </td>
          ),
        )}
      </tr>
      {open && (
        <tr id={`details-${e.id}`}>
          <td colSpan={columns.length} className="border-b bg-muted/20 p-5">
            <div className="grid gap-5 md:grid-cols-2">
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
                <p className="mt-1 text-xs">
                  Família: {e.family ?? "Sem família definida"}
                </p>
                <p className="mt-1 text-xs">
                  Grupos: {groupNames(e) || "Sem grupo definido"}
                </p>
                <p className="mt-1 text-xs">
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
                {(["PRIMARY", "SECONDARY"] as const).map((role) => (
                  <p key={role} className="mt-2 text-xs">
                    <strong>
                      {role === "PRIMARY" ? "Principais" : "Secundários"}:
                    </strong>{" "}
                    {muscleNames(e, role) || "Não definidos"}
                  </p>
                ))}
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={onEdit}
                  disabled={editing}
                >
                  Editar músculos
                </Button>
              </div>
              {e.anatomy && (
                <div className="md:col-span-2 text-xs">
                  <p className="font-semibold">
                    Revisão anatômica · {e.anatomy.version}
                  </p>
                  <p className="mt-2">{e.anatomy.variant}</p>
                  <p className="mt-2 text-muted-foreground">
                    {e.anatomy.notes}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {e.anatomy.sources.map((source) => (
                      <li key={source.id}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          {source.title}
                        </a>
                        <p className="text-muted-foreground">
                          {source.limitation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {editing && (
                <div className="md:col-span-2">
                  <ExerciseMusclesEditor
                    key={e.id}
                    exercise={e}
                    onSaved={onSaved}
                    onCancel={onCancel}
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Revisão do catálogo
                </p>
                {e.review ? (
                  <>
                    <p className="mt-2 text-xs">
                      Versão {e.review.version} ·{" "}
                      {e.review.matches
                        ? "Classificação conforme a revisão"
                        : "Classificação diferente da revisão versionada"}
                    </p>
                    {e.review.notes && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {e.review.notes}
                      </p>
                    )}
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer">
                        Referências e limites
                      </summary>
                      <p className="mt-2 text-muted-foreground">
                        Classificação editorial por ação articular, sinergia e
                        estabilização. As referências apoiam famílias de
                        movimento; não constituem medição individual de cada
                        variação.
                      </p>
                      <ul className="mt-2 space-y-1">
                        {e.review.sources.map((s, index) => (
                          <li key={`${s.url}-${index}`}>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </>
                ) : (
                  <p className="mt-2 text-xs">
                    Sem revisão versionada para este cadastro.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Planejamento 3D
                </p>
                {e.priority3d ? (
                  <>
                    <p className="mt-2 text-xs">
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
                  <p className="mt-2 text-xs">
                    Este exercício ainda não recebeu prioridade de
                    implementação.
                  </p>
                )}
                <p className="mt-2 text-xs">
                  Mídias ativas: {e.media.length} · Movimento em arquivo
                  (vídeo/GIF): {c.motion ? "Disponível" : "Não cadastrado"}
                </p>
                {c.animation || c.images || c.motion ? (
                  <Button className="mt-3" variant="outline" onClick={preview}>
                    Visualizar execução
                  </Button>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
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
