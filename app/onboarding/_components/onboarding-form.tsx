"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Dumbbell, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOnboardingAction } from "../_actions";
import {
  getOnboardingError,
  onboardingSchema,
} from "../_lib/onboarding-schema";

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Dumbbell className="size-6" aria-hidden="true" />
          </div>
          <p className="font-heading text-xs font-semibold uppercase tracking-widest text-primary">
            Boas-vindas ao Trainvy
          </p>
          <h1 className="font-heading text-3xl font-bold">
            Vamos começar pelo seu perfil
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Preencha seus dados para acompanhar sua evolução. Você poderá
            atualizá-los no perfil quando quiser.
          </p>
        </header>

        <form
          className="space-y-5 rounded-2xl border border-border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            setError("");
            const input = Object.fromEntries(new FormData(event.currentTarget));
            const parsed = onboardingSchema.safeParse(input);
            if (!parsed.success) {
              setError(getOnboardingError(parsed.error));
              return;
            }
            startTransition(async () => {
              try {
                const result = await completeOnboardingAction(input);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                router.replace(result.destination);
                router.refresh();
              } catch {
                setError(
                  "Falha de conexão. Seus campos foram preservados; tente novamente.",
                );
              }
            });
          }}
        >
          <fieldset disabled={pending} className="space-y-4">
            <legend className="sr-only">Dados iniciais do perfil</legend>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Idade (anos)
              <Input
                name="age"
                type="number"
                inputMode="numeric"
                min={10}
                max={120}
                step={1}
                required
                placeholder="Ex.: 28"
                aria-describedby={error ? "onboarding-error" : undefined}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Peso (kg)
                <Input
                  name="weightKg"
                  inputMode="decimal"
                  required
                  maxLength={10}
                  placeholder="Ex.: 75,5"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Altura (cm)
                <Input
                  name="heightCm"
                  type="number"
                  inputMode="numeric"
                  min={50}
                  max={250}
                  step={1}
                  required
                  placeholder="Ex.: 175"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Gordura corporal (%) — opcional
              <Input
                name="bodyFatPercentage"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                placeholder="Deixe em branco se não souber"
                aria-describedby="body-fat-help"
              />
              <span
                id="body-fat-help"
                className="text-xs font-normal text-muted-foreground"
              >
                Você não precisa saber esse valor para continuar.
              </span>
            </label>
          </fieldset>
          {error && (
            <p
              id="onboarding-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="min-h-12 w-full rounded-full font-semibold"
          >
            {pending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
            {pending ? "Salvando..." : "Concluir cadastro"}
          </Button>
        </form>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Depois, monte sua rotina de treino ou acompanhe o plano enviado pelo
          seu treinador.
        </p>
      </div>
    </main>
  );
}
