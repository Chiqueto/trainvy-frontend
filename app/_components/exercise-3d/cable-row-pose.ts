import { getPowerGripRotation } from "./power-grip";
import { getPullingShoulder } from "./scapular-motion";
import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const CABLE_ROW_HIP = v(0, 0.52, 0);
export const CABLE_ROW_PULLEY = v(0, 0.27, 1.16);
export const CABLE_ROW_FOOT_ROTATION = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  -Math.PI / 4,
);
export const CABLE_ROW_ANKLE = v(0, 0.18, 0.74);
export const CABLE_ROW_GRIP_HALF_WIDTH = 0.09;
// Same atlas abdominal landmark used by the low barbell row, in the seated frame.
export const CABLE_ROW_HANDLE_BOTTOM = v(0, 0.8 + (1.065 - 1.142), 0.2);
export const CABLE_ROW_HANDLE_TOP = v(0, 0.89, 0.59);
/** Keep the grips nearly upright; the eye articulates to the low cable.
 * Clamping pitch avoids forcing wrist deviation to follow the entire cable slope.
 * The apex always stays forward of the hands instead of turning into the torso.
 */
export function getCableRowFrame(center: Vector3) {
  const line = CABLE_ROW_PULLEY.clone().sub(center);
  const pitch = MathUtils.clamp(Math.atan2(-line.y, line.z), 0, Math.PI / 12);
  return new Quaternion().setFromAxisAngle(v(1, 0, 0), pitch);
}

/** Contracted at p=0; controlled forward return at p=1. No trunk rocking. */
export function getCableRowPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    tilt = new Quaternion();
  const origin = CABLE_ROW_HIP.clone().sub(v(0, -0.28, 0.08));
  const bar = CABLE_ROW_HANDLE_BOTTOM.clone().lerp(CABLE_ROW_HANDLE_TOP, p);
  const limbs = [-1, 1].map((side) => {
    const hip = CABLE_ROW_HIP.clone().setX(side * 0.14),
      ankle = CABLE_ROW_ANKLE.clone().setX(side * 0.17);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    const shoulder = origin
      .clone()
      .add(getPullingShoulder("cable-row", p, side));
    const grip = bar.clone().setX(side * CABLE_ROW_GRIP_HALF_WIDTH);
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side * 0.35, 0.1, -1),
      );
      handRotation = getPowerGripRotation(
        wrist.clone().sub(elbow),
        v(0, 1, 0).applyQuaternion(getCableRowFrame(bar)),
        side,
      );
      wrist = grip
        .clone()
        .sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    }
    elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side * 0.35, 0.1, -1),
    );
    return {
      side,
      hip,
      knee,
      ankle,
      footRotation: CABLE_ROW_FOOT_ROTATION.clone(),
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation,
    };
  });
  return { origin, tilt, bar, limbs };
}

export function getCableRowHandleRotation(
  pose: ReturnType<typeof getCableRowPose>,
) {
  return getCableRowFrame(pose.bar);
}
export function getCableRowAttachment(
  pose: ReturnType<typeof getCableRowPose>,
) {
  return v(0, 0, 0.14)
    .applyQuaternion(getCableRowHandleRotation(pose))
    .add(pose.bar);
}
export function getCableRowStackLift(pose: ReturnType<typeof getCableRowPose>) {
  const top = getCableRowAttachment(getCableRowPose(1));
  return (
    getCableRowAttachment(pose).distanceTo(CABLE_ROW_PULLEY) -
    top.distanceTo(CABLE_ROW_PULLEY)
  );
}
