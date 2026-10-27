"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { setAuthReturnToAction } from "../_actions";
import styles from "./auth.module.css";

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
          "Não foi possível entrar com Google. Tente novamente. Se este é seu primeiro acesso, escolha Criar conta.",
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
    <div className={styles.googleGroup}>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        aria-busy={isLoading}
        className={styles.googleButton}
      >
        {isLoading ? (
          <>
            <Loader2 size={17} className={styles.spin} />
            Conectando com Google...
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
            Fazer login com Google
            <ArrowUpRight className={styles.buttonArrow} size={17} />
          </>
        )}
      </button>

      {errorMessage && (
        <div role="alert" className={styles.alert}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
