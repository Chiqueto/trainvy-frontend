import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const ONE_ARM_ROW_BENCH_TOP = 0.5;
export const ONE_ARM_ROW_HIP = v(0, 0.86, -0.41);
export const ONE_ARM_ROW_SUPPORT_WRIST = v(-0.215, 0.54, 0.53);
export const ONE_ARM_ROW_SUPPORT_KNEE = v(
  -0.14,
  0.52,
  -0.41 + Math.sqrt(0.44 ** 2 - 0.34 ** 2),
);
const supportHand = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(v(-1, 0, 0), v(0, 0, -1), v(0, -1, 0)),
);
function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize(),
    z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}
/** Demonstrates one side per cycle; the other hand/knee and standing foot stay planted. */
export function getOneArmRowPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), 1.42);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(ONE_ARM_ROW_HIP);
  const limbs = [-1, 1].map((side) => {
    const hip = ONE_ARM_ROW_HIP.clone().setX(side * 0.14);
    const ankle =
      side < 0
        ? ONE_ARM_ROW_SUPPORT_KNEE.clone().add(v(0, 0, -0.42))
        : v(0.31, 0.05, -0.35);
    const knee =
      side < 0
        ? ONE_ARM_ROW_SUPPORT_KNEE.clone()
        : solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    if (side < 0) {
      const wrist = ONE_ARM_ROW_SUPPORT_WRIST.clone(),
        elbow = solveJoint(
          shoulder,
          wrist,
          ARM_LENGTH,
          FOREARM_LENGTH,
          v(-0.5, -0.2, 0),
        ),
        handRotation = supportHand.clone();
      return {
        side,
        hip,
        knee,
        ankle,
        footRotation: new Quaternion().setFromAxisAngle(v(1, 0, 0), Math.PI),
        shoulder,
        elbow,
        wrist,
        grip: wrist
          .clone()
          .add(v(0, 0.004, 0.012).applyQuaternion(handRotation)),
        handRotation,
      };
    }
    const grip = v(
      0.36,
      MathUtils.lerp(0.7, 0.35, p),
      MathUtils.lerp(-0.12, 0.11, p),
    );
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(0.3, 0.15, -1),
      );
      handRotation = frame(wrist.clone().sub(elbow), v(-1, 0, 0)).multiply(
        frame(v(0.025, -0.265, 0.03), v(0, 0, 1)).invert(),
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
      v(0.3, 0.15, -1),
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
  return { origin: body(v(0, 0, 0)), tilt, bar: limbs[1].grip.clone(), limbs };
}
