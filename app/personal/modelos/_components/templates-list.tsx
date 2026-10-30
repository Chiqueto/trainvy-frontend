"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Layers,
  Send,
  Pencil,
  Trash2,
  Sparkles,
  Calendar,
  Dumbbell,
  Tag,
  ArrowRight,
  Import,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deleteTemplateAction } from "@/app/personal/_actions";
import {
  AllocateTemplateModal,
  type AthleteOption,
  type TemplateSummary,
} from "./allocate-template-modal";
import {
  CreateTemplateFromPlanModal,
  type CoachPlanOption,
} from "./create-template-from-plan-modal";
import { cn } from "@/lib/utils";

export interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[];
  payload: {
    workoutDays: Array<{
      name: string;
      isRest: boolean;
      exercises: Array<{
        name: string;
        sets: number;
        reps: number;
      }>;
    }>;
  };
  createdAt: string;
}

interface TemplatesListProps {
  initialTemplates: TemplateItem[];
  athletes: AthleteOption[];
  coachPlans: CoachPlanOption[];
}

export function TemplatesList({
  initialTemplates,
  athletes,
  coachPlans,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [templateToAllocate, setTemplateToAllocate] =
    useState<TemplateSummary | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Coleta todas as tags existentes
  const allTags = Array.from(
    new Set(templates.flatMap((t) => t.tags ?? []).filter(Boolean)),
  );

  const handleOpenAllocate = (tpl: TemplateItem) => {
    const totalExercises = tpl.payload.workoutDays.reduce(
      (acc, d) => acc + (d.exercises?.length ?? 0),
      0,
    );
    setTemplateToAllocate({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      workoutDaysCount: tpl.payload.workoutDays.length,
      totalExercisesCount: totalExercises,
    });
    setIsAllocateModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o modelo "${name}"?`)) return;

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteTemplateAction(id);
      if (res.success) {
        toast.success("Modelo de treino excluído com sucesso.");
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(res.error);
      }
      setDeletingId(null);
    });
  };

  // Filtragem
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      (tpl.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      tpl.payload.workoutDays.some(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.exercises.some((e) =>
            e.name.toLowerCase().includes(search.toLowerCase()),
          ),
      );

    if (!matchesSearch) return false;
    if (selectedTag === "ALL") return true;
    return (tpl.tags ?? []).includes(selectedTag);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelo por nome, exercício ou foco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card border-border/70 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {coachPlans.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="h-11 rounded-2xl px-4 font-heading font-medium text-xs sm:text-sm flex items-center gap-2 border-border/80"
              title="Importar um dos seus treinos pessoais como modelo"
            >
              <Import className="size-4" />
              <span>Importar de Meus Treinos</span>
            </Button>
          )}

          <Link href="/personal/modelos/novo">
            <Button className="h-11 rounded-2xl px-5 font-heading font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs shrink-0">
              <Plus className="size-4" />
              <span>Novo Modelo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Chips de Tags */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setSelectedTag("ALL")}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-xl text-xs font-heading font-medium transition-all whitespace-nowrap",
              selectedTag === "ALL"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            Todas as Tags
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-heading font-medium transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/80",
                )}
              >
                <Tag className="size-3" />
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resumo e Contagem */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Mostrando{" "}
          <strong className="text-foreground">
            {filteredTemplates.length}
          </strong>{" "}
          de <strong className="text-foreground">{templates.length}</strong>{" "}
          modelos de treino
        </span>
      </div>

      {/* Lista de Cards de Modelos */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const days = template.payload.workoutDays ?? [];
            const nonRestDays = days.filter((d) => !d.isRest);
            const totalExercises = days.reduce(
              (acc, d) => acc + (d.exercises?.length ?? 0),
              0,
            );
            const isDeleting = deletingId === template.id;

            return (
              <div
                key={template.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Layers className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas: Editar / Excluir */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/personal/modelos/${template.id}/editar`}>
                        <button
                          type="button"
                          className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Editar modelo"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id, template.name)}
                        disabled={isDeleting}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir modelo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges de Estrutura */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-heading font-medium">
                      <Calendar className="size-3.5 text-primary" />
                      <span>
                        {days.length} {days.length === 1 ? "dia" : "dias"} (
                        {nonRestDays.length} treinos)
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-heading font-medium">
                      <Dumbbell className="size-3.5 text-primary" />
                      <span>{totalExercises} exercícios</span>
                    </div>

                    {(template.tags ?? []).map((tag, idx) => (
                      <Badge
                        key={`tag-${idx}`}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-[11px] px-2 py-0.5 font-heading"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Resumo dos Dias de Treino */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {days.slice(0, 4).map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/60 text-[11px] text-muted-foreground"
                      >
                        <span className="font-semibold text-foreground">
                          {d.name}:
                        </span>
                        <span>
                          {d.isRest ? "Off" : `${d.exercises?.length ?? 0} ex`}
                        </span>
                      </span>
                    ))}
                    {days.length > 4 && (
                      <span className="text-[11px] text-muted-foreground self-center">
                        +{days.length - 4} mais
                      </span>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card com CTA Principal: Alocar para Aluno */}
                <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Base reutilizável
                  </span>

                  <Button
                    onClick={() => handleOpenAllocate(template)}
                    className="h-10 rounded-xl px-4 font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="size-3.5" />
                    <span>Usar com aluno</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/80 bg-card/40 p-10 sm:p-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="size-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {search || selectedTag !== "ALL"
                ? "Nenhum modelo encontrado"
                : "Nenhum modelo de treino cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {search || selectedTag !== "ALL"
                ? "Tente ajustar seus termos de busca ou filtros de tags."
                : "Crie modelos de treino reutilizáveis, prepare rascunhos para seus alunos e revise a versão final antes de aprovar e enviar."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {coachPlans.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-2xl h-11 px-5 text-sm font-heading font-medium"
              >
                <Import className="size-4 mr-2" />
                Importar de Meus Treinos
              </Button>
            )}
            <Link href="/personal/modelos/novo">
              <Button className="rounded-2xl h-11 px-6 text-sm font-heading font-semibold shadow-xs">
                <Plus className="size-4 mr-2" />
                Criar Modelo do Zero
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Modal de Alocação de Modelo */}
      <AllocateTemplateModal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        template={templateToAllocate}
        athletes={athletes}
        onSuccess={() => {
          // Toast já disparado no modal
        }}
      />

      {/* Modal de Importação de Plano Pessoal */}
      <CreateTemplateFromPlanModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        plans={coachPlans}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
