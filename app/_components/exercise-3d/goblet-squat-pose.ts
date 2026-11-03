import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export const GOBLET_TOE_OUT = MathUtils.degToRad(20);
export const GOBLET_HAND_CENTER = { x: 0.065, y: 0.05, z: 0 };

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Front-loaded goblet squat: upright torso (~75° to horizontal), dumbbell cupped at upper chest, knees tracking toes. */
export function getGobletSquatPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const hipCenter = v(0, 0.895 - 0.465 * p, -0.03 - 0.17 * p);
  // Upright torso: anterior load counterbalances the hips, keeping trunk inclination modest (~15° at bottom)
  const tiltAngle = MathUtils.degToRad(3 + 12 * p);
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), tiltAngle);

  const hipLocal = v(0, -0.28, 0.08);
  const body = (point: Vector3) =>
    point.clone().sub(hipLocal).applyQuaternion(tilt).add(hipCenter);

  // The upper head stays at the sternum; both palms support its lower rim.
  const gobletCenter = body(v(0, 0.08, 0.335));

  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    // Stable stance with flat soles planted on the floor, identical to free squat
    const ankle = v(side * 0.2, 0.05, 0.04);
    const knee = solveJoint(
      hip,
      ankle,
      0.44,
      0.42,
      v(side * Math.tan(GOBLET_TOE_OUT), 0.15, 1),
    );
    const footRotation = new Quaternion().setFromAxisAngle(
      v(0, 1, 0),
      side * GOBLET_TOE_OUT,
    );

    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const palmCenter = gobletCenter
      .clone()
      .add(
        v(
          side * GOBLET_HAND_CENTER.x,
          GOBLET_HAND_CENTER.y,
          GOBLET_HAND_CENTER.z,
        ).applyQuaternion(tilt),
      );
    // Measured centroid of the existing authored hand, relative to its wrist.
    const handOffset = v(-side * 0.00220824, -0.00678324, 0.00986745);
    const elbowPole = v(side * 0.25, -0.85, 0.18)
      .applyQuaternion(tilt)
      .normalize();
    const wrist = palmCenter.clone();
    const handRotation = new Quaternion();
    const palmNormal = v(-side, 0.5, 0).applyQuaternion(tilt);
    // Solve the wrist around its actual hand geometry rather than treating the
    // wrist pivot as the palm. This keeps contact through the whole body tilt.
    for (let i = 0; i < 12; i++) {
      const joint = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        elbowPole,
      );
      handRotation
        .copy(frame(wrist.clone().sub(joint), palmNormal))
        .multiply(frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert());
      wrist
        .copy(palmCenter)
        .sub(handOffset.clone().applyQuaternion(handRotation));
    }
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      elbowPole,
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
      handRotation,
      grip,
    };
  });

  return {
    bar: gobletCenter,
    limbs,
    origin: body(v(0, 0, 0)),
    tilt,
  };
}
