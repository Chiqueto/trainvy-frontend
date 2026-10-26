import { describe, expect, it } from "vitest";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  getExerciseDepth,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";

describe("exercise 3D scope", () => {
  it("only enables canonical supported variants", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000101")).toBe(
      "bench-press",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000102")).toBe(
      "bench-press",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000105")).toBe(
      "squat",
    );
    for (const id of [
      null,
      undefined,
      "custom-supino",
      "00000000-0000-4000-8000-000000000103",
      "00000000-0000-4000-8000-000000000106",
    ]) {
      expect(getExerciseAnimation(id)).toBeNull();
    }
  });
});

describe.each(["squat", "bench-press"] as const)(
  "%s kinematics",
  (exercise) => {
    it("keeps limb lengths, feet planted and hands on the bar throughout a repetition", () => {
      const start = getExercisePose(exercise, 0);
      for (let step = 0; step <= 100; step++) {
        const pose = getExercisePose(exercise, step / 100);
        for (let i = 0; i < pose.limbs.length; i++) {
          const limb = pose.limbs[i];
          expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
          expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
          expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(
            ARM_LENGTH,
            5,
          );
          expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
            FOREARM_LENGTH,
            5,
          );
          expect(limb.ankle.distanceTo(start.limbs[i].ankle)).toBe(0);
          expect(limb.grip.y).toBe(pose.bar.y);
          expect(limb.grip.z).toBe(pose.bar.z);
        }
      }
    });
  },
);

describe("rep timing", () => {
  it("holds briefly at lockout and the bottom, with a smooth slower descent", () => {
    expect(getExerciseDepth(0)).toBe(0);
    expect(getExerciseDepth(0.02)).toBe(0);
    expect(getExerciseDepth(0.48)).toBe(1);
    expect(getExerciseDepth(0.51)).toBe(1);
    expect(getExerciseDepth(0.99)).toBeGreaterThan(0);
    expect(getExerciseDepth(1)).toBe(0);

    const descent = Array.from({ length: 20 }, (_, i) =>
      getExerciseDepth(0.04 + (i / 19) * 0.44),
    );
    const ascent = Array.from({ length: 20 }, (_, i) =>
      getExerciseDepth(0.54 + (i / 19) * 0.46),
    );
    expect(
      descent.every((depth, i) => i === 0 || depth >= descent[i - 1]),
    ).toBe(true);
    expect(ascent.every((depth, i) => i === 0 || depth <= ascent[i - 1])).toBe(
      true,
    );
  });
});
