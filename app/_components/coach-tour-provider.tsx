"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/app/_lib/auth-client";
import { loadToursAction } from "@/app/personal/_tour-actions";

export interface CoachTourState {
  coachOnboardingCompleted: boolean;
  workoutBuilderOnboardingCompleted: boolean;
}

interface CoachTourContextValue {
  loaded: boolean;
  state: CoachTourState | null;
  ensureLoaded: () => Promise<CoachTourState | null>;
  markCompleted: (tour: "workspace" | "builder") => void;
}

const CoachTourContext = createContext<CoachTourContextValue | null>(null);

export function CoachTourProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const identity = session
    ? `${session.user.id}:${session.session.id}`
    : "anonymous";

  if (identity === "anonymous") {
    return <>{children}</>;
  }

  return (
    <SessionCoachTourProvider key={identity}>
      {children}
    </SessionCoachTourProvider>
  );
}

function SessionCoachTourProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<CoachTourState | null>(null);
  const loadedRef = useRef(false);
  const inflightRef = useRef<Promise<CoachTourState | null> | null>(null);
  const stateRef = useRef<CoachTourState | null>(null);

  const ensureLoaded = useCallback(async () => {
    if (loadedRef.current) {
      return stateRef.current;
    }
    if (inflightRef.current) {
      return inflightRef.current;
    }

    const request = loadToursAction()
      .then((res) => {
        loadedRef.current = true;
        stateRef.current = res;
        setState(res);
        setLoaded(true);
        return res;
      })
      .catch(() => null)
      .finally(() => {
        inflightRef.current = null;
      });

    inflightRef.current = request;
    return request;
  }, []);

  const markCompleted = useCallback((tour: "workspace" | "builder") => {
    setState((prev) => {
      if (!prev) return prev;
      const next: CoachTourState =
        tour === "workspace"
          ? { ...prev, coachOnboardingCompleted: true }
          : { ...prev, workoutBuilderOnboardingCompleted: true };
      stateRef.current = next;
      return next;
    });
  }, []);

  return (
    <CoachTourContext.Provider
      value={{ loaded, state, ensureLoaded, markCompleted }}
    >
      {children}
    </CoachTourContext.Provider>
  );
}

export function useCoachTourContext() {
  return useContext(CoachTourContext);
}
