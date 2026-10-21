"use client";

import { useCallback, useEffect, useState } from "react";

import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import type { MuscleGroup } from "@/app/_lib/muscle-labels";

import {
  addExerciseToLocalCache,
  filterExercisesInstant,
  getStoredExercises,
  subscribeToExerciseCatalog,
  syncExerciseCatalog,
  updateExerciseInLocalCache,
} from "../exercise-catalog-cache";

interface UseExerciseCatalogOptions {
  autoSync?: boolean;
}

export function useExerciseCatalog(options?: UseExerciseCatalogOptions) {
  const autoSync = options?.autoSync ?? true;

  // Inicializa o estado sincronicamente com o que já estiver em localStorage/memória (0 ms delay)
  const [exercises, setExercises] = useState<ListExercises200Item[]>(() => {
    return getStoredExercises().exercises;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  // Escuta atualizações atômicas do catálogo
  useEffect(() => {
    const unsubscribe = subscribeToExerciseCatalog((updated) => {
      setExercises(updated);
    });
    return unsubscribe;
  }, []);

  // Sincronização em segundo plano (SWR)
  const refresh = useCallback(async (force = false) => {
    setIsSyncing(true);
    try {
      const res = await syncExerciseCatalog({ force });
      setExercises(res.exercises);
      if (res.updated) {
        setHasNewUpdate(true);
      }
      return res.exercises;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (autoSync) {
      refresh();
    }
  }, [autoSync, refresh]);

  // Busca instantânea em memória (0 ms)
  const search = useCallback(
    (query: string, muscleFilter?: MuscleGroup | "") => {
      return filterExercisesInstant(exercises, query, muscleFilter);
    },
    [exercises],
  );

  return {
    exercises,
    search,
    isSyncing,
    hasNewUpdate,
    dismissUpdateNotice: () => setHasNewUpdate(false),
    refresh,
    addCustomExercise: addExerciseToLocalCache,
    updateExerciseInCache: updateExerciseInLocalCache,
  };
}
