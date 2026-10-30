import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const LEG_EXTENSION_HIP = v(0, 0.68, 0);
export const LEG_EXTENSION_KNEE = v(0, 0.68, 0.44);
export const LEG_EXTENSION_ROLLER_RADIUS = 0.065;

/** Sagittal hinge; pelvis, thighs and handle contacts remain fixed. */
export function getLegExtensionPose(depth: number) {
  const flexion = MathUtils.degToRad(
    MathUtils.lerp(10, 90, MathUtils.clamp(depth, 0, 1)),
  );
  const tilt = new Quaternion();
  const origin = LEG_EXTENSION_HIP.clone().sub(v(0, -0.28, 0.08));
  const limbs = [-1, 1].map((side) => {
    const hip = LEG_EXTENSION_HIP.clone().setX(side * 0.14);
    const knee = LEG_EXTENSION_KNEE.clone().setX(side * 0.14);
    const ankle = knee
      .clone()
      .add(v(0, -0.42 * Math.sin(flexion), 0.42 * Math.cos(flexion)));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(1, 0, 0),
      flexion - Math.PI / 2,
    );
    const shoulder = v(side * 0.215, 0.224, 0.132).add(origin);
    const grip = v(side * 0.34, 0.69, 0.08);
    const handRotation = new Quaternion();
    const wrist = grip.clone().sub(v(0, 0.004, 0.012));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.1, -0.5),
    );
    return {
      side,
      hip,
      knee,
      ankle,
      footRotation,
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation,
    };
  });
  return { origin, tilt, bar: v(0, 0, 0), limbs };
}

/** Contact on the distal anterior shin, rather than on the ankle joint. */
export function getLegExtensionRoller(
  pose: ReturnType<typeof getLegExtensionPose>,
) {
  const { knee, ankle } = pose.limbs[0];
  const shin = ankle.clone().sub(knee).normalize();
  const anterior = v(0, shin.z, -shin.y);
  return knee
    .clone()
    .addScaledVector(shin, 0.34)
    .addScaledVector(anterior, LEG_EXTENSION_ROLLER_RADIUS + 0.035)
    .setX(0);
}

export function getLegExtensionLeverAngle(
  pose: ReturnType<typeof getLegExtensionPose>,
) {
  const roller = getLegExtensionRoller(pose);
  // A positive rotation about X moves local +Z toward negative world Y.
  return -Math.atan2(
    roller.y - LEG_EXTENSION_KNEE.y,
    roller.z - LEG_EXTENSION_KNEE.z,
  );
}
