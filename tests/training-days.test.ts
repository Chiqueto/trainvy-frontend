// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  trainingDaysOnly,
  trainingOnlyImportDraft,
} from "../app/_lib/training-days";
describe("sequential training days", () => {
  it("reindexes imported source quotes without changing the original preview or token", () => {
    const draft = {
      previewToken: "signed",
      workoutDays: [
        { name: "Descanso", isRest: true },
        { name: "Treino", isRest: false },
      ],
      provenance: [
        { path: "workoutDays.0.name", quote: "Descanso" },
        { path: "workoutDays.1.exercises.0.name", quote: "Remada" },
        { path: "name", quote: "Plano" },
      ],
    };
    const normalized = trainingOnlyImportDraft(
      draft as Parameters<typeof trainingOnlyImportDraft>[0],
    );
    expect(normalized.workoutDays).toEqual([{ name: "Treino", isRest: false }]);
    expect(normalized.provenance).toEqual([
      { path: "workoutDays.0.exercises.0.name", quote: "Remada" },
      { path: "name", quote: "Plano" },
    ]);
    expect(normalized.previewToken).toBe("signed");
    expect(draft.workoutDays).toHaveLength(2);
    expect(draft.provenance[1].path).toBe("workoutDays.1.exercises.0.name");
  });
  it("keeps training order, identities and prescriptions while filtering legacy rest slots", () => {
    const first = {
        id: "a",
        isRest: false,
        exercises: [{ id: "ex", restTimeInSeconds: 90 }],
      },
      last = { id: "b", isRestDay: false };
    const original = [
      first,
      { id: "off", isRest: true },
      { id: "old-off", isRestDay: true },
      last,
    ];
    const filtered = trainingDaysOnly(original);
    expect(filtered).toEqual([first, last]);
    expect(filtered[0]).toBe(first);
    expect(original).toHaveLength(4);
    expect(first.exercises[0].restTimeInSeconds).toBe(90);
  });
});
