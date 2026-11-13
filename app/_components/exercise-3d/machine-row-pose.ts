import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const MACHINE_ROW_HIP = v(0, 0.51, 0);
export const MACHINE_ROW_PIVOT = v(0, 0.1505, 0.63);
export const MACHINE_ROW_RADIUS = Math.hypot(0.8495, 0.01);
export const MACHINE_ROW_PAD_CENTER = v(0, 0.87, 0.1875);
export const MACHINE_ROW_PAD_SIZE = [0.27, 0.22, 0.055] as const;
export const MACHINE_ROW_GRIP_HALF_WIDTH = 0.25;
export const MACHINE_ROW_LEVER_X = 0.37;
function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize(),
    z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}
/** Fixed-axis lever, rather than an independently animated equipment/hand path. */
export function getMachineRowLever(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    angle = MathUtils.lerp(
      Math.atan2(0.4, 0.7495),
      Math.atan2(0.01, 0.8495),
      p,
    );
  return {
    angle,
    rotation: new Quaternion().setFromAxisAngle(v(1, 0, 0), -angle),
    grip: MACHINE_ROW_PIVOT.clone().add(
      v(
        0,
        MACHINE_ROW_RADIUS * Math.cos(angle),
        -MACHINE_ROW_RADIUS * Math.sin(angle),
      ),
    ),
  };
}
/** Chest supported, shoulder-width neutral grip, p=0 contracted and p=1 returned. */
export function getMachineRowPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    tilt = new Quaternion(),
    origin = MACHINE_ROW_HIP.clone().sub(v(0, -0.28, 0.08));
  const bar = getMachineRowLever(p).grip;
  const limbs = [-1, 1].map((side) => {
    const hip = MACHINE_ROW_HIP.clone().setX(side * 0.14),
      ankle = v(side * 0.19, 0.05, 0.52);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    const shoulder = origin
      .clone()
      .add(v(side * 0.215, 0.224, 0.132 + 0.015 * p));
    const grip = bar.clone().setX(side * MACHINE_ROW_GRIP_HALF_WIDTH);
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side * 0.3, -1, -0.4),
      );
      handRotation = frame(wrist.clone().sub(elbow), v(-side, 0, 0)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert(),
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
      v(side * 0.3, -1, -0.4),
    );
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
  return { origin, tilt, bar, limbs };
}
