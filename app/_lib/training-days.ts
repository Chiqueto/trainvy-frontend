import type { GenerateWorkoutPlanDraftWithAi200 } from "./api/fetch-generated";

/** Legacy rest entries stay in stored history but are not slots in a training rotation. */
export function trainingDaysOnly<
  T extends { isRest?: boolean | null; isRestDay?: boolean | null },
>(days: readonly T[]): T[] {
  return days.filter((day) => !(day.isRestDay ?? day.isRest));
}

/** Keep source quotes attached to the correct fields after dropping imported rest slots. */
export function trainingOnlyImportDraft(
  draft: GenerateWorkoutPlanDraftWithAi200,
): GenerateWorkoutPlanDraftWithAi200 {
  const indices = draft.workoutDays.flatMap((day, index) =>
    day.isRest ? [] : [index],
  );
  return {
    ...draft,
    workoutDays: indices.map((index) => ({
      ...draft.workoutDays[index],
      isRest: false,
    })),
    provenance: draft.provenance.flatMap((entry) => {
      const match = /^workoutDays\.(\d+)(\.|$)/.exec(entry.path);
      if (!match) return [entry];
      const nextIndex = indices.indexOf(Number(match[1]));
      return nextIndex < 0
        ? []
        : [
            {
              ...entry,
              path: entry.path.replace(
                /^workoutDays\.\d+/,
                `workoutDays.${nextIndex}`,
              ),
            },
          ];
    }),
  };
}
