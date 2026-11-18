import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getPowerGripRotation } from "./power-grip";
import { getScapularMotion } from "./scapular-motion";
import type { UpperExercise } from "./upper-exercise-types";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const palmOffset = v(0, 0.004, 0.012);
export const isShoulderPress = (key: UpperExercise) =>
  key === "military-press" || key === "dumbbell-shoulder-press";

/** p=0 is the lifted endpoint; p=1 is lowered. No knee drive or lumbar swing.
 * All dimensions/angles describe this avatar, not universal prescription.
 */
export function getUpperExercisePose(exercise: UpperExercise, depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    lifted = 1 - p;
  const seated = exercise === "dumbbell-shoulder-press",
    press = isShoulderPress(exercise);
  const hipCenter = v(0, seated ? 0.53 : 0.9, 0),
    origin = hipCenter.clone().sub(v(0, -0.28, 0.08)),
    tilt = new Quaternion();
  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14),
      ankle = v(side * 0.18, 0.05, seated ? 0.49 : 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    const shoulder = getScapularMotion(exercise, p, side)
      .point(v(side * 0.215, 0.224, 0.132))
      .add(origin);
    let elbow: Vector3,
      wrist: Vector3,
      grip: Vector3,
      shaft: Vector3,
      handRotation: Quaternion;
    if (press) {
      const halfWidth = seated ? MathUtils.lerp(0.24, 0.42, p) : 0.3;
      // A smooth, almost vertical press ends over the head. Cervical retraction
      // clears the face instead of making the bar loop around a stationary head.
      const z = seated
        ? MathUtils.lerp(0.07, 0.16, p)
        : MathUtils.lerp(0.055, 0.205, p);
      const overheadShoulder = getScapularMotion(exercise, 0, side)
        .point(v(side * 0.215, 0.224, 0.132))
        .add(origin);
      const fullReach = ARM_LENGTH + FOREARM_LENGTH - 0.006;
      const topY =
        overheadShoulder.y +
        Math.sqrt(
          fullReach ** 2 -
            (side * (seated ? 0.24 : 0.3) - overheadShoulder.x) ** 2 -
            ((seated ? 0.08 : 0.055) - overheadShoulder.z) ** 2,
        );
      grip = v(
        side * halfWidth,
        MathUtils.lerp(topY, origin.y + (seated ? 0.25 : 0.23), p),
        z,
      );
      wrist = grip.clone();
      handRotation = new Quaternion();
      shaft = v(1, 0, 0);
      elbow = shoulder.clone();
      for (let i = 0; i < 16; i++) {
        elbow = solveJoint(
          shoulder,
          wrist,
          ARM_LENGTH,
          FOREARM_LENGTH,
          v(side * 0.5, -1, -0.18),
        );
        handRotation = getPowerGripRotation(
          wrist.clone().sub(elbow),
          shaft,
          -1,
        );
        wrist = grip
          .clone()
          .sub(palmOffset.clone().applyQuaternion(handRotation));
      }
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side * 0.5, -1, -0.18),
      );
    } else {
      const lateral = exercise === "lateral-raise",
        angle = MathUtils.degToRad(
          lateral
            ? MathUtils.lerp(10, 85, lifted)
            : MathUtils.lerp(12, 125, lifted) +
                MathUtils.radToDeg(
                  Math.atan2(
                    0.055,
                    Math.sqrt(ARM_LENGTH ** 2 - 0.025 ** 2 - 0.055 ** 2),
                  ),
                ),
        );
      if (lateral) {
        // Modest forward plane, neutral humerus: no internally rotated "pouring" gesture.
        const plane = MathUtils.degToRad(20),
          radial = v(side * Math.cos(plane), 0, Math.sin(plane));
        elbow = shoulder
          .clone()
          .addScaledVector(radial, ARM_LENGTH * Math.sin(angle))
          .add(v(0, -ARM_LENGTH * Math.cos(angle), 0));
        wrist = elbow
          .clone()
          .addScaledVector(radial, FOREARM_LENGTH * Math.sin(angle - 0.35))
          .add(v(0, -FOREARM_LENGTH * Math.cos(angle - 0.35), 0));
        shaft = v(-Math.sin(plane), 0, side * Math.cos(plane));
      } else {
        // Upper arm fixed beside ribs; elbow flexion drives the load, not shoulder swing.
        elbow = shoulder
          .clone()
          .add(
            v(
              side * 0.025,
              -Math.sqrt(ARM_LENGTH ** 2 - 0.025 ** 2 - 0.055 ** 2),
              0.055,
            ),
          );
        wrist = elbow
          .clone()
          .add(
            v(
              0,
              -FOREARM_LENGTH * Math.cos(angle),
              FOREARM_LENGTH * Math.sin(angle),
            ),
          );
        shaft =
          exercise === "hammer-curl"
            ? v(0, Math.sin(angle), Math.cos(angle))
            : v(1, 0, 0);
      }
      handRotation = getPowerGripRotation(
        wrist.clone().sub(elbow),
        shaft,
        exercise === "hammer-curl" ? side : 1,
      );
      grip = wrist
        .clone()
        .add(palmOffset.clone().applyQuaternion(handRotation));
    }
    return {
      side,
      hip,
      knee,
      ankle,
      footRotation: new Quaternion(),
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation,
    };
  });
  return {
    origin,
    tilt,
    bar: limbs[0].grip.clone().lerp(limbs[1].grip, 0.5),
    limbs,
  };
}
