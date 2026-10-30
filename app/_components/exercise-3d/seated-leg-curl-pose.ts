import { MathUtils, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const SEATED_CURL_HIP = v(0, 0.68, 0);
export const SEATED_CURL_KNEE = v(0, 0.68, 0.44);
export const SEATED_CURL_ROLLER_RADIUS = 0.065;
// Bottom face at 0.735 m meets the supported athlete's anterior thigh surface.
export const SEATED_CURL_THIGH_PAD = v(0, 0.78, 0.29);

/** Eccentric return extends the knees; concentric flexion lowers the heels. */
export function getSeatedLegCurlPose(depth: number) {
  const flexion = MathUtils.degToRad(
    MathUtils.lerp(90, 10, MathUtils.clamp(depth, 0, 1)),
  );
  const tilt = new Quaternion();
  const origin = SEATED_CURL_HIP.clone().sub(v(0, -0.28, 0.08));
  const limbs = [-1, 1].map((side) => {
    const hip = SEATED_CURL_HIP.clone().setX(side * 0.14);
    const knee = SEATED_CURL_KNEE.clone().setX(side * 0.14);
    const ankle = knee
      .clone()
      .add(v(0, -0.42 * Math.sin(flexion), 0.42 * Math.cos(flexion)));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(1, 0, 0),
      flexion - Math.PI / 2,
    );
    const shoulder = v(side * 0.215, 0.224, 0.132).add(origin);
    const grip = v(side * 0.34, 0.69, 0.08);
    const handRotation = new Quaternion();
    const wrist = grip.clone().sub(v(0, 0.004, 0.012));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.1, -0.5),
    );
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
  return { origin, tilt, bar: v(0, 0, 0), limbs };
}

/** Posterior roller opposes knee flexion; never use the extensora's anterior contact. */
export function getSeatedLegCurlRoller(
  pose: ReturnType<typeof getSeatedLegCurlPose>,
) {
  const { knee, ankle } = pose.limbs[0];
  const shin = ankle.clone().sub(knee).normalize();
  const anterior = v(0, shin.z, -shin.y);
  return knee
    .clone()
    .addScaledVector(shin, 0.34)
    .addScaledVector(anterior, -(SEATED_CURL_ROLLER_RADIUS + 0.035))
    .setX(0);
}

export function getSeatedLegCurlLeverAngle(
  pose: ReturnType<typeof getSeatedLegCurlPose>,
) {
  const roller = getSeatedLegCurlRoller(pose);
  return -Math.atan2(
    roller.y - SEATED_CURL_KNEE.y,
    roller.z - SEATED_CURL_KNEE.z,
  );
}
