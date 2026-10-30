import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const STIFF_KNEE_FLEXION = MathUtils.degToRad(10);
const legReach = Math.sqrt(
  0.44 ** 2 + 0.42 ** 2 + 2 * 0.44 * 0.42 * Math.cos(STIFF_KNEE_FLEXION),
);

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Top-down barbell hinge, near-straight knees held at an illustrative 10 degrees. */
export function getStiffPose(depth: number) {
  const armReach = Math.sqrt(
    ARM_LENGTH ** 2 +
      FOREARM_LENGTH ** 2 +
      2 * ARM_LENGTH * FOREARM_LENGTH * Math.cos(MathUtils.degToRad(8)),
  );
  const p = MathUtils.clamp(depth, 0, 1);
  const lean = MathUtils.degToRad(12 * p);
  const hipCenter = v(
    0,
    0.05 + legReach * Math.cos(lean),
    0.08 - legReach * Math.sin(lean),
  );
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(82 * p),
  );
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(hipCenter);
  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14);
    const ankle = v(side * 0.14, 0.05, 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = v(side * 0.29, 0, MathUtils.lerp(0.185, 0.13, p));
    const dx = wrist.x - shoulder.x,
      dz = wrist.z - shoulder.z;
    wrist.y = shoulder.y - Math.sqrt(armReach ** 2 - dx ** 2 - dz ** 2);
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side * 0.25, 0, -1),
    );
    const handRotation = frame(wrist.clone().sub(elbow), v(0, 0, 1)).multiply(
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
  const bar = limbs[0].grip.clone().lerp(limbs[1].grip, 0.5);
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
