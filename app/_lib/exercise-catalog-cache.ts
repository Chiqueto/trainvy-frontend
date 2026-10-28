import type { ListExercises200Item } from "@/app/_lib/api/fetch-generated";
import { anatomySearchTerms } from "./exercise-anatomy";
import {
  getMuscleGroupLabel,
  type MuscleGroup,
} from "@/app/_lib/muscle-labels";
import {
  getExerciseCatalogVersionAction,
  listExercisesAction,
} from "@/app/workout-sessions/[sessionId]/_actions";

const STORAGE_LIST_KEY = "trainvy:exercises:list:v1";
const STORAGE_VERSION_KEY = "trainvy:exercises:version:v1";
const STORAGE_SYNCED_KEY = "trainvy:exercises:synced_at:v1";

export type CachedExercise = ListExercises200Item;

interface MemoryCache {
  exercises: CachedExercise[];
  version: string;
  syncedAt: number;
}

let memoryCache: MemoryCache | null = null;
let syncPromise: Promise<{
  exercises: ListExercises200Item[];
  updated: boolean;
}> | null = null;

type CacheListener = (
  exercises: ListExercises200Item[],
  version: string,
) => void;
const listeners = new Set<CacheListener>();

export function subscribeToExerciseCatalog(
  listener: CacheListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(exercises: ListExercises200Item[], version: string) {
  listeners.forEach((listener) => {
    try {
      listener(exercises, version);
    } catch (err) {
      console.error("[ExerciseCache] Erro ao notificar listener:", err);
    }
  });
}

/**
 * Normaliza termos de busca removendo acentos, diacríticos e espaços extras.
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Lê os exercícios do cache síncrono (memória ou localStorage).
 * Retorna instantaneamente sem bloquear a interface.
 */
export function getStoredExercises(): {
  exercises: ListExercises200Item[];
  version: string | null;
} {
  if (memoryCache && memoryCache.exercises.length > 0) {
    return { exercises: memoryCache.exercises, version: memoryCache.version };
  }

  if (typeof window !== "undefined") {
    try {
      const rawList = window.localStorage.getItem(STORAGE_LIST_KEY);
      const version = window.localStorage.getItem(STORAGE_VERSION_KEY) || "";
      const syncedAtStr =
        window.localStorage.getItem(STORAGE_SYNCED_KEY) || "0";

      if (rawList) {
        const parsed = JSON.parse(rawList) as ListExercises200Item[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = {
            exercises: parsed,
            version,
            syncedAt: Number(syncedAtStr) || Date.now(),
          };
          return { exercises: parsed, version };
        }
      }
    } catch (err) {
      console.warn(
        "[ExerciseCache] Falha ao ler cache local de exercícios:",
        err,
      );
    }
  }

  return { exercises: [], version: null };
}

/**
 * Salva a lista de exercícios na memória e no localStorage.
 */
export function persistExercisesToCache(
  exercises: ListExercises200Item[],
  version: string,
) {
  memoryCache = {
    exercises,
    version,
    syncedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(exercises));
      window.localStorage.setItem(STORAGE_VERSION_KEY, version);
      window.localStorage.setItem(STORAGE_SYNCED_KEY, String(Date.now()));
    } catch (err) {
      console.warn("[ExerciseCache] Falha ao persistir no localStorage:", err);
    }
  }

  notifyListeners(exercises, version);
}

/**
 * Adiciona um exercício recém-criado diretamente ao cache local.
 * Garante que o exercício apareça instantaneamente no modal sem requisição de busca.
 */
export function addExerciseToLocalCache(newExercise: ListExercises200Item) {
  const current = getStoredExercises();
  const nextList = [
    newExercise,
    ...current.exercises.filter((ex) => ex.id !== newExercise.id),
  ];
  const nextVersion = `local-${Date.now()}`;
  persistExercisesToCache(nextList, nextVersion);
}

/**
 * Atualiza um exercício existente no cache local (ex: após editar músculos).
 */
export function updateExerciseInLocalCache(
  updatedExercise: ListExercises200Item,
) {
  const current = getStoredExercises();
  const nextList = current.exercises.map((ex) =>
    ex.id === updatedExercise.id ? updatedExercise : ex,
  );
  const nextVersion = `local-${Date.now()}`;
  persistExercisesToCache(nextList, nextVersion);
}

/**
 * Sincroniza o catálogo de exercícios em segundo plano.
 * Checa primeiro a versão (leve); se for a mesma, reaproveita o cache local sem baixar a lista toda.
 */
