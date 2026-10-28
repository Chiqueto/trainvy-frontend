import { describe, expect, it } from "vitest";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";

describe("flat dumbbell fly trajectory", () => {
  it("keeps segment lengths, elbow flexion and supports stable throughout the arc", () => {
    const top = getExercisePose("flat-dumbbell-fly", 0);
    const bottom = getExercisePose("flat-dumbbell-fly", 1);
    expect(Math.abs(bottom.limbs[0].wrist.x)).toBeGreaterThan(
      Math.abs(top.limbs[0].wrist.x),
    );
    expect(bottom.limbs[0].wrist.y).toBeLessThan(top.limbs[0].wrist.y);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("flat-dumbbell-fly", i / 100);
      pose.limbs.forEach((limb, side) => {
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 6);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          6,
        );
        expect(limb.ankle.distanceTo(top.limbs[side].ankle)).toBeLessThan(1e-8);
        const upper = limb.elbow.clone().sub(limb.shoulder).normalize();
        const forearm = limb.wrist.clone().sub(limb.elbow).normalize();
        expect(upper.angleTo(forearm)).toBeCloseTo(Math.PI / 9, 6);
      });
    }
  });
});
