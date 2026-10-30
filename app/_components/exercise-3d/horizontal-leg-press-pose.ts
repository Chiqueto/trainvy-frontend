import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const HORIZONTAL_PRESS_SEAT_CENTER = v(0, 0.547, -0.42);
export const HORIZONTAL_PRESS_SEAT_ANGLE = -Math.PI / 18;
export const HORIZONTAL_PRESS_HIP = v(0, 0.68, -0.45);
export const HORIZONTAL_PRESS_RAIL = v(0, 0, 1);
export const HORIZONTAL_PRESS_TILT = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  (-7 * Math.PI) / 36,
);
export const HORIZONTAL_PRESS_FOOT_ANGLE = -Math.PI / 2;
export const HORIZONTAL_PRESS_FOOT_ROTATION = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  HORIZONTAL_PRESS_FOOT_ANGLE,
);
export const HORIZONTAL_PRESS_PLATE_NORMAL = v(0, 0, -1);
export const HORIZONTAL_PRESS_PLATE_TOP = v(0, 0.98, 0.34)
  .add(v(0, 0, 0.05))
  .add(v(0, 0, 0.08).applyQuaternion(HORIZONTAL_PRESS_FOOT_ROTATION));

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Seated selectorized press: fixed back/pelvis and a strictly horizontal moving platform. */
export function getHorizontalLegPressPose(depth: number) {
  const displacement = HORIZONTAL_PRESS_RAIL.clone().multiplyScalar(
    -0.28 * MathUtils.clamp(depth, 0, 1),
  );
  const tilt = HORIZONTAL_PRESS_TILT.clone();
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(HORIZONTAL_PRESS_HIP);
  const limbs = [-1, 1].map((side) => {
    const hip = HORIZONTAL_PRESS_HIP.clone().setX(side * 0.14);
    const ankle = v(side * 0.2, 0.98, 0.34).add(displacement);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.1, 1, -0.2));
    const footRotation = HORIZONTAL_PRESS_FOOT_ROTATION.clone();
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = body(v(side * 0.32, -0.17, 0.21));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.4, -0.2).applyQuaternion(tilt),
    );
    const handRotation = frame(
      wrist.clone().sub(elbow),
      v(0, 0, 1).applyQuaternion(tilt),
    ).multiply(frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert());
    const grip = wrist
      .clone()
      .add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
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
  return {
    origin: body(v(0, 0, 0)),
    tilt,
    bar: HORIZONTAL_PRESS_PLATE_TOP.clone().add(displacement),
    limbs,
  };
}
