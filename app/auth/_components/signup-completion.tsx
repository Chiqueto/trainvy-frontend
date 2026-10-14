"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { finishSignup } from "../_actions";

const messages: Record<string, string> = {
  SIGNUP_INTENT_EXPIRED:
    "Sua intenção de cadastro expirou. Escolha novamente como deseja usar o Trainvy.",
  SIGNUP_INTENT_REQUIRED:
    "Escolha como deseja usar o Trainvy para concluir seu cadastro.",
  SIGNUP_INTENT_CONSUMED:
    "Este cadastro já foi utilizado. Inicie novamente para continuar com segurança.",
  INVALID_SIGNUP_INTENT:
    "Não foi possível validar seu cadastro. Inicie novamente.",
  INVALID_SIGNUP_PLAN:
    "Este plano não está mais disponível. Escolha novamente.",
  UNAUTHORIZED: "Entre com Google para continuar.",
};

export function SignupCompletion({
  returnTo,
}: {
  returnTo?: string | null;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    finishSignup(returnTo)
      .then((result) => {
        if (!current) return;
        if (result.success) router.replace(result.destination);
        else setCode(result.code);
      })
      .catch(() => {
        if (current) setCode("UNAVAILABLE");
      });
    return () => {
      current = false;
    };
  }, [attempt, router, returnTo]);
  if (!code) return <p role="status">Verificando sua conta...</p>;
  return (
    <div className="space-y-4">
      <p role="alert">
        {messages[code] ??
          "Não foi possível concluir seu cadastro. Tente novamente."}
      </p>
      <Button
        variant="outline"
        onClick={() => {
          setCode(null);
          setAttempt((n) => n + 1);
        }}
      >
        Tentar novamente
      </Button>
      <Link
        className="block underline"
        href={
          code === "UNAUTHORIZED"
            ? returnTo
              ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
              : "/auth"
            : returnTo
              ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}`
              : "/auth/signup"
        }
      >
        {code === "UNAUTHORIZED" ? "Entrar" : "Reiniciar cadastro"}
      </Link>
    </div>
  );
}