export async function syncExerciseCatalog(options?: {
  force?: boolean;
}): Promise<{ exercises: ListExercises200Item[]; updated: boolean }> {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    try {
      const stored = getStoredExercises();

      // Se temos cache local e não é forçado, checa se a versão do backend mudou
      if (!options?.force && stored.exercises.length > 0 && stored.version) {
        const versionRes = await getExerciseCatalogVersionAction();
        if (versionRes.success) {
          const remoteVersion = versionRes.data.version;
          if (remoteVersion === stored.version) {
            // Versão idêntica — o cache local está 100% atualizado!
            return { exercises: stored.exercises, updated: false };
          }
        }
      }

      // Baixa catálogo completo
      const listRes = await listExercisesAction();
      if (!listRes.success) {
        return { exercises: stored.exercises, updated: false };
      }

      // Obtém ou calcula versão
      let version = `v-${Date.now()}`;
      try {
        const versionRes = await getExerciseCatalogVersionAction();
        if (versionRes.success) {
          version = versionRes.data.version;
        }
      } catch {
        // Fallback de versão em caso de erro na rota
      }

      persistExercisesToCache(listRes.data, version);
      return { exercises: listRes.data, updated: true };
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

/**
 * Filtro de exercícios instantâneo em memória (0 ms).
 * Suporta normalização de acentos, busca por nome e busca por grupo muscular.
 */
export function filterExercisesInstant(
  exercises: ListExercises200Item[],
  query: string,
  muscleFilter?: MuscleGroup | "",
): ListExercises200Item[] {
  const normQuery = normalizeSearchTerm(query);

  let filtered = exercises;

  // Filtro explícito de grupo muscular (se selecionado)
  if (muscleFilter) {
    filtered = filtered.filter((ex) =>
      ex.muscles?.some((m) => m.muscleGroup === muscleFilter),
    );
  }

  if (!normQuery) {
    return filtered;
  }

  // Mapeamento semântico rápido para buscar por grupos musculares digitados
  // Ex: "perna" -> QUADRICEPS, HAMSTRINGS, GLUTES, CALVES
  const isPerna = normQuery.includes("perna");
  const isBraco = normQuery.includes("braco");

  return filtered
    .map((exercise) => {
      const normName = normalizeSearchTerm(exercise.name);

      let rank = 999;

      if (normName === normQuery) {
        rank = 0; // Correspondência exata
      } else if (normName.startsWith(normQuery)) {
        rank = 1; // Começa com o termo
      } else if (normName.split(" ").some((w) => w.startsWith(normQuery))) {
        rank = 2; // Palavra interna começa com o termo
      } else if (normName.includes(normQuery)) {
        rank = 3; // Contém o termo
      } else {
        // Checa se o termo digitado bate com algum músculo do exercício
        const matchesMuscle = exercise.muscles?.some((m) => {
          const muscleKeyNorm = normalizeSearchTerm(m.muscleGroup);
          const muscleLabelNorm = normalizeSearchTerm(
            getMuscleGroupLabel(m.muscleGroup),
          );

          if (
            muscleKeyNorm.includes(normQuery) ||
            muscleLabelNorm.includes(normQuery)
          ) {
            return true;
          }

          if (
            isPerna &&
            [
              "QUADRICEPS",
              "HAMSTRINGS",
              "GLUTES",
              "CALVES",
              "ADDUCTORS",
            ].includes(m.muscleGroup)
          ) {
            return true;
          }

          if (
            isBraco &&
            ["BICEPS", "TRICEPS", "FOREARMS"].includes(m.muscleGroup)
          ) {
            return true;
          }

          return false;
        });

        const matchesAnatomy = anatomySearchTerms(exercise.anatomy).some(
          (term) => normalizeSearchTerm(term).includes(normQuery),
        );
        const matchesParent =
          ["peitoral", "peitorais"].includes(normQuery) &&
          exercise.muscles?.some((m) => m.muscleGroup === "CHEST");
        if (matchesMuscle || matchesAnatomy || matchesParent) {
          rank = 4;
        }
      }

      return { exercise, rank, normName };
    })
    .filter((item) => item.rank < 999)
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      // Prioriza exercícios próprios do atleta
      const aIsCustom = a.exercise.ownerUserId !== null ? 0 : 1;
      const bIsCustom = b.exercise.ownerUserId !== null ? 0 : 1;
      if (aIsCustom !== bIsCustom) {
        return aIsCustom - bIsCustom;
      }

      return a.exercise.name.localeCompare(b.exercise.name);
    })
    .map((item) => item.exercise);
}
