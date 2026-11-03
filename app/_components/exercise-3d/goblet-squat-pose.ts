import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Front-loaded goblet squat: upright torso (~75° to horizontal), dumbbell cupped at upper chest, knees tracking toes. */
export function getGobletSquatPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const hipCenter = v(
    0,
    0.895 - 0.38 * p,
    -0.03 - 0.20 * p,
  );
  // Upright torso: anterior load counterbalances the hips, keeping trunk inclination modest (~15° at bottom)
  const tiltAngle = MathUtils.degToRad(3 + 12 * p);
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), tiltAngle);

  const hipLocal = v(0, -0.28, 0.08);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(hipLocal)
      .applyQuaternion(tilt)
      .add(hipCenter);

  // Center of the dumbbell resting vertically in front of upper chest
  const gobletCenter = body(v(0, 0.06, 0.34));

  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    // Stable stance with flat soles planted on the floor, identical to free squat
    const ankle = v(side * 0.20, 0.05, 0.04);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.14, 0.15, 1));
    const footRotation = new Quaternion();

    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    // Hands cupped under the top bell of the dumbbell, right against the sides of the handle
    const wrist = body(v(side * 0.09, 0.06, 0.34));
    // Elbows tucked down and slightly forward
    const elbowPole = v(side * 0.25, -0.9, 0.25).applyQuaternion(tilt).normalize();
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      elbowPole,
    );

    // Natural hand bind pose without artificial twist
    const handRotation = new Quaternion();

    const grip = wrist
      .clone()
      .add(v(0, 0.004, 0.012).applyQuaternion(handRotation));

    return {
      side,
      hip,
      knee,
      ankle,
      footRotation,
      shoulder,
      elbow,
      wrist,
      handRotation,
      grip,
    };
  });

  return {
    bar: gobletCenter,
    limbs,
    origin: body(v(0, 0, 0)),
    tilt,
  };
}
