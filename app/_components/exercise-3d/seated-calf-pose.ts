import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { CALF_FOOT_CONTACT } from "./standing-calf-pose";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const SEATED_CALF_PIVOT = v(0, 0.18, 0.6);
export const SEATED_CALF_HIP = v(0, 0.65, 0);

/** Fixed seat and metatarsal support; the thigh follows the ankle through knee IK. */
export function getSeatedCalfPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const footRotation = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(MathUtils.lerp(23, -8, p)),
  );
  const center = SEATED_CALF_PIVOT.clone().sub(
    CALF_FOOT_CONTACT.clone().applyQuaternion(footRotation),
  );
  const origin = SEATED_CALF_HIP.clone().sub(v(0, -0.28, 0.08));
  const limbs = [-1, 1].map((side) => {
    const hip = SEATED_CALF_HIP.clone().setX(side * 0.14);
    const ankle = center.clone().setX(side * 0.14);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    const shoulder = origin.clone().add(v(side * 0.215, 0.224, 0.132));
    const grip = v(side * 0.34, 0.8, 0.22);
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
  return { origin, tilt: new Quaternion(), bar: v(0, 0, 0), limbs };
}

export function getSeatedCalfPad(pose: ReturnType<typeof getSeatedCalfPose>) {
  const { hip, knee } = pose.limbs[0];
  return hip
    .clone()
    .lerp(knee, 0.8)
    .setX(0)
    .add(v(0, 0.095, 0));
}
