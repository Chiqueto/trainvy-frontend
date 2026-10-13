"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  promptInstall: async () => false,
});

function subscribeToStandalone(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)")
      : null;

  mediaQuery?.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);

  return () => {
    mediaQuery?.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const isMatchMediaStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const isNavigatorStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
    true;
  return Boolean(isMatchMediaStandalone || isNavigatorStandalone);
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

function subscribeToIOS() {
  return () => {};
}

function getIOSSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function getIOSServerSnapshot(): boolean {
  return false;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [appInstalledManually, setAppInstalledManually] = useState(false);

  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  const isIOS = useSyncExternalStore(
    subscribeToIOS,
    getIOSSnapshot,
    getIOSServerSnapshot,
  );

  const isInstalled = isStandalone || appInstalledManually;

  useEffect(() => {
    // 1. Registrar Service Worker em produção
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) =>
            console.error("Falha ao registrar Service Worker:", err),
          );
      });
    }

    // 2. Capturar evento de instalação do navegador
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setAppInstalledManually(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setAppInstalledManually(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("Erro ao solicitar instalação PWA:", err);
    }
    return false;
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt) || (isIOS && !isInstalled),
        isInstalled,
        isIOS,
        promptInstall,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
