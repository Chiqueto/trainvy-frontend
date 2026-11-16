import { getPullingShoulder } from "./scapular-motion";
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
export function getBentRowPose(depth: number, variant: "pronated" | "supinated" | "high" = "pronated") {
  const p = MathUtils.clamp(depth, 0, 1),
    tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), BENT_ROW_TILT);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(BENT_ROW_HIP);
  const high = variant === "high";
  const bar = v(
    0,
    MathUtils.lerp(high ? 1.015 : .855, 0.54, p),
    MathUtils.lerp(high ? .32 : .145, .30, p),
  );
  const limbs = [-1, 1].map((side) => {
    const hip = BENT_ROW_HIP.clone().setX(side * 0.14),
      ankle = v(side * 0.18, 0.05, 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(getPullingShoulder('bent-row',p,side));
    const grip = bar.clone().setX(side * (high ? .37 : .28));
    const pole = high ? v(side, -.10, -.35) : v(side * .18, -.25, -1);
    let wrist = grip.clone(),
      elbow = shoulder.clone(),
      handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        pole,
      );
      handRotation = frame(wrist.clone().sub(elbow), v(1, 0, 0)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(1, 0, 0)).invert(),
      );
      // Supination rolls radius/ulna and the palm together around the forearm.
      // The transverse bar axis is preserved (its direction may reverse).
      if(variant === "supinated") handRotation.premultiply(new Quaternion().setFromAxisAngle(wrist.clone().sub(elbow).normalize(), Math.PI));
      wrist = grip
        .clone()
        .sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    }
    elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      pole,
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
