"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  acceptFeatureTermsAction,
  authorizeFeatureAccessAction,
  getFeatureTermsAction,
} from "@/app/_actions/feature-terms";
import type { GetFeatureTerms200 } from "@/app/_lib/api/fetch-generated";

type Feature = "AI_WORKOUT" | "EXERCISE_3D";

export function FeatureConsentDialog({
  terms,
  onFinish,
}: {
  terms: GetFeatureTerms200;
  onFinish: (accepted: boolean) => void;
}) {
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
  const requestConsent = useCallback(async (feature: Feature) => {
    const revision = ++requestRevision.current;
    const result = await getFeatureTermsAction(feature);
    if (revision !== requestRevision.current) return false;
    if (!result.success) throw new Error(result.error);
    const status = result.data;
    if (status.accepted) return true;
    return new Promise<boolean>((resolve) => {
      pending.current?.(false);
      pending.current = resolve;
      setTerms(status);
    });
  }, []);
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
}: {
  feature: Feature;
  context: string;
  children: ReactNode;
}) {
  // A different resource must get its own server authorization before mounting.
  return (
    <ConsentGate
      key={`${feature}:${context}`}
      feature={feature}
      context={context}
    >
      {children}
    </ConsentGate>
  );
}

function ConsentGate({
  feature,
  context,
  children,
}: {
  feature: Feature;
  context: string;
  children: ReactNode;
}) {
  const { requestConsent, dialog } = useFeatureConsent();
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  useEffect(() => {
    let active = true;
    mounted.current = true;
    // Revalidate the current account/version on every opening. Do not treat a
    // browser cache or an earlier resource's authorization as consent evidence.
    async function restoreAcceptance() {
      try {
        const status = await getFeatureTermsAction(feature);
        if (!active) return;
        if (!status.success) throw new Error(status.error);
        if (status.data.accepted) {
          const access = await authorizeFeatureAccessAction(feature, context);
          if (!active) return;
          if (!access.success) throw new Error(access.error);
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
  }, [feature, context]);
  async function open() {
    setBusy(true);
    setError("");
    try {
      if (await requestConsent(feature)) {
        if (!mounted.current) return;
        const result = await authorizeFeatureAccessAction(feature, context);
        if (!mounted.current) return;
        if (!result.success) throw new Error(result.error);
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
  return (
    <>
      {authorized ? (
        children
      ) : (
        <div className="space-y-3 rounded-xl border bg-background p-4 text-foreground">
          {busy ? (
            <p role="status" className="text-sm">
              Verificando seu acesso ao 3D...
            </p>
          ) : (
            <p className="text-sm">
              Para abrir a demonstração 3D, leia e aceite o aviso sobre seus
              limites. O aceite fica registrado na sua conta.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!busy && <Button onClick={open}>Continuar para o 3D</Button>}
        </div>
      )}
      {dialog}
    </>
  );
}
