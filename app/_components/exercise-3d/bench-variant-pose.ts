import { MathUtils, Vector3 } from "three";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  getExercisePose,
  solveJoint,
} from "./kinematics";
import { getPowerGripRotation } from "./power-grip";
import type { BenchVariant } from "./upper-exercise-types";

const shaft = new Vector3(1, 0, 0);
const palmOffset = new Vector3(0, 0.004, 0.012);

export const SMITH_PRESS_RAIL_Z = { incline: 0.14, decline: 0.08 };

export function getBenchVariantPose(exercise: BenchVariant, depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const triceps = exercise === "skull-crusher";
  const incline = exercise === "incline-smith-press";
  const dumbbells = exercise === "decline-dumbbell-press";
  const base = getExercisePose(
    triceps
      ? "bench-press"
      : incline
        ? "incline-bench-press"
        : "decline-bench-press",
    0,
  );

  const limbs = base.limbs.map((limb) => {
    const { side, shoulder } = limb;
    if (triceps) {
      const humerus = MathUtils.degToRad(12);
      const flexion = MathUtils.degToRad(MathUtils.lerp(8, 91, p));
      const direction = humerus + flexion;
      const elbow = shoulder
        .clone()
        .addScaledVector(
          new Vector3(0, Math.cos(humerus), -Math.sin(humerus)),
          ARM_LENGTH,
        );
      const forearm = new Vector3(0, Math.cos(direction), -Math.sin(direction));
      const wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
      const handRotation = getPowerGripRotation(forearm, shaft, -1);
      const grip = wrist
        .clone()
        .add(palmOffset.clone().applyQuaternion(handRotation));
      return { ...limb, elbow, wrist, grip, handRotation };
    }

    const grip = dumbbells
      ? new Vector3(
          side * MathUtils.lerp(0.245, 0.425, p),
          MathUtils.lerp(0.91, 0.59, p),
          MathUtils.lerp(-0.06, 0.075, p),
        )
      : new Vector3(
          side * (incline ? 0.39 : 0.41),
          incline
            ? MathUtils.lerp(1.28, 0.895, p)
            : MathUtils.lerp(0.86, 0.59, p),
          incline ? SMITH_PRESS_RAIL_Z.incline : SMITH_PRESS_RAIL_Z.decline,
        );
    // Bend outward and toward the feet while the wrists stay on their loads.
    const pole = new Vector3(side * 0.68, -0.8, incline ? 0.18 : 0.3);
    let wrist = grip.clone().addScaledVector(palmOffset, -1);
    let elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
    let handRotation = getPowerGripRotation(
      wrist.clone().sub(elbow),
      shaft,
      -1,
    );
    // The center of the grasp is offset from the wrist joint by the hand rig.
    for (let iteration = 0; iteration < 12; iteration++) {
      wrist = grip
        .clone()
        .sub(palmOffset.clone().applyQuaternion(handRotation));
      elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
      handRotation = getPowerGripRotation(wrist.clone().sub(elbow), shaft, -1);
    }
    return { ...limb, elbow, wrist, grip, handRotation };
  });

  return {
    ...base,
    limbs,
    bar: limbs[0].grip.clone().lerp(limbs[1].grip, 0.5),
  };
}
