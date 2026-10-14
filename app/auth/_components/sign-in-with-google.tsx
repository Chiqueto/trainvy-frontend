"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";
import { setAuthReturnToAction } from "../_actions";

export const SignInWithGoogle = ({
  returnTo,
}: {
  returnTo?: string | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (returnTo) {
        await setAuthReturnToAction(returnTo);
      }

      const callbackOrigin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            ).replace(/\/+$/, "");

      const callbackURL = returnTo
        ? `${callbackOrigin}/auth/complete?returnTo=${encodeURIComponent(returnTo)}`
        : `${callbackOrigin}/auth/complete`;

      const errorCallbackURL = returnTo
        ? `${callbackOrigin}/auth?returnTo=${encodeURIComponent(returnTo)}`
        : `${callbackOrigin}/auth`;

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        requestSignUp: false,
        errorCallbackURL,
      });

      if (result?.error) {
        console.error("Erro ao autenticar com Google:", result.error);
        setErrorMessage(
          result.error.message ||
            `Erro (${result.error.status || "desconhecido"}) ao conectar com Google`,
        );
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Exceção inesperada no login:", err);
      setErrorMessage("Erro ao iniciar login. Tente novamente mais tarde.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="h-[38px] cursor-pointer rounded-full bg-white px-6 text-black hover:bg-white/90 disabled:opacity-75"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-black" />
            Conectando com Google...
          </>
        ) : (
          <>
            <Image
              src="/google-icon.svg"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
            Fazer login com Google
          </>
        )}
      </Button>

      {errorMessage && (
        <p className="max-w-xs text-center text-xs font-medium text-red-200">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
