import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/app/_components/bottom-nav";

export default function AthleteNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <main className="mx-auto w-full max-w-lg px-5 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-muted/60 text-muted-foreground border border-border">
          <UserX className="size-8" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h1 className="font-heading text-lg font-bold text-foreground">
            Aluno Não Encontrado
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este aluno não existe, não está ativamente vinculado à sua assessoria ou o vínculo foi encerrado.
          </p>
        </div>

        <Link href="/personal">
          <Button className="h-11 px-6 rounded-xl font-heading font-semibold text-xs flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Voltar para Meus Alunos
          </Button>
        </Link>
      </main>

      <BottomNav activePage="profile" />
    </div>
  );
}
