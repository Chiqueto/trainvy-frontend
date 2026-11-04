import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z));
}

/** Conventional barbell deadlift, with the plates resting on the floor at depth 1. */
export function getDeadliftPose(depth: number) {
  const armReach = Math.sqrt(ARM_LENGTH ** 2 + FOREARM_LENGTH ** 2 +
    2 * ARM_LENGTH * FOREARM_LENGTH * Math.cos(MathUtils.degToRad(8)));
  const p = MathUtils.clamp(depth, 0, 1);
  const hipCenter = v(0, MathUtils.lerp(0.9, 0.61, p), MathUtils.lerp(0.08, -0.2, p));
  const barY = MathUtils.lerp(0.88, 0.2, p);
  const barZ = MathUtils.lerp(0.25, 0.32, p);
  const shoulderAt = (angle: number) => v(0.215, 0.504, 0.052)
    .applyAxisAngle(v(1, 0, 0), angle).add(hipCenter);
  let angle = 0;
  let offset = v(0, 0.004, 0.012);
  for (let iteration = 0; iteration < 12; iteration++) {
    const wrist = v(0.29, barY, barZ).sub(offset);
    let low = 0, high = 1.5;
    for (let i = 0; i < 32; i++) {
      const mid = (low + high) / 2;
      if (shoulderAt(mid).distanceTo(wrist) > armReach) low = mid; else high = mid;
    }
    angle = (low + high) / 2;
    const shoulder = shoulderAt(angle);
    const elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, v(0.25, 0, -1));
    const rotation = frame(wrist.clone().sub(elbow), v(0, 0, 1))
      .multiply(frame(v(0.025, -0.265, 0.03), v(0, 0, 1)).invert());
    offset = v(0, 0.004, 0.012).applyQuaternion(rotation);
  }
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), angle);
  const body = (point: Vector3) => point.clone().sub(v(0, -0.28, 0.08)).applyQuaternion(tilt).add(hipCenter);
  const limbs = [-1, 1].map((side) => {
    const hip = v(side * 0.14, hipCenter.y, hipCenter.z);
    const ankle = v(side * 0.14, 0.05, 0.08);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = v(side * (0.29 - offset.x), barY - offset.y, barZ - offset.z);
    const elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, v(side * 0.25, 0, -1));
    const handRotation = frame(wrist.clone().sub(elbow), v(0, 0, 1))
      .multiply(frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert());
    const grip = wrist.clone().add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    return { side, hip, knee, ankle, footRotation: new Quaternion(), shoulder, elbow, wrist, grip, handRotation };
  });
  const bar = limbs[0].grip.clone().lerp(limbs[1].grip, 0.5);
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
