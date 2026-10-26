import Link from "next/link";
import { UserCheck, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PersonalHeader() {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 font-heading text-xs font-semibold text-primary bg-primary/10 border-primary/20">
          <UserCheck className="size-3.5" />
          Trainvy Pro · Gestão de Alunos
        </Badge>

        <Link
          href="/profile"
          className="flex items-center gap-1.5 text-xs font-heading font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          title="Configurações do Perfil"
        >
          <Settings className="size-3.5" />
          <span>Configurações</span>
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Painel do Personal
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gerencie seus alunos, acompanhe execuções e prescreva treinos com IA.
        </p>
      </div>
    </div>
  );
}
