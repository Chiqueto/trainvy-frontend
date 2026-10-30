import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const PRONE_CURL_PAD_ANGLE = Math.PI / 12;
export const PRONE_CURL_TORSO_PAD_ANGLE = Math.PI / 10;
export const PRONE_CURL_HIP = v(0, 0.82, 0);
export const PRONE_CURL_KNEE = PRONE_CURL_HIP.clone().add(
  v(
    0,
    -0.44 * Math.sin(PRONE_CURL_PAD_ANGLE),
    -0.44 * Math.cos(PRONE_CURL_PAD_ANGLE),
  ),
);
// Calibrated to the athlete's anterior surfaces; padding does not define joint angles.
export const PRONE_CURL_PAD_HINGE = v(0, 0.665, 0);
export const PRONE_CURL_THIGH_PAD_HEIGHT = 0.757;
export const PRONE_CURL_ROLLER_RADIUS = 0.065;

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Prone with 30° illustrative hip flexion and a fixed pelvis. */
export function getProneLegCurlPose(depth: number) {
  const flexion = MathUtils.degToRad(
    MathUtils.lerp(90, 10, MathUtils.clamp(depth, 0, 1)),
  );
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    Math.PI / 2 + PRONE_CURL_PAD_ANGLE,
  );
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(PRONE_CURL_HIP);
  const limbs = [-1, 1].map((side) => {
    const hip = PRONE_CURL_HIP.clone().setX(side * 0.14);
    const knee = PRONE_CURL_KNEE.clone().setX(side * 0.14);
    const angle = flexion - PRONE_CURL_PAD_ANGLE;
    const ankle = knee
      .clone()
      .add(v(0, 0.42 * Math.sin(angle), -0.42 * Math.cos(angle)));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(1, 0, 0),
      Math.PI / 2 + angle,
    );
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = v(side * 0.32, 0.52, 0.77);
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side, -0.7, -0.1),
    );
    const forearm = wrist.clone().sub(elbow);
    const handRotation = frame(forearm, v(0, -1, 0)).multiply(
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
      footRotation,
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation,
    };
  });
  return { origin: body(v(0, 0, 0)), tilt, bar: v(0, 0, 0), limbs };
}

/** Posterior distal contact follows the shin, not a world-axis approximation. */
export function getProneLegCurlRoller(
  pose: ReturnType<typeof getProneLegCurlPose>,
) {
  const { knee, ankle } = pose.limbs[0];
  const shin = ankle.clone().sub(knee).normalize();
  const posterior = v(0, -shin.z, shin.y);
  return knee
    .clone()
    .addScaledVector(shin, 0.34)
    .addScaledVector(posterior, PRONE_CURL_ROLLER_RADIUS + 0.035)
    .setX(0);
}

export function getProneLegCurlLeverAngle(
  pose: ReturnType<typeof getProneLegCurlPose>,
) {
  const roller = getProneLegCurlRoller(pose);
  return -Math.atan2(
    roller.y - PRONE_CURL_KNEE.y,
    roller.z - PRONE_CURL_KNEE.z,
  );
}

export function getProneLegCurlPads() {
  const torsoDirection = v(
    0,
    -Math.sin(PRONE_CURL_TORSO_PAD_ANGLE),
    Math.cos(PRONE_CURL_TORSO_PAD_ANGLE),
  );
  const torsoNormal = v(
    0,
    Math.cos(PRONE_CURL_TORSO_PAD_ANGLE),
    Math.sin(PRONE_CURL_TORSO_PAD_ANGLE),
  );
  const thighNormal = v(
    0,
    Math.cos(PRONE_CURL_PAD_ANGLE),
    -Math.sin(PRONE_CURL_PAD_ANGLE),
  );
  const thighTop = v(
    0,
    PRONE_CURL_THIGH_PAD_HEIGHT - Math.tan(PRONE_CURL_PAD_ANGLE) * 0.25,
    -0.25,
  );
  const transitionStart = v(
    0,
    PRONE_CURL_THIGH_PAD_HEIGHT - Math.tan(PRONE_CURL_PAD_ANGLE) * 0.1,
    -0.1,
  );
  const transitionEnd = PRONE_CURL_PAD_HINGE.clone();
  const hipAngle = Math.atan2(transitionStart.y - transitionEnd.y, 0.1);
  const hipNormal = v(0, Math.cos(hipAngle), Math.sin(hipAngle));
  return {
    torso: PRONE_CURL_PAD_HINGE.clone()
      .addScaledVector(torsoDirection, 0.29)
      .addScaledVector(torsoNormal, -0.04),
    thigh: thighTop.addScaledVector(thighNormal, -0.04),
    thighLength: 0.3 / Math.cos(PRONE_CURL_PAD_ANGLE),
    hip: transitionStart
      .clone()
      .lerp(transitionEnd, 0.5)
      .addScaledVector(hipNormal, -0.04),
    hipAngle,
    hipLength: transitionStart.distanceTo(transitionEnd),
  };
}
