import Link from "next/link";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PersonalHeader() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <Link
          href="/profile"
          className="flex size-10 items-center justify-center rounded-xl bg-card border border-border text-foreground hover:bg-accent transition-colors"
          title="Voltar ao Perfil"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 font-heading text-xs font-semibold text-primary bg-primary/10 border-primary/20">
          <UserCheck className="size-3.5" />
          Área do Personal
        </Badge>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Meus Alunos
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gerencie seus alunos vinculados e gere convites de assessoria.
        </p>
      </div>
    </div>
  );
}
