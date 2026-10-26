import Link from "next/link";
import { Dumbbell, Plus, Users, Sparkles } from "lucide-react";

export function CoachPersonalWorkoutWelcome() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-heading font-semibold text-primary">
        <Dumbbell className="size-4" />
        <span>Espaço do Treino do Personal</span>
      </div>

      <div className="space-y-1">
        <h2 className="font-heading text-base font-bold text-foreground">
          Pronto para montar sua rotina pessoal?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Como treinador, você pode prescrever treinos para seus alunos e também acompanhar
          seus próprios treinos, cargas e evolução física com a mesma inteligência.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-2">
        <Link
          href="/planning/periodizations/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-heading font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition active:scale-95"
        >
          <Plus className="size-3.5" />
          <span>Montar Meu Treino</span>
        </Link>

        <Link
          href="/personal"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-heading font-semibold text-foreground hover:bg-accent transition active:scale-95"
        >
          <Users className="size-3.5 text-primary" />
          <span>Ir para Gestão de Alunos</span>
        </Link>
      </div>
    </div>
  );
}
