"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function PersonalError({ retry }: { retry: () => void }) {
  return (
    <main role="alert" className="mx-auto max-w-xl space-y-4 px-5 py-12">
      <h1 className="font-heading text-xl font-semibold">
        Não foi possível carregar o painel
      </h1>
      <p className="text-sm text-muted-foreground">
        A consulta falhou. Tente novamente para acessar seus alunos e
        prescrições.
      </p>
      <Button onClick={retry}>Tentar novamente</Button>
      <Link className="ml-4 text-sm underline" href="/profile">
        Ir para o perfil
      </Link>
    </main>
  );
}
