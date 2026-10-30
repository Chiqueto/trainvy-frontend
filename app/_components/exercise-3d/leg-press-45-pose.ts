import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const LEG_PRESS_SEAT_CENTER = v(0, 0.37, -0.47);
export const LEG_PRESS_SEAT_ANGLE = -Math.PI / 18;
export const LEG_PRESS_HIP = v(0, 0.5, -0.5);
export const LEG_PRESS_RAIL = v(0, Math.SQRT1_2, Math.SQRT1_2);
export const LEG_PRESS_TILT = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  -Math.PI / 3,
);
export const LEG_PRESS_FOOT_ANGLE = -Math.PI / 2;
export const LEG_PRESS_FOOT_ROTATION = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  LEG_PRESS_FOOT_ANGLE,
);
export const LEG_PRESS_PLATE_NORMAL = v(0, 0, -1);
export const LEG_PRESS_PLATE_TOP = v(0, 0.9, 0.25)
  .add(v(0, 0, 0.05))
  .add(v(0, 0, 0.08).applyQuaternion(LEG_PRESS_FOOT_ROTATION));

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Fixed supported pelvis; bilateral footplate travels along its own 45-degree rails. */
export function getLegPress45Pose(depth: number) {
  const displacement = LEG_PRESS_RAIL.clone().multiplyScalar(
    -0.29 * MathUtils.clamp(depth, 0, 1),
  );
  const tilt = LEG_PRESS_TILT.clone();
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(LEG_PRESS_HIP);
  const limbs = [-1, 1].map((side) => {
    const hip = LEG_PRESS_HIP.clone().setX(side * 0.14);
    const ankle = v(side * 0.2, 0.9, 0.25).add(displacement);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.1, 1, -0.2));
    const footRotation = LEG_PRESS_FOOT_ROTATION.clone();
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
    bar: LEG_PRESS_PLATE_TOP.clone().add(displacement),
    limbs,
  };
}
