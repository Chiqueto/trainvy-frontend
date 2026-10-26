"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";

interface AdminLoginFormProps {
  returnTo?: string;
  currentUser?: {
    email?: string;
    name?: string;
    systemRole?: string;
  } | null;
  isUnauthorized?: boolean;
}

export function AdminLoginForm({
  returnTo = "/admin",
  currentUser,
  isUnauthorized,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const callbackOrigin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            ).replace(/\/+$/, "");

      const callbackURL = `${callbackOrigin}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
      const errorCallbackURL = `${callbackOrigin}/admin/login?error=OAUTH_FAILED`;

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        requestSignUp: false,
        errorCallbackURL,
      });

      if (result?.error) {
        console.error("Erro ao autenticar admin:", result.error);
        setErrorMessage(
          result.error.message || "Não foi possível conectar com a conta Google.",
        );
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Exceção ao iniciar login admin:", err);
      setErrorMessage("Erro ao iniciar login administrativo. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  };

  if (isUnauthorized && currentUser) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left">
          <ShieldAlert className="size-5 shrink-0 text-destructive mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-heading font-bold text-destructive">
              Acesso Não Autorizado
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você está autenticado como{" "}
              <strong className="text-foreground">{currentUser.email}</strong>, mas
              esta conta possui o papel{" "}
              <span className="font-mono text-[11px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                {currentUser.systemRole ?? "USER"}
              </span>{" "}
              e não tem permissão para acessar o painel de administração.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="default"
            className="h-11 w-full rounded-xl gap-2 font-heading text-xs font-bold"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            <span>Entrar com outra conta</span>
          </Button>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-heading text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar para o App Trainvy</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="h-12 w-full cursor-pointer rounded-2xl bg-white text-slate-950 hover:bg-white/90 font-heading text-xs font-bold shadow-md transition active:scale-[0.99] gap-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin text-slate-950" />
            <span>Conectando ao Console...</span>
          </>
        ) : (
          <>
            <Image
              src="/google-icon.svg"
              alt=""
              width={18}
              height={18}
              className="shrink-0"
            />
            <span>Entrar com Google</span>
          </>
        )}
      </Button>

      {errorMessage && (
        <p className="text-center text-xs font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-center pt-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-heading text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Voltar para o App Trainvy</span>
        </Link>
      </div>
    </div>
  );
}
