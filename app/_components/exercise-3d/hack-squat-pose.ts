import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const HACK_RAIL_DIRECTION = v(0, Math.SQRT1_2, -Math.SQRT1_2);
export const HACK_HIP_TOP = v(0, 0.92, -0.2);
export const HACK_TILT = new Quaternion().setFromAxisAngle(
  v(1, 0, 0),
  -Math.PI / 4,
);
export const HACK_FOOT_ANGLE = -Math.PI / 9;
export const HACK_PLATE_NORMAL = v(
  0,
  Math.cos(HACK_FOOT_ANGLE),
  Math.sin(HACK_FOOT_ANGLE),
);
export const HACK_PLATE_CENTER = v(0, 0.32, 0.4)
  .addScaledVector(HACK_PLATE_NORMAL, -0.048)
  .add(
    v(0, -Math.sin(HACK_FOOT_ANGLE), Math.cos(HACK_FOOT_ANGLE)).multiplyScalar(
      0.08,
    ),
  );

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Back-supported hack machine: illustrative 45-degree rails, fixed footplate. */
export function getHackSquatPose(depth: number) {
  const hipCenter = HACK_HIP_TOP.clone().addScaledVector(
    HACK_RAIL_DIRECTION,
    -0.29 * MathUtils.clamp(depth, 0, 1),
  );
  const tilt = HACK_TILT.clone();
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(hipCenter);
  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14);
    const ankle = v(side * 0.2, 0.32, 0.4);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.1, 0.1, 1));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(1, 0, 0),
      HACK_FOOT_ANGLE,
    );
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = body(v(side * 0.3, 0.1, 0.3));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.7, -0.1).applyQuaternion(tilt),
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
  return { origin: body(v(0, 0, 0)), tilt, bar: hipCenter, limbs };
}
