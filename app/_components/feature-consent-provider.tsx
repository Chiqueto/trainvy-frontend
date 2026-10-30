"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { authClient } from "@/app/_lib/auth-client";
import { getFeatureTermsAction } from "@/app/_actions/feature-terms";
import type { GetFeatureTerms200 } from "@/app/_lib/api/fetch-generated";

type Feature = GetFeatureTerms200["feature"];

function createTermsCache() {
  const entries = new Map<Feature, Promise<GetFeatureTerms200>>();
  return {
    get(feature: Feature, refresh = false) {
      if (refresh) entries.delete(feature);
      const cached = entries.get(feature);
      if (cached) return cached;
      const request = getFeatureTermsAction(feature).then((result) => {
        if (!result.success) throw new Error(result.error);
        return result.data;
      });
      entries.set(feature, request);
      void request.catch(() => {
        if (entries.get(feature) === request) entries.delete(feature);
      });
      return request;
    },
    update(terms: GetFeatureTerms200) {
      entries.set(terms.feature, Promise.resolve(terms));
    },
    invalidate(feature: Feature) {
      entries.delete(feature);
    },
  };
}

const TermsContext = createContext<ReturnType<typeof createTermsCache> | null>(
  null,
);

export function FeatureConsentProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  // Remount the cache and consumers when logging out or changing sessions.
  const identity = session
    ? `${session.user.id}:${session.session.id}`
    : "anonymous";
  return (
    <SessionTermsProvider key={identity} authenticated={!!session}>
      {children}
    </SessionTermsProvider>
  );
}

function SessionTermsProvider({
  children,
  authenticated,
}: {
  children: ReactNode;
  authenticated: boolean;
}) {
  const cache = useMemo(() => createTermsCache(), []);
  useEffect(() => {
    if (!authenticated) return;
    for (const feature of ["EXERCISE_3D", "AI_WORKOUT"] as const) {
      void cache.get(feature).catch(() => {});
    }
  }, [authenticated, cache]);
  return (
    <TermsContext.Provider value={cache}>{children}</TermsContext.Provider>
  );
}

export function useFeatureTermsCache() {
  const cache = useContext(TermsContext);
  if (!cache) throw new Error("FeatureConsentProvider is required");
  return cache;
}
