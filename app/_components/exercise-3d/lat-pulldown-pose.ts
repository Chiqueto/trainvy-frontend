import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const PULLDOWN_HIP = v(0, 0.51, 0);
export const PULLDOWN_PULLEY = v(0, 1.94, 0.28);
export const PULLDOWN_GRIP_HALF_WIDTH = 0.3225; // 1.5 × the rig's 0.43 m shoulder span.
export const PULLDOWN_BAR_TOP = v(0, 1.51, 0.25);
export const PULLDOWN_BAR_BOTTOM = v(0, 0.995, 0.14);

function frame(direction: Vector3, shaft: Vector3) {
  const y = direction.clone().normalize();
  const z = shaft.clone().addScaledVector(y, -shaft.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}

/** p=0: contracted; p=1: controlled overhead return. Seat and feet remain fixed. */
export function getLatPulldownPose(depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), -0.12);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(PULLDOWN_HIP);
  const bar = PULLDOWN_BAR_BOTTOM.clone().lerp(PULLDOWN_BAR_TOP, p);
  const limbs = [-1, 1].map((side) => {
    const hip = PULLDOWN_HIP.clone().setX(side * 0.14);
    const ankle = v(side * 0.19, 0.05, 0.54);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(0, 1, 1));
    // Small shoulder elevation on return, with no trunk rocking or body translation.
    const shoulder = body(v(side * 0.215, 0.224 + 0.018 * p, 0.132));
    const grip = bar.clone().setX(side * PULLDOWN_GRIP_HALF_WIDTH);
    // Solve the small authored palm offset together with the elbow, rather than
    // moving the bar off the hands or forcing the wrist into an axial spin.
    let wrist = grip.clone();
    let elbow = wrist.clone();
    let handRotation = new Quaternion();
    for (let i = 0; i < 12; i++) {
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side * 0.3, -1, -0.2),
      );
      handRotation = frame(wrist.clone().sub(elbow), v(1, 0, 0)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(1, 0, 0)).invert(),
      );
      wrist = grip
        .clone()
        .sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    }
    elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      v(side * 0.3, -1, -0.2),
    );
    return {
      side,
      hip,
      knee,
      ankle,
      footRotation: new Quaternion(),
      shoulder,
      elbow,
      wrist,
      grip,
      handRotation,
    };
  });
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}

/** Illustrative 1:1 cable travel, also used by equipment and regression checks. */
export function getPulldownStackLift(bar: Vector3) {
  return (
    bar.distanceTo(PULLDOWN_PULLEY) -
    PULLDOWN_BAR_TOP.distanceTo(PULLDOWN_PULLEY)
  );
}
