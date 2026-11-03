"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  acceptFeatureTermsAction,
  authorizeFeatureAccessAction,
} from "@/app/_actions/feature-terms";
import { useFeatureTermsCache } from "./feature-consent-provider";
import type { GetFeatureTerms200 } from "@/app/_lib/api/fetch-generated";

type Feature = "AI_WORKOUT" | "EXERCISE_3D";

export function FeatureConsentDialog({
  terms,
  onFinish,
}: {
  terms: GetFeatureTerms200;
  onFinish: (accepted: boolean) => void;
}) {
  const cache = useFeatureTermsCache();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onFinish(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border bg-background p-5 shadow-xl"
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="text-lg font-semibold">
            {terms.title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Leia as limitações e os cuidados antes de continuar. Versão{" "}
            {terms.version}.
          </Dialog.Description>
          <div
            className="overflow-y-auto whitespace-pre-line text-sm leading-relaxed"
            tabIndex={0}
          >
            {terms.text}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={checked}
              disabled={busy}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 size-4 shrink-0"
            />
            Li e compreendi as limitações e os cuidados descritos e aceito
            continuar.
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => onFinish(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={!checked || busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await acceptFeatureTermsAction(
                    terms.feature,
                    terms.version,
                    terms.textHash,
                  );
                  if (!result.success) throw new Error(result.error);
                  cache.update(result.data);
                  onFinish(true);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Não foi possível salvar seu aceite. Tente novamente.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Salvando aceite..." : "Aceitar e continuar"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useFeatureConsent() {
  const cache = useFeatureTermsCache();
  const [terms, setTerms] = useState<GetFeatureTerms200 | null>(null);
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  const requestRevision = useRef(0);
  const cancelConsent = useCallback(() => {
    requestRevision.current += 1;
    pending.current?.(false);
    pending.current = null;
    setTerms(null);
  }, []);
  useEffect(
    () => () => {
      requestRevision.current += 1;
      pending.current?.(false);
    },
    [],
  );
  const requestConsent = useCallback(
    async (feature: Feature) => {
      const revision = ++requestRevision.current;
      const status = await cache.get(feature, feature === "AI_WORKOUT");
      if (revision !== requestRevision.current) return false;
      if (status.accepted) return true;
      return new Promise<boolean>((resolve) => {
        pending.current?.(false);
        pending.current = resolve;
        setTerms(status);
      });
    },
    [cache],
  );
  const dialog = terms ? (
    <FeatureConsentDialog
      key={`${terms.feature}:${terms.textHash}`}
      terms={terms}
      onFinish={(accepted) => {
        setTerms(null);
        pending.current?.(accepted);
        pending.current = null;
      }}
    />
  ) : null;
  return { requestConsent, cancelConsent, dialog };
}

export function FeatureConsentGate({
  feature,
  context,
  children,
  onClose,
  className,
}: {
  feature: Feature;
  context: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  // A different resource must get its own server authorization before mounting.
  return (
    <ConsentGate
      key={`${feature}:${context}`}
      feature={feature}
      context={context}
      onClose={onClose}
      className={className}
    >
      {children}
    </ConsentGate>
  );
}

function ConsentGate({
  feature,
  context,
  children,
  onClose,
  className,
}: {
  feature: Feature;
  context: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const cache = useFeatureTermsCache();
  const { requestConsent, dialog } = useFeatureConsent();
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    // Reuse session terms; the access endpoint still validates and audits usage.
    async function restoreAcceptance() {
      try {
        const status = await cache.get(feature);
        if (!active) return;
        if (status.accepted) {
          const access = await authorizeFeatureAccessAction(feature, context);
          if (!active) return;
          if (!access.success) {
            cache.invalidate(feature);
            throw new Error(access.error);
          }
          setAuthorized(true);
        }
      } catch (err) {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível verificar seu aceite.",
          );
      } finally {
        if (active) setBusy(false);
      }
    }
    void restoreAcceptance();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [feature, context, cache]);
  async function open() {
    setBusy(true);
    setError("");
    try {
      if (await requestConsent(feature)) {
        if (!mounted.current) return;
        const result = await authorizeFeatureAccessAction(feature, context);
        if (!mounted.current) return;
        if (!result.success) {
          cache.invalidate(feature);
          throw new Error(result.error);
        }
        setAuthorized(true);
      }
    } catch (err) {
      if (mounted.current)
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível verificar seu aceite.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const is3D = feature === "EXERCISE_3D";
  const checkingText = is3D
    ? "Verificando seu acesso ao 3D..."
    : "Verificando seu acesso ao Coach IA...";
  const promptText = is3D
    ? "Para abrir a demonstração 3D, leia e aceite o aviso sobre seus limites. O aceite fica registrado na sua conta."
    : "Para usar o Coach IA, leia e aceite o aviso sobre seus limites. O aceite fica registrado na sua conta.";
  const buttonText = is3D ? "Continuar para o 3D" : "Continuar para o Coach IA";

  return (
    <>
      {authorized ? (
        children
      ) : (
        <div className={cn("space-y-3 rounded-xl border bg-background p-4 text-foreground", className)}>
          {onClose && (
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="font-heading text-sm font-semibold">
                {is3D ? "Visualização 3D" : "Coach IA"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-7"
                type="button"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
          {busy ? (
            <p role="status" className="text-sm">
              {checkingText}
            </p>
          ) : (
            <p className="text-sm">
              {promptText}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!busy && <Button type="button" onClick={open}>{buttonText}</Button>}
        </div>
      )}
      {dialog}
    </>
  );
}
