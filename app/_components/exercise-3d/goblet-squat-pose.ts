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

/** Front-loaded goblet squat: upright torso (~74° to horizontal), dumbbell cupped at upper chest, knees tracking toes. */
export function getGobletSquatPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const hipCenter = v(
    0,
    MathUtils.lerp(0.88, 0.48, p),
    MathUtils.lerp(-0.01, -0.18, p),
  );
  // Upright torso: anterior load counterbalances the hips, keeping trunk inclination modest (~16° at bottom)
  const tiltAngle = MathUtils.degToRad(MathUtils.lerp(2, 16, p));
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), tiltAngle);

  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(hipCenter);

  const gobletCenter = body(v(0, 0.08, 0.24));

  const limbs = [-1, 1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14);
    // Shoulder-width stance with slight outward toe flare (~20°)
    const ankle = v(side * 0.22, 0.05, 0.02);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.45, 0.2, 1));
    const footRotation = new Quaternion().setFromAxisAngle(
      v(0, 1, 0),
      side * -MathUtils.degToRad(20),
    );

    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    // Hands cupped under the upper bell of the dumbbell in goblet grip
    const wrist = body(v(side * 0.065, 0.09, 0.24));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      body(v(side * 0.14, -0.25, 0.18)),
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
      handRotation,
      grip,
    };
  });

  return {
    bar: gobletCenter,
    limbs,
    origin: hipCenter,
    tilt,
  };
}
