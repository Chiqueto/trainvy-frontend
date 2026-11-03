import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

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
  const hipCenter = v(
    0,
    MathUtils.lerp(0.895, 0.515, p),
    MathUtils.lerp(-0.03, -0.22, p),
  );
  // Upright torso: anterior load counterbalances the hips, keeping trunk inclination modest (~15° at bottom)
  const tiltAngle = MathUtils.degToRad(MathUtils.lerp(3, 15, p));
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), tiltAngle);

  const hipLocal = v(0, -0.28, 0.08);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(hipLocal)
      .applyQuaternion(tilt)
      .add(hipCenter);

  const gobletCenter = body(v(0, 0.08, 0.24));

  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    // Shoulder-width stance with slight outward toe flare (~15°-20°)
    const ankle = v(side * 0.21, 0.05, 0.04);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.18, 0.15, 1));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(0, 1, 0),
      side * -MathUtils.degToRad(15),
    );

    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    // Hands cupped under the top bell of the dumbbell in goblet grip, against upper chest
    const wrist = body(v(side * 0.075, 0.08, 0.23));
    // Elbows pointing down and slightly outward/forward
    const elbowPole = v(side * 0.25, -0.85, 0.35).applyQuaternion(tilt).normalize();
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      elbowPole,
    );

    const handRotation = frame(
      v(0, 1, 0).applyQuaternion(tilt),
      v(0, 0, 1).applyQuaternion(tilt),
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
