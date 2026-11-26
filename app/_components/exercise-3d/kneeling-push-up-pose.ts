import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getScapularMotion } from "./scapular-motion";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export const KNEELING_PUSH_UP_MAT_TOP = 0.014;
export const KNEELING_PUSH_UP_KNEE_Y = 0.08;
export const KNEELING_PUSH_UP_KNEE_Z = -0.36;
export const KNEELING_PUSH_UP_HAND_X = 0.295;
export const KNEELING_PUSH_UP_HAND_Y = KNEELING_PUSH_UP_MAT_TOP + 0.038;
export const KNEELING_PUSH_UP_HAND_Z = 0.51;
export const KNEELING_PUSH_UP_TOP_PITCH = MathUtils.degToRad(37);
export const KNEELING_PUSH_UP_BOTTOM_PITCH = MathUtils.degToRad(15.5);

const SHIN_ELEVATION = MathUtils.degToRad(32);
const hipLocal = v(0, -0.28, 0.08);
const palmOffset = v(0, 0.004, 0.012);

// Open palm resting flat on the floor mat, fingers pointing forward (+Z), thumbs inward.
const flatPalmRotation = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(v(-1, 0, 0), v(0, 0, -1), v(0, -1, 0)),
);

/** Bilateral kneeling push-up: knees fixed on mat, straight plank through hip and shoulders,
 * open palms planted slightly wider than shoulders. Illustrative avatar dimensions.
 */
export function getKneelingPushUpPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const pitch = MathUtils.lerp(
    KNEELING_PUSH_UP_TOP_PITCH,
    KNEELING_PUSH_UP_BOTTOM_PITCH,
    p,
  );
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    Math.PI / 2 - pitch,
  );
  const hipCenter = v(
    0,
    KNEELING_PUSH_UP_KNEE_Y + 0.44 * Math.sin(pitch),
    KNEELING_PUSH_UP_KNEE_Z + 0.44 * Math.cos(pitch),
  );
  const body = (point: Vector3) =>
    point.clone().sub(hipLocal).applyQuaternion(tilt).add(hipCenter);

  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14);
    const knee = v(
      side * 0.14,
      KNEELING_PUSH_UP_KNEE_Y,
      KNEELING_PUSH_UP_KNEE_Z,
    );
    const ankle = knee
      .clone()
      .add(
        v(
          0,
          0.42 * Math.sin(SHIN_ELEVATION),
          -0.42 * Math.cos(SHIN_ELEVATION),
        ),
      );
    const footRotation = new Quaternion().setFromAxisAngle(
      v(1, 0, 0),
      Math.PI / 2 + SHIN_ELEVATION,
    );
    const shoulder = body(
      getScapularMotion("kneeling-push-up", p, side).point(
        v(side * 0.215, 0.224, 0.132),
      ),
    );
    const wrist = v(
      side * KNEELING_PUSH_UP_HAND_X,
      KNEELING_PUSH_UP_HAND_Y,
      KNEELING_PUSH_UP_HAND_Z,
    );
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side * 0.35, 0.9, -0.75),
    );
    const handRotation = flatPalmRotation.clone();
    const grip = wrist
      .clone()
      .add(palmOffset.clone().applyQuaternion(handRotation));
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
    bar: limbs[0].grip.clone().lerp(limbs[1].grip, 0.5),
    limbs,
  };
}
