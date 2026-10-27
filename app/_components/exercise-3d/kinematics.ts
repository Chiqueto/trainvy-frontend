import { Bone, MathUtils, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const X = v(1, 0, 0);
const restTilt = new Quaternion();
const hipLocal = v(0, -0.28, 0.08);
const restOrigin = v(0, 1.142, 0);
const restWorld = (p: Vector3) =>
  p.clone().applyQuaternion(restTilt).add(restOrigin);
export const ARM_LENGTH = v(0.08, -0.284, -0.012).length();
export const FOREARM_LENGTH = v(0.025, -0.265, 0.03).length();

/** Controlled eccentric, short pause at the bottom and smooth concentric. */
export function getExerciseDepth(phase: number) {
  const cycle = ((phase % 1) + 1) % 1;
  const topPause = 0.04;
  const descent = 0.44;
  const bottomPause = 0.06;
  const ascent = 1 - topPause - descent - bottomPause;
  if (cycle < topPause) return 0;
  if (cycle < topPause + descent)
    return MathUtils.smoothstep(cycle, topPause, topPause + descent);
  if (cycle < topPause + descent + bottomPause) return 1;
  return (
    1 -
    MathUtils.smoothstep(
      cycle,
      topPause + descent + bottomPause,
      topPause + descent + bottomPause + ascent,
    )
  );
}

/** Two-bone IK with a pole vector, retaining segment lengths at every frame. */
export function solveJoint(
  start: Vector3,
  end: Vector3,
  a: number,
  b: number,
  pole: Vector3,
) {
  const axis = end.clone().sub(start);
  const distance = MathUtils.clamp(
    axis.length(),
    Math.abs(a - b) + 0.00001,
    a + b - 0.00001,
  );
  axis.normalize();
  const along = (distance * distance + a * a - b * b) / (2 * distance);
  const height = Math.sqrt(Math.max(0, a * a - along * along));
  const bend = pole.clone().addScaledVector(axis, -pole.dot(axis)).normalize();
  return start
    .clone()
    .addScaledVector(axis, along)
    .addScaledVector(bend, height);
}

export function getExercisePose(exercise: ExerciseAnimation, depth: number) {
  const p = MathUtils.clamp(depth, 0, 1);
  const squat = exercise === "squat";
  const tilt = new Quaternion().setFromAxisAngle(
    X,
    squat ? 0.1 + 0.48 * p : -Math.PI / 2,
  );
  const hipCenter = squat
    ? v(0, 0.895 - 0.38 * p, -0.03 - 0.25 * p)
    : v(0, 0.49, 0.4);
  const body = (point: Vector3) =>
    point.clone().sub(hipLocal).applyQuaternion(tilt).add(hipCenter);
  const bar = squat
    ? body(v(0, 0.245, 0.035))
    : v(0, 1.035 - 0.36 * p, -0.1 + 0.1 * p);
  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    const ankle = squat
      ? v(side * 0.2, 0.05, 0.04)
      : v(side * 0.25, 0.05, 0.83);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.12, 0.15, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const grip = bar.clone().add(v(side * (squat ? 0.39 : 0.4), 0, 0));
    const wrist = grip.clone().add(v(0, -0.004, -0.012));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      squat ? v(side, -0.7, -0.4) : v(side, -0.5, 0.7),
    );
    return { side, hip, knee, ankle, shoulder, elbow, wrist, grip };
  });
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}

export function createPoseDriver(bones: ReadonlyMap<string, Bone>) {
  const rest = new Map(
    [...bones].map(([name, bone]) => [name, bone.position.clone()]),
  );
  function segment(
    name: string,
    start: Vector3,
    end: Vector3,
    restEnd: Vector3,
  ) {
    const bone = bones.get(name)!;
    bone.position.copy(start);
    bone.quaternion.setFromUnitVectors(
      restEnd.clone().sub(rest.get(name)!).normalize(),
      end.clone().sub(start).normalize(),
    );
  }
  return (exercise: ExerciseAnimation, depth: number) => {
    const pose = getExercisePose(exercise, depth);
    const root = bones.get("sled")!;
    root.position.copy(pose.origin);
    root.quaternion.copy(pose.tilt).multiply(restTilt.clone().invert());
    for (const limb of pose.limbs) {
      const { side, hip, knee, ankle, shoulder, elbow, wrist } = limb;
      const suffix = side < 0 ? "L" : "R";
      segment(`thigh_${suffix}`, hip, knee, rest.get(`shin_${suffix}`)!);
      segment(`shin_${suffix}`, knee, ankle, rest.get(`foot_${suffix}`)!);
      const foot = bones.get(`foot_${suffix}`)!;
      foot.position.copy(ankle);
      foot.quaternion.identity();
      segment(
        `upperArm_${suffix}`,
        shoulder,
        elbow,
        restWorld(v(side * 0.295, -0.06, 0.12)),
      );
      segment(
        `forearm_${suffix}`,
        elbow,
        wrist,
        restWorld(v(side * 0.32, -0.325, 0.15)),
      );
      // A bisector joint preserves the elbow's cross-section during deep flexion.
      const elbowSupport = bones.get(`elbow_${suffix}`);
      if (elbowSupport) {
        elbowSupport.position.copy(elbow);
        elbowSupport.quaternion
          .copy(bones.get(`upperArm_${suffix}`)!.quaternion)
          .slerp(bones.get(`forearm_${suffix}`)!.quaternion, 0.5);
      }
      const hand = bones.get(`hand_${suffix}`)!;
      hand.position.copy(wrist);
      // The new hands are sculpted around the horizontal bar in their bind pose.
      hand.quaternion.identity();
    }
    return pose;
  };
}
