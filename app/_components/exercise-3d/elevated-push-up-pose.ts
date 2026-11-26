import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getScapularMotion } from "./scapular-motion";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export const ELEVATED_PUSH_UP_DECK_TOP = 0.41;
export const ELEVATED_PUSH_UP_HAND_X = 0.295;
export const ELEVATED_PUSH_UP_HAND_Y = ELEVATED_PUSH_UP_DECK_TOP + 0.038;
export const ELEVATED_PUSH_UP_HAND_Z = 0.51;
export const ELEVATED_PUSH_UP_TOP_PITCH = MathUtils.degToRad(38.5);
export const ELEVATED_PUSH_UP_BOTTOM_PITCH = MathUtils.degToRad(21);

const THIGH_LENGTH = 0.44;
const SHIN_LENGTH = 0.42;
const LEG_CHORD = 0.8594;
const LEG_SEG_T =
  (THIGH_LENGTH * THIGH_LENGTH - SHIN_LENGTH * SHIN_LENGTH + LEG_CHORD * LEG_CHORD) /
  (2 * LEG_CHORD);
const LEG_KNEE_OFFSET = Math.sqrt(
  Math.max(0, THIGH_LENGTH * THIGH_LENGTH - LEG_SEG_T * LEG_SEG_T),
);

const hipLocal = v(0, -0.28, 0.08);
const palmOffset = v(0, 0.004, 0.012);

// Open palm resting flat on top of the bench deck, fingers forward (+Z).
const flatPalmRotation = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(v(-1, 0, 0), v(0, 0, -1), v(0, -1, 0)),
);

/** Bilateral hands-elevated incline push-up:
 * open palms planted on elevated bench, feet grounded behind, straight plank
 * connecting ankles, knees, hips and shoulders.
 */
export function getElevatedPushUpPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const pitch = MathUtils.lerp(
    ELEVATED_PUSH_UP_TOP_PITCH,
    ELEVATED_PUSH_UP_BOTTOM_PITCH,
    p,
  );
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    Math.PI / 2 - pitch,
  );
  const plankUp = v(0, Math.sin(pitch), Math.cos(pitch));
  // Front/anterior surface normal in plank frame (faces forward-down toward floor)
  const plankAnterior = v(0, -Math.cos(pitch), Math.sin(pitch));

  const ankleCenter = v(0, 0.168, -0.68);
  const hipCenter = ankleCenter.clone().addScaledVector(plankUp, LEG_CHORD);
  const body = (point: Vector3) =>
    point.clone().sub(hipLocal).applyQuaternion(tilt).add(hipCenter);

  // Forefoot braced on floor, toes angled forward-down onto y = 0
  const footRotation = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(MathUtils.lerp(66, 74, p)),
  );

  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.135);
    const ankle = ankleCenter.clone().setX(side * 0.135);
    const hipToAnkle = ankle.clone().sub(hip).normalize();
    // Preserve exact thigh (0.44) & shin (0.42) lengths with slight anterior knee contour
    const knee = hip
      .clone()
      .addScaledVector(hipToAnkle, LEG_SEG_T)
      .addScaledVector(plankAnterior, LEG_KNEE_OFFSET);

    const shoulder = body(
      getScapularMotion("elevated-push-up", p, side).point(
        v(side * 0.215, 0.224, 0.132),
      ),
    );
    const wrist = v(
      side * ELEVATED_PUSH_UP_HAND_X,
      ELEVATED_PUSH_UP_HAND_Y,
      ELEVATED_PUSH_UP_HAND_Z,
    );
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side * 0.28, 0.95, -0.78),
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
      footRotation: footRotation.clone(),
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
