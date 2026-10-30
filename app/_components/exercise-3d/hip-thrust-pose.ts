import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const HIP_THRUST_SUPPORT = { height: 0.42, edgeZ: -0.17 };

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Fixed thoracic pivot and planted feet; hip extension drives the padded bar. */
export function getHipThrustPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(-90 + 35 * p),
  );
  const pivot = v(0, HIP_THRUST_SUPPORT.height, HIP_THRUST_SUPPORT.edgeZ);
  const supportLocal = v(0, 0.14, 0.03);
  const body = (point: Vector3) =>
    point.clone().sub(supportLocal).applyQuaternion(tilt).add(pivot);
  const hipCenter = body(v(0, -0.28, 0.08));
  // The pad rides over the anterior hip/thigh surface as the hip folds.
  // This smooth clearance follows the skinned soft-tissue envelope, not a
  // telescoping bone or a change to the fixed thoracic/foot contacts.
  const bar = body(v(0, -0.28, 0.255)).add(v(0, 0.055 * p ** 4, 0));
  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14);
    const ankle = v(side * 0.14, 0.05, 0.69);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = bar.clone().add(v(side * 0.31, 0.026, 0.005));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.2, 0.3),
    );
    const handRotation = frame(wrist.clone().sub(elbow), v(0, -1, 0)).multiply(
      frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert(),
    );
    const grip = wrist
      .clone()
      .add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
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
