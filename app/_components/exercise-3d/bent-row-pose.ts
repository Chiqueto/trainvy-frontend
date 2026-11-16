import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const BENT_ROW_HIP = v(0, 0.78, -0.22);
export const BENT_ROW_TILT = 0.9;
function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize(),
    z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}
/** Fixed hip hinge: contracted p=0 and controlled lowering to long arms at p=1. */
export function getBentRowPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1),
    tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), BENT_ROW_TILT);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(BENT_ROW_HIP);
  const bar = v(
    0,
    MathUtils.lerp(0.88, 0.52, p),
    MathUtils.lerp(0.19, 0.29, p),
  );
  const limbs = [-1, 1].map((side) => {
    const hip = BENT_ROW_HIP.clone().setX(side * 0.14),
      ankle = v(side * 0.18, 0.05, 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const grip = bar.clone().setX(side * 0.28);
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side * 0.3, -0.25, -1),
      );
      handRotation = frame(wrist.clone().sub(elbow), v(1, 0, 0)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(1, 0, 0)).invert(),
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
      v(side * 0.3, -0.25, -1),
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
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
