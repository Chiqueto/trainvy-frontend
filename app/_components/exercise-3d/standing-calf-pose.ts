import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const CALF_PLATFORM_TOP = 0.18;
export const CALF_TOE_PIVOT = v(0, CALF_PLATFORM_TOP, 0.18);
export const CALF_FOOT_CONTACT = v(0, -0.05, 0.16);

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z));
}

/** Bilateral standing machine calf raise, pivoting about supported forefeet. */
export function getStandingCalfPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const angle = MathUtils.degToRad(MathUtils.lerp(23, -8, p));
  const footRotation = new Quaternion().setFromAxisAngle(v(1, 0, 0), angle);
  const ankleCenter = CALF_TOE_PIVOT.clone().sub(CALF_FOOT_CONTACT.clone().applyQuaternion(footRotation));
  const hipCenter = ankleCenter.clone().add(v(0, 0.855, -0.025));
  const origin = hipCenter.clone().sub(v(0, -0.28, 0.08));
  const limbs = [-1, 1].map(side => {
    const hip = hipCenter.clone().setX(side * 0.14);
    const ankle = ankleCenter.clone().setX(side * 0.14);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 0, 1));
    const shoulder = origin.clone().add(v(side * 0.215, 0.224, 0.132));
    const wrist = shoulder.clone().add(v(side * 0.15, -0.28, 0.22));
    const elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, v(side, -0.2, -1));
    const handRotation = frame(wrist.clone().sub(elbow), v(0, 0, 1)).multiply(frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert());
    const grip = wrist.clone().add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    return {side, hip, knee, ankle, footRotation, shoulder, elbow, wrist, grip, handRotation};
  });
  return {origin, tilt:new Quaternion(), bar:origin.clone(), limbs};
}
