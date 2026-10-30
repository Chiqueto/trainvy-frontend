import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const HIP_ABDUCTION_HIP_HEIGHT = 0.68;
export const HIP_ABDUCTION_MIN_ANGLE = MathUtils.degToRad(5);
export const HIP_ABDUCTION_MAX_ANGLE = MathUtils.degToRad(35);
export const HIP_ABDUCTION_PAD = { x: 0.115, y: 0.68, z: 0.34, width: 0.08 };

/** Seated abduction in hip flexion, fixed pelvis, 90-degree knees and moving footrests. */
export function getHipAbductionPose(depth: number) {
  const angle = MathUtils.lerp(
    HIP_ABDUCTION_MAX_ANGLE,
    HIP_ABDUCTION_MIN_ANGLE,
    MathUtils.clamp(depth, 0, 1),
  );
  const origin = v(0, HIP_ABDUCTION_HIP_HEIGHT + 0.28, -0.08);
  const tilt = new Quaternion();
  const limbs = [-1, 1].map((side) => {
    const hip = v(side * 0.14, HIP_ABDUCTION_HIP_HEIGHT, 0);
    const rotation = new Quaternion().setFromAxisAngle(
      v(0, 1, 0),
      side * angle,
    );
    const knee = v(0, 0, 0.44).applyQuaternion(rotation).add(hip);
    const ankle = knee.clone().add(v(0, -0.42, 0));
    const shoulder = v(side * 0.215, 0.224, 0.132).add(origin);
    const grip = v(side * 0.34, 0.69, 0.08);
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
      footRotation: rotation,
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation: new Quaternion(),
    };
  });
  return { origin, tilt, bar: v(0, 0, 0), limbs };
}

export function getHipAbductionLeverAngle(
  limb: ReturnType<typeof getHipAbductionPose>["limbs"][number],
) {
  return Math.atan2(limb.knee.x - limb.hip.x, limb.knee.z - limb.hip.z);
}

export function getHipAbductionPadCenter(
  limb: ReturnType<typeof getHipAbductionPose>["limbs"][number],
) {
  return v(limb.side * HIP_ABDUCTION_PAD.x, 0, HIP_ABDUCTION_PAD.z)
    .applyAxisAngle(v(0, 1, 0), getHipAbductionLeverAngle(limb))
    .add(limb.hip);
}
