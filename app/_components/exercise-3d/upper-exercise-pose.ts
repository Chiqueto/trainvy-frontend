import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getPowerGripRotation } from "./power-grip";
import { getScapularMotion } from "./scapular-motion";
import { isBenchVariant, type UpperExercise } from "./upper-exercise-types";
import { getBenchVariantPose } from "./bench-variant-pose";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const palmOffset = v(0, 0.004, 0.012);
export const PREACHER_CURL_ANGLE = MathUtils.degToRad(42);
export const PREACHER_CURL_HIP_HEIGHT = 0.56;

export const isShoulderPress = (key: UpperExercise) =>
  key === "military-press" || key === "dumbbell-shoulder-press";

/** p=0 is the lifted endpoint; p=1 is lowered. No knee drive or lumbar swing.
 * All dimensions/angles describe this avatar, not universal prescription.
 */
export function getUpperExercisePose(exercise: UpperExercise, depth: number) {
  if (isBenchVariant(exercise)) return getBenchVariantPose(exercise, depth);

  const p = MathUtils.clamp(depth, 0, 1),
    lifted = 1 - p;
  const preacher = exercise === "preacher-curl";
  const seated = exercise === "dumbbell-shoulder-press",
    press = isShoulderPress(exercise);
  const hipCenter = v(
      0,
      preacher ? PREACHER_CURL_HIP_HEIGHT : seated ? 0.53 : 0.9,
      0,
    ),
    origin = hipCenter.clone().sub(v(0, -0.28, 0.08)),
    tilt = new Quaternion();
  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14),
      ankle = v(
        side * (preacher ? 0.25 : 0.18),
        0.05,
        preacher ? 0.47 : seated ? 0.49 : 0.08,
      );
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
      // The strict barbell press leaves the shoulders vertically. The head
      // clears its path; only above the forehead does the bar settle over the feet.
      const z = seated
        ? MathUtils.lerp(0.07, 0.16, p)
        : MathUtils.lerp(0.18, 0.065, MathUtils.smoothstep(lifted, 0.5, 0.95));
      const overheadShoulder = getScapularMotion(exercise, 0, side)
        .point(v(side * 0.215, 0.224, 0.132))
        .add(origin);
      const fullReach = ARM_LENGTH + FOREARM_LENGTH - 0.006;
      const topY =
        overheadShoulder.y +
        Math.sqrt(
          fullReach ** 2 -
            (side * (seated ? 0.24 : 0.3) - overheadShoulder.x) ** 2 -
            ((seated ? 0.08 : 0.065) - overheadShoulder.z) ** 2,
        );
      grip = v(
        side * halfWidth,
        MathUtils.lerp(topY, origin.y + (seated ? 0.25 : 0.26), p),
        z,
      );
      wrist = grip.clone();
      handRotation = new Quaternion();
      shaft = v(1, 0, 0);
      elbow = shoulder.clone();
      const solvePressElbow = (target: Vector3) =>
        solveJoint(
          shoulder,
          target,
          ARM_LENGTH,
          FOREARM_LENGTH,
          seated
            ? v(side * 0.5, -1, -0.18)
            : // Anterior elbow hinge: axis × -X gives a bend perpendicular to
              // the reach, with no lateral component or outward swivel. It
              // points down near the rack and forward as the arm rises.
              v(0, shoulder.z - target.z, target.y - shoulder.y),
        );
      for (let i = 0; i < 16; i++) {
        elbow = solvePressElbow(wrist);
        handRotation = getPowerGripRotation(
          wrist.clone().sub(elbow),
          shaft,
          -1,
        );
        wrist = grip
          .clone()
          .sub(palmOffset.clone().applyQuaternion(handRotation));
      }
      elbow = solvePressElbow(wrist);
    } else if (exercise === "rope-pushdown") {
      const upperLean = MathUtils.degToRad(5);
      const angle = upperLean + MathUtils.degToRad(MathUtils.lerp(6, 91, p));
      elbow = shoulder
        .clone()
        .add(
          v(
            side * 0.035,
            -Math.sqrt(
              ARM_LENGTH ** 2 -
                0.035 ** 2 -
                (ARM_LENGTH * Math.sin(upperLean)) ** 2,
            ),
            ARM_LENGTH * Math.sin(upperLean),
          ),
        );
      const forearm = v(
        side * MathUtils.lerp(0.2, -0.12, p),
        -Math.cos(angle),
        Math.sin(angle),
      ).normalize();
      wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
      // The rope bends just outside the closed hand. Keep the grasp neutral
      // and the wrist aligned even when the two tails spread at the bottom.
      handRotation = getPowerGripRotation(
        forearm,
        v(0, Math.sin(angle), Math.cos(angle)),
        side,
      );
      grip = wrist
        .clone()
        .add(palmOffset.clone().applyQuaternion(handRotation));
    } else if (exercise === "straight-bar-pushdown") {
      // Fixed pronated grip and a fixed humerus. Only the elbows drive the bar.
      const upper = MathUtils.degToRad(6);
      const flexion = MathUtils.degToRad(MathUtils.lerp(7, 93, p));
      elbow = shoulder.clone().add(v(0, -Math.cos(upper), Math.sin(upper)).multiplyScalar(ARM_LENGTH));
      const angle = upper + flexion;
      const forearm = v(0, -Math.cos(angle), Math.sin(angle));
      wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
      handRotation = getPowerGripRotation(forearm, v(1, 0, 0), -1);
      grip = wrist.clone().add(palmOffset.clone().applyQuaternion(handRotation));
    } else if (preacher) {
      const upper = PREACHER_CURL_ANGLE;
      const fore = upper + MathUtils.degToRad(MathUtils.lerp(12, 112, lifted));
      elbow = shoulder
        .clone()
        .add(v(0, -ARM_LENGTH * Math.cos(upper), ARM_LENGTH * Math.sin(upper)));
      const forearm = v(0, -Math.cos(fore), Math.sin(fore));
      wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
      handRotation = getPowerGripRotation(forearm, v(1, 0, 0), 1);
      grip = wrist
        .clone()
        .add(palmOffset.clone().applyQuaternion(handRotation));
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
        const plane = MathUtils.degToRad(25),
          radial = v(side * Math.cos(plane), 0, Math.sin(plane));
        elbow = shoulder
          .clone()
          .addScaledVector(radial, ARM_LENGTH * Math.sin(angle))
          .add(v(0, -ARM_LENGTH * Math.cos(angle), 0));
        const upper = elbow.clone().sub(shoulder).normalize();
        // Match the user's overhead reference: the slight elbow bend is forward
        // across the horizontal plane, not a downward bend below the upper arm.
        const forward = v(0, 0, 1).addScaledVector(upper, -upper.z).normalize();
        const bend = MathUtils.degToRad(15);
        const fore = upper
          .clone()
          .multiplyScalar(Math.cos(bend))
          .addScaledVector(forward, Math.sin(bend));
        wrist = elbow.clone().addScaledVector(fore, FOREARM_LENGTH);
        // A free dumbbell follows the forearm without forcing wrist deviation.
        shaft = v(-Math.sin(plane), 0, side * Math.cos(plane));
        shaft.addScaledVector(fore, -shaft.dot(fore)).normalize();
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
