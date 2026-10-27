import { Bone, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const X = v(1, 0, 0);
const restTilt = new Quaternion();
const hipLocal = v(0, -0.28, 0.08);
export const ARM_LENGTH = v(0.08, -0.284, -0.012).length();
export const FOREARM_LENGTH = v(0.025, -0.265, 0.03).length();
export const INCLINE_BENCH_ANGLE = Math.PI / 4;

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
  const incline = exercise === "incline-dumbbell-press";
  const tilt = new Quaternion().setFromAxisAngle(
    X,
    squat ? 0.1 + 0.48 * p : -Math.PI / 2 + (incline ? INCLINE_BENCH_ANGLE : 0),
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
    // Each dumbbell follows its own converging path. At the bottom the
    // forearms stay close to vertical; at the top the weights remain separated.
    const grip = incline
      ? shoulder
          .clone()
          .add(
            v(
              side * MathUtils.lerp(-0.025, 0.24, p),
              MathUtils.lerp(0.526, 0.046, p),
              MathUtils.lerp(0.012, 0.102, p),
            ),
          )
      : bar.clone().add(v(side * (squat ? 0.39 : 0.4), 0, 0));
    const wrist = grip.clone().add(v(0, -0.004, -0.012));
    const elbow = solveJoint(
      shoulder,
      wrist,
      ARM_LENGTH,
      FOREARM_LENGTH,
      squat
        ? v(side, -0.7, -0.4)
        : incline
          ? v(side, -0.6, 0.45)
          : v(side, -0.5, 0.7),
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
  // A direction alone leaves roll undefined. Use the same anatomical bend
  // plane for both arm segments, including at the extremes of the repetition.
  function frame(direction: Vector3, bendNormal: Vector3) {
    const y = direction.clone().normalize();
    const z = bendNormal
      .clone()
      .addScaledVector(y, -bendNormal.dot(y))
      .normalize();
    const x = y.clone().cross(z).normalize();
    return new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(x, y, z),
    );
  }
  function armSegment(
    name: string,
    start: Vector3,
    end: Vector3,
    restEnd: Vector3,
    restNormal: Vector3,
    posedNormal: Vector3,
  ) {
    const bone = bones.get(name)!;
    bone.position.copy(start);
    bone.quaternion
      .copy(frame(end.clone().sub(start), posedNormal))
      .multiply(
        frame(restEnd.clone().sub(rest.get(name)!), restNormal).invert(),
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
      const hipSupport = bones.get(`hip_${suffix}`);
      if (hipSupport) {
        hipSupport.position.copy(hip);
        hipSupport.quaternion
          .copy(root.quaternion)
          .slerp(bones.get(`thigh_${suffix}`)!.quaternion, 0.5);
      }
      const foot = bones.get(`foot_${suffix}`)!;
      foot.position.copy(ankle);
      foot.quaternion.identity();
      const restShoulder = rest.get(`upperArm_${suffix}`)!;
      const restElbow = rest.get(`forearm_${suffix}`)!;
      const restWrist = rest.get(`hand_${suffix}`)!;
      // The almost straight A-pose is not an anatomical elbow bend. Its small
      // lateral offset must not introduce an axial roll into every muscle.
      const restNormal = restElbow
        .clone()
        .sub(restShoulder)
        .cross(v(0, 0, 1))
        .normalize();
      const posedNormal = elbow
        .clone()
        .sub(shoulder)
        .cross(wrist.clone().sub(elbow))
        .normalize();
      armSegment(
        `upperArm_${suffix}`,
        shoulder,
        elbow,
        restElbow,
        restNormal,
        posedNormal,
      );
      // Pronation belongs in the forearm. Stabilise the distal radius/ulna
      // against the horizontal grip, rather than rotating the closed hand.
      const wristSupport = bones.get(`wrist_${suffix}`);
      if (wristSupport) {
        wristSupport.position.copy(elbow).lerp(wrist, 0.72);
        wristSupport.quaternion
          .copy(frame(wrist.clone().sub(elbow), v(side, 0, 0)))
          .multiply(
            frame(restWrist.clone().sub(restElbow), v(side, 0, 0)).invert(),
          );
      }
      armSegment(
        `forearm_${suffix}`,
        elbow,
        wrist,
        restWrist,
        restNormal,
        posedNormal,
      );
      const shoulderSupport = bones.get(`shoulder_${suffix}`);
      if (shoulderSupport) {
        shoulderSupport.position.copy(shoulder);
        shoulderSupport.quaternion
          .copy(root.quaternion)
          .slerp(bones.get(`upperArm_${suffix}`)!.quaternion, 0.5);
      }
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
