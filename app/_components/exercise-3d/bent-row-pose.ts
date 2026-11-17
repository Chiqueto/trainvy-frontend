import { getPowerGripRotation } from "./power-grip";
import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getPullingShoulder } from "./scapular-motion";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const BENT_ROW_HIP = v(0, 0.78, -0.22);
export const BENT_ROW_TILT = 1.1; // 27° above horizontal; illustrative, not a universal optimum.
export const ROW_BAR_RADIUS = 0.014;
export const ROW_PLATE_RADIUS = 0.2;
export type RowVariant =
  | "pronated"
  | "supinated"
  | "high"
  | "high-supinated"
  | "yates"
  | "yates-supinated"
  | "pendlay";
/** Root-relative landmarks calibrated to this atlas, not arbitrary world heights.
 * Rest root is y=1.142m; pec lower boundary ~1.191m, abdomen anterior surface z=.22–.234m.
 * Shaft centres include radius + a small clearance anterior to the anatomical surface.
 */
export const ROW_LANDMARKS = {
  low: v(0, 1.065 - 1.142, 0.25),
  high: v(0, 1.205 - 1.142, 0.265),
  yates: v(0, 1.04 - 1.142, 0.247),
  pendlay: v(0, 1.18 - 1.142, 0.265),
};
export function getRowConfiguration(variant: RowVariant) {
  const high = variant === "high" || variant === "high-supinated";
  const yates = variant === "yates" || variant === "yates-supinated";
  const pendlay = variant === "pendlay";
  return {
    high,
    yates,
    pendlay,
    supinated: variant === "supinated" || variant.endsWith("-supinated"),
    hip: pendlay
      ? v(0, 0.755, -0.34)
      : yates
        ? v(0, 0.84, -0.19)
        : BENT_ROW_HIP.clone(),
    tilt: pendlay ? 1.49 : yates ? 0.7 : BENT_ROW_TILT,
    halfWidth: high
      ? variant === "high-supinated"
        ? 0.35
        : 0.36
      : pendlay
        ? 0.3
        : 0.27,
    landmark:
      ROW_LANDMARKS[
        pendlay ? "pendlay" : yates ? "yates" : high ? "high" : "low"
      ],
  };
}
/** p=0 contracted at its named anatomical landmark; p=1 extended (floor for Pendlay). */
export function getBentRowPose(
  depth: number,
  variant: RowVariant = "pronated",
) {
  const p = MathUtils.clamp(depth, 0, 1),
    config = getRowConfiguration(variant);
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), config.tilt);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(config.hip);
  const extendedShoulder = body(getPullingShoulder("bent-row", 1, 1));
  const hang = config.pendlay
    ? v(0, ROW_PLATE_RADIUS, 0.17)
    : v(0, extendedShoulder.y - 0.53, extendedShoulder.z);
  const bar = body(config.landmark).lerp(hang, p);
  const limbs = [-1, 1].map((side) => {
    const hip = config.hip.clone().setX(side * 0.14),
      ankle = v(side * 0.18, 0.05, 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(getPullingShoulder("bent-row", p, side));
    const grip = bar.clone().setX(side * config.halfWidth);
    const pole = config.high
      ? v(side * 0.55, -0.1, -0.5)
      : config.pendlay
        ? v(side * 0.45, -0.15, -1)
        : v(side * 0.12, -0.25, -1);
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 16; i++) {
      elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
      handRotation = getPowerGripRotation(
        wrist.clone().sub(elbow),
        v(1, 0, 0),
        config.supinated ? 1 : -1,
      );

      wrist = grip
        .clone()
        .sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    }
    elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
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
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
