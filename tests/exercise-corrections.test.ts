// @vitest-environment node
import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import { ARM_LENGTH, FOREARM_LENGTH, getExercisePose } from "../app/_components/exercise-3d/kinematics";

describe("reported exercise regressions", () => {
  it("keeps the seated press against its backrest with hands ahead of shoulders", () => {
    const start = getExercisePose("machine-chest-press", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("machine-chest-press", i / 100);
      expect(pose.origin.distanceTo(start.origin)).toBe(0);
      for (const [index, limb] of pose.limbs.entries()) {
        expect(limb.hip.z).toBeCloseTo(0.04);
        expect(limb.shoulder.z).toBeLessThan(0.1);
        expect(limb.wrist.z).toBeGreaterThan(limb.shoulder.z + 0.1);
        expect(limb.elbow.y).toBeLessThan(limb.shoulder.y);
        expect(limb.ankle.distanceTo(start.limbs[index].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 6);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(FOREARM_LENGTH, 6);
      }
    }
  });
  it("turns fly palms upward at the bottom and inward at the top with handles aligned", () => {
    for (const depth of [0, 0.5, 1]) {
      for (const limb of getExercisePose("flat-dumbbell-fly", depth).limbs) {
        const palm = new Vector3(0, 0, 1).applyQuaternion(limb.handRotation);
        const handle = new Vector3(1, 0, 0).applyQuaternion(limb.handRotation);
        const forearm = limb.wrist.clone().sub(limb.elbow).normalize();
        expect(Math.abs(palm.dot(forearm))).toBeLessThan(1e-8);
        expect(Math.abs(handle.dot(forearm))).toBeLessThan(1e-8);
        if (depth === 1) expect(palm.y).toBeGreaterThan(0.8);
        if (depth === 0) expect(-limb.side * palm.x).toBeGreaterThan(0.95);
      }
    }
  });
  it("distinguishes hand-grip machine fly from forearm-pad Peck Deck", () => {
    expect(getExerciseAnimation(undefined, "Crucifixo na Máquina")).toBe("machine-fly");
    expect(getExerciseAnimation(undefined, "Peck Deck")).toBe("pec-deck");
    for (const depth of [0, 0.5, 1]) {
      const fly = getExercisePose("machine-fly", depth);
      const deck = getExercisePose("pec-deck", depth);
      for (const [i, limb] of fly.limbs.entries()) {
        const upper = limb.elbow.clone().sub(limb.shoulder);
        const forearm = limb.wrist.clone().sub(limb.elbow);
        expect(upper.angleTo(forearm)).toBeLessThan(0.36);
        expect(upper.length()).toBeCloseTo(ARM_LENGTH, 6);
        expect(forearm.length()).toBeCloseTo(FOREARM_LENGTH, 6);
        expect(limb.wrist.y).toBeLessThan(deck.limbs[i].wrist.y - 0.2);
      }
    }
  });

  it("keeps a small downward elbow bend through the machine fly without moving the supports", () => {
    const initial = getExercisePose("machine-fly", 0);
    for (let step = 0; step <= 100; step++) {
      const pose = getExercisePose("machine-fly", step / 100);
      for (const [index, limb] of pose.limbs.entries()) {
        const drop = limb.shoulder.y - limb.elbow.y;
        expect(drop).toBeGreaterThan(0.04);
        expect(drop).toBeLessThan(0.06);
        expect(limb.wrist.y).toBeGreaterThan(limb.elbow.y + 0.04);
        const upper = limb.elbow.clone().sub(limb.shoulder);
        const forearm = limb.wrist.clone().sub(limb.elbow);
        expect(upper.angleTo(forearm)).toBeCloseTo(Math.PI / 9, 6);
        expect(upper.length()).toBeCloseTo(ARM_LENGTH, 6);
        expect(forearm.length()).toBeCloseTo(FOREARM_LENGTH, 6);
        expect(limb.ankle.distanceTo(initial.limbs[index].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[index].shoulder)).toBe(0);
        const palm = new Vector3(0, 0, 1).applyQuaternion(limb.handRotation);
        expect(Math.abs(palm.y)).toBeLessThan(0.03);
      }
    }
  });
});
