import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const SUMO_STANCE_HALF_WIDTH = 0.34;
export const SUMO_TOE_OUT = MathUtils.degToRad(35);
export const SUMO_HEAD_RADIUS = 0.075;
export const SUMO_HEAD_OFFSET = 0.11;
const DUMBBELL_Z = 0.26;

function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** Wide squat with a single vertical dumbbell suspended by its upper head. */
export function getSumoDumbbellPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const hipCenter = v(
    0,
    MathUtils.lerp(0.87, 0.42, p),
    MathUtils.lerp(0, -0.14, p),
  );
  const tilt = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(3 + 17 * p),
  );
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(hipCenter);
  const reach = Math.sqrt(
    ARM_LENGTH ** 2 +
      FOREARM_LENGTH ** 2 +
      2 * ARM_LENGTH * FOREARM_LENGTH * Math.cos(MathUtils.degToRad(8)),
  );
  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    const ankle = v(side * SUMO_STANCE_HALF_WIDTH, 0.05, 0.04);
    // Intersect the two bone-length spheres in the vertical toe plane. A generic
    // forward pole alone lets the wide-stance knee drift inside the planted foot.
    const toe = v(side * Math.sin(SUMO_TOE_OUT), 0, Math.cos(SUMO_TOE_OUT));
    const normal = v(Math.cos(SUMO_TOE_OUT), 0, -side * Math.sin(SUMO_TOE_OUT));
    const distanceToPlane = hip.clone().sub(ankle).dot(normal);
    const projectedHip = hip.clone().addScaledVector(normal, -distanceToPlane);
    const inPlaneThigh = Math.sqrt(0.44 ** 2 - distanceToPlane ** 2);
    const knee = solveJoint(projectedHip, ankle, inPlaneThigh, 0.42, toe);
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const wrist = v(side * 0.095, shoulder.y - reach, DUMBBELL_Z);
    const handRotation = new Quaternion();
    const handOffset = v(-side * 0.00220824, -0.00678324, 0.00986745);
    const pole = v(side * 0.2, 0, -1);
    for (let i = 0; i < 12; i++) {
      const offset = handOffset.clone().applyQuaternion(handRotation);
      wrist.x = side * 0.095 - offset.x;
      wrist.z = DUMBBELL_Z - offset.z;
      const dx = wrist.x - shoulder.x,
        dz = wrist.z - shoulder.z;
      wrist.y = shoulder.y - Math.sqrt(reach ** 2 - dx ** 2 - dz ** 2);
      const elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        pole,
      );
      handRotation
        .copy(frame(wrist.clone().sub(elbow), v(-side, 0, 0)))
        .multiply(frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert());
    }
    const elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
    const grip = wrist
      .clone()
      .add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    return {
      side,
      hip,
      knee,
      ankle,
      footRotation: new Quaternion().setFromAxisAngle(
        v(0, 1, 0),
        side * SUMO_TOE_OUT,
      ),
      shoulder,
      elbow,
      wrist,
      handRotation,
      grip,
    };
  });
  const bar = limbs
    .reduce(
      (center, l) =>
        center.add(
          l.wrist
            .clone()
            .add(
              v(-l.side * 0.00220824, -0.00678324, 0.00986745).applyQuaternion(
                l.handRotation,
              ),
            ),
        ),
      v(0, 0, 0),
    )
    .multiplyScalar(0.5)
    .add(v(0, -SUMO_HEAD_OFFSET, 0));
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
