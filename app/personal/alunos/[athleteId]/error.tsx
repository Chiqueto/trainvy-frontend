"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AthleteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na página do aluno:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-5 bg-background text-center">
      <div className="max-w-sm flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-heading text-base font-bold text-foreground">
            Não foi possível carregar os dados do aluno
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ocorreu uma instabilidade momentânea. Verifique sua conexão e tente novamente.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full pt-2">
          <Button
            onClick={reset}
            className="h-11 rounded-xl font-heading font-semibold text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className="size-4" />
            Tentar Novamente
          </Button>

          <Link href="/personal">
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-heading font-semibold text-xs flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Voltar para Alunos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
