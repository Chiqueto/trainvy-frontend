"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { loadAiAvailability } from "@/app/_actions/ai-availability";

const disabled = {
  professionalAiEnabled: false,
  athleteAiEnabled: false,
  accountType: null as string | null,
  enabled: false,
  chatEnabled: false,
  planningEnabled: false,
};
const Context = createContext(disabled);
export function AiAvailabilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(disabled);
  const pathname = usePathname();
  const refresh = useCallback(async () => {
    try {
      setState(await loadAiAvailability());
    } catch {
      setState(disabled);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void loadAiAvailability()
      .then((value) => {
        if (active) setState(value);
      })
      .catch(() => {
        if (active) setState(disabled);
      });
    const reload = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    window.addEventListener("ai-availability-changed", reload);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", reload);
      window.removeEventListener("ai-availability-changed", reload);
    };
  }, [pathname, refresh]);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useAiAvailability() {
  return useContext(Context);
}
export function AiFeature({
  children,
  audience,
  capability,
}: {
  children: ReactNode;
  audience?: "COACH" | "ATHLETE";
  capability?: "chat" | "planning";
}) {
  const policy = useAiAvailability();
  const permitted =
    capability === "chat"
      ? policy.chatEnabled
      : capability === "planning"
        ? policy.planningEnabled
        : policy.enabled;
  const enabled = permitted && (!audience || audience === policy.accountType);
  return enabled ? children : null;
}
