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
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000103")).toBe(
      "incline-dumbbell-press",
    );
    expect(getExerciseAnimation("6ef90b25-cd99-4860-8933-ae29e4d1f3d8")).toBe(
      "flat-dumbbell-press",
    );
    for (const id of [
      null,
      undefined,
      "custom-supino",
      "00000000-0000-4000-8000-000000000104",
      "00000000-0000-4000-8000-000000000106",
    ]) {
      expect(getExerciseAnimation(id)).toBeNull();
    }
  });
});

describe("incline dumbbell press", () => {
  it("does not enable barbell, Smith, or unsupported variants", () => {
    for (const name of [
      "Supino Inclinado",
      "Supino Inclinado com Barra",
      "Supino Inclinado no Smith",
      "Supino Declinado com Halteres",
    ])
      expect(getExerciseAnimation(undefined, name)).toBeNull();
    expect(
      getExerciseAnimation(undefined, "Supino Inclinado com Halteres"),
    ).toBe("incline-dumbbell-press");
  });
  it("keeps the incline, supports and anatomical lengths while the dumbbells converge without colliding", () => {
    const initial = getExercisePose("incline-dumbbell-press", 0);
    const bottom = getExercisePose("incline-dumbbell-press", 1);
    for (let step = 0; step <= 200; step++) {
      const pose = getExercisePose("incline-dumbbell-press", step / 200);
      expect(pose.tilt.angleTo(initial.tilt)).toBeLessThan(0.000001);
      expect(pose.origin.distanceTo(initial.origin)).toBe(0);
      expect(pose.limbs[0].grip.distanceTo(pose.limbs[1].grip)).toBeGreaterThan(
        0.3,
      );
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[i].shoulder)).toBe(0);
        expect(limb.grip.y).toBeGreaterThan(limb.elbow.y);
      }
    }
    expect(initial.limbs[0].grip.y).toBeGreaterThan(bottom.limbs[0].grip.y);
    expect(initial.limbs[1].grip.x).toBeLessThan(bottom.limbs[1].grip.x);
    expect(
      initial.tilt.angleTo(getExercisePose("bench-press", 0).tilt),
    ).toBeCloseTo(Math.PI / 6, 6);
  });
});

describe("flat dumbbell press", () => {
  it("enables canonical id and normalized names", () => {
    expect(getExerciseAnimation("6ef90b25-cd99-4860-8933-ae29e4d1f3d8")).toBe(
      "flat-dumbbell-press",
    );
    expect(
      getExerciseAnimation(undefined, "Supino Reto com Halteres"),
    ).toBe("flat-dumbbell-press");
    expect(
      getExerciseAnimation(undefined, "supino com halteres"),
    ).toBe("flat-dumbbell-press");
    expect(
      getExerciseAnimation(undefined, "supino com halter"),
    ).toBe("flat-dumbbell-press");
  });
  it("keeps flat bench orientation, converging dumbbell path, and preserved bone lengths", () => {
    const initial = getExercisePose("flat-dumbbell-press", 0);
    const bottom = getExercisePose("flat-dumbbell-press", 1);
    for (let step = 0; step <= 200; step++) {
      const pose = getExercisePose("flat-dumbbell-press", step / 200);
      expect(pose.tilt.angleTo(initial.tilt)).toBeLessThan(0.000001);
      expect(pose.origin.distanceTo(initial.origin)).toBe(0);
      expect(pose.limbs[0].grip.distanceTo(pose.limbs[1].grip)).toBeGreaterThan(
        0.28,
      );
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[i].shoulder)).toBe(0);
        expect(limb.grip.y).toBeGreaterThan(limb.elbow.y);
      }
    }
    // Dumbbells are higher at lockout (initial) than bottom
    expect(initial.limbs[0].grip.y).toBeGreaterThan(bottom.limbs[0].grip.y);
    // Dumbbells are closer together at lockout (converging) than at bottom (stretched)
    expect(
      initial.limbs[0].grip.distanceTo(initial.limbs[1].grip),
    ).toBeLessThan(bottom.limbs[0].grip.distanceTo(bottom.limbs[1].grip));
    // Flat bench angle is parallel to barbell bench press
    expect(
      initial.tilt.angleTo(getExercisePose("bench-press", 0).tilt),
    ).toBeCloseTo(0, 6);
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
