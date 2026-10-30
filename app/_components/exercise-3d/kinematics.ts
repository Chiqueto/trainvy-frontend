import { Bone, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const X = v(1, 0, 0);
const restTilt = new Quaternion();
const hipLocal = v(0, -0.28, 0.08);
export const ARM_LENGTH = v(0.08, -0.284, -0.012).length();
export const FOREARM_LENGTH = v(0.025, -0.265, 0.03).length();
export const INCLINE_BENCH_ANGLE = Math.PI / 6; // 30° conforme literatura biomecânica para maximizar feixe clavicular sem sobrecarga excessiva no deltoide anterior
export const DECLINE_BENCH_ANGLE = -Math.PI / 10; // Existing illustrative bench setting (-18°), not a universal optimum.
export const DECLINE_ROLLER_RADIUS = 0.055;
const DECLINE_BAR_TOP = v(0, 0.88, -0.06);
const DECLINE_BAR_BOTTOM = v(0, 0.58, 0.08);
export const SMITH_RAIL_Z = -0.035; // Posição longitudinal dos trilhos guias verticais da máquina Smith

/** Direction plus a surface normal fixes axial roll as well as segment aim. */
function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  const x = y.clone().cross(z).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

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

export function getExercisePose(
  exercise: ExerciseAnimation,
  depth: number,
): ReturnType<typeof getFlatDumbbellFlyPose> {
  if (exercise === "flat-dumbbell-fly") return getFlatDumbbellFlyPose(depth);
  const p = MathUtils.clamp(depth, 0, 1);
  const squat = exercise === "squat";
  const smithSquat = exercise === "smith-squat";
  const inclineDumbbell = exercise === "incline-dumbbell-press";
  const inclineBarbell = exercise === "incline-bench-press";
  const flatDumbbell = exercise === "flat-dumbbell-press";
  const declineBarbell = exercise === "decline-bench-press";
  const pecDeck = exercise === "pec-deck";
  const machineFly = exercise === "machine-fly";
  const machinePress = exercise === "machine-chest-press";
  const smithBarbell = exercise === "smith-bench-press";

  const benchAngle =
    inclineDumbbell || inclineBarbell
      ? INCLINE_BENCH_ANGLE
      : declineBarbell
        ? DECLINE_BENCH_ANGLE
        : 0;

  // Smith squat: coluna mais ereta permitida pela sustentação dos trilhos verticais
  const smithTilt = 0.06 + 0.16 * p;
  const tilt = new Quaternion().setFromAxisAngle(
    X,
    pecDeck || machineFly || machinePress ? 0 : squat ? 0.1 + 0.48 * p : smithSquat ? smithTilt : -Math.PI / 2 + benchAngle,
  );

  const smithOffset = v(0, 0.525, -0.045).applyQuaternion(tilt);
  const smithBar = v(0, MathUtils.lerp(1.42, 1.04, p), SMITH_RAIL_Z);

  const hipCenter = smithSquat
    ? smithBar.clone().sub(smithOffset)
    : squat
      ? v(0, 0.895 - 0.38 * p, -0.03 - 0.25 * p)
      : pecDeck || machineFly || machinePress
        ? v(0, 0.51, machinePress ? 0.04 : 0)
        : v(0, 0.49, 0.4);

  const body = (point: Vector3) =>
    point.clone().sub(hipLocal).applyQuaternion(tilt).add(hipCenter);

  const bar = smithSquat ? smithBar : squat
    ? body(v(0, 0.245, 0.035))
    : inclineBarbell
      ? v(0, MathUtils.lerp(1.26, 0.89, p), MathUtils.lerp(0.04, 0.14, p))
      : declineBarbell
        ? DECLINE_BAR_TOP.clone().lerp(DECLINE_BAR_BOTTOM, p)
        : smithBarbell
          ? v(0, MathUtils.lerp(1.035, 0.655, p), -0.035)
        : v(
            0,
            MathUtils.lerp(1.035, 0.655, p),
            MathUtils.lerp(-0.09, -0.015, p),
          );

  const limbs = [-1, 1].map((side) => {
    const hip = body(v(side * 0.14, -0.28, 0.08));
    const ankle = smithSquat
      ? v(side * 0.21, 0.05, SMITH_RAIL_Z + 0.14)
      : squat
        ? v(side * 0.2, 0.05, 0.04)
        : declineBarbell
          ? v(side * 0.16, 0.48, 1.0)
          : pecDeck || machineFly || machinePress
            ? v(side * 0.2, 0.05, 0.52)
            : v(side * 0.25, 0.05, 0.83);
    // A seated/declined leg bends above the bench. The standing pole points
    // almost along the declined hip-to-ankle axis and folds the knees underneath.
    const knee = solveJoint(
      hip,
      ankle,
      0.44,
      0.42,
      declineBarbell ? v(0, 1, 0) : v(side * 0.12, 0.15, 1),
    );
    // The feet are secured beneath the ankle rollers, not planted on the floor.
    // Keep the sole approximately perpendicular to the shins (neutral ankle).
    const footRotation = new Quaternion().setFromAxisAngle(
      X,
      declineBarbell ? Math.atan2(knee.z - ankle.z, knee.y - ankle.y) : 0,
    );
    const shoulder = body(v(side * 0.215, 0.224, 0.132));

    let wrist: Vector3;
    let grip: Vector3;
    let elbow: Vector3;
    const handRotation = new Quaternion();

    if (machinePress) {
      // Seated converging machine chest press:
      // Controlled horizontal pressing trajectory in the scapular plane (~45-60° flare).
      // Hands track the handles from deep stretch (p=1) to forward extension (p=0).
      grip = v(
        side * MathUtils.lerp(0.25, 0.33, p),
        MathUtils.lerp(0.99, 0.96, p),
        MathUtils.lerp(0.60, 0.25, p),
      );
      handRotation.setFromAxisAngle(X, Math.PI / 2);
      wrist = grip.clone().sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
      const pole = v(side * 0.65, -0.7, -0.1).normalize();
      elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
    } else if (machineFly) {
      // Fixed 20° flexion in a slightly downward elbow plane. The elbow sits
      // about 5 cm below the shoulder while the hands remain at chest height.
      const angle = MathUtils.degToRad(MathUtils.lerp(-20, 62, p));
      const halfBend = MathUtils.degToRad(10);
      const radial = v(side * Math.sin(angle), 0, Math.cos(angle));
      const upper = radial.clone().multiplyScalar(Math.cos(halfBend)).add(v(0, -Math.sin(halfBend), 0));
      const forearm = radial.clone().multiplyScalar(Math.cos(halfBend)).add(v(0, Math.sin(halfBend), 0));
      elbow = shoulder.clone().addScaledVector(upper, ARM_LENGTH);
      wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
      // Use the actual bind forearm, rather than treating +Y as its long axis.
      // One frame for forearm, wrist support and grip prevents a distal twist.
      const palm = v(-side * radial.z, 0, side * radial.x);
      handRotation.copy(frame(forearm, palm)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert(),
      );
      grip = wrist.clone().add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    } else if (pecDeck) {
      // Horizontal adduction on a seated forearm-pad machine. The elbows keep
      // their flexion; this is neither a bench press nor a dumbbell fly.
      const angle = MathUtils.degToRad(MathUtils.lerp(-25, 78, p));
      const upperDirection = v(
        side * Math.sin(angle),
        -0.035,
        Math.cos(angle),
      ).normalize();
      elbow = shoulder.clone().addScaledVector(upperDirection, ARM_LENGTH);
      const forearmDirection = v(0, 1, 0)
        .addScaledVector(upperDirection, -upperDirection.y)
        .normalize();
      wrist = elbow.clone().addScaledVector(forearmDirection, FOREARM_LENGTH);
      handRotation.setFromAxisAngle(v(0, 0, 1), (-side * Math.PI) / 2);
      grip = wrist
        .clone()
        .add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    } else if (squat || smithSquat) {
      grip = bar.clone().add(v(side * 0.39, 0, 0));
      wrist = grip.clone().add(v(0, -0.004, -0.012));
      elbow = solveJoint(
        shoulder,
        wrist,
        ARM_LENGTH,
        FOREARM_LENGTH,
        v(side, -0.7, -0.4),
      );
    } else if (declineBarbell) {
      // Lower sternum, footward of the shoulders. The old negative-Z path
      // lowered beside the head. Keep the elbows in the bottom stacking plane.
      grip = bar.clone().add(v(side * 0.45, 0, 0));
      wrist = grip.clone().add(v(0, -0.004, -0.012));
      const bottomWrist = DECLINE_BAR_BOTTOM.clone().add(v(side * 0.45, -0.004, -0.012));
      const bottomElbow = bottomWrist.clone().add(v(0, -FOREARM_LENGTH, 0));
      elbow = solveJoint(
        shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH,
        bottomElbow.sub(shoulder),
      );
    } else if (flatDumbbell) {
      // Supino reto com halteres:
      // O peso é sustentado verticalmente pelo antebraço (sem momento de flexão no tríceps).
      // Na subida concêntrica, o peitoral maior aduz os cotovelos aproximando-os em direção ao centro
      // sem colisão entre membros e sem fechar as cargas no topo.
      const armDir = v(
        side * MathUtils.lerp(0.07, 0.19, p),
        MathUtils.lerp(0.28, -0.14, p),
        MathUtils.lerp(0.06, 0.14, p),
      ).normalize();
      elbow = shoulder.clone().addScaledVector(armDir, ARM_LENGTH);
      wrist = elbow.clone().add(v(0, FOREARM_LENGTH, 0));
      grip = wrist.clone().add(v(0, 0.004, 0.012));
    } else if (inclineDumbbell) {
      // Supino inclinado com halteres:
      // O feixe clavicular aduz os cotovelos na subida convergente suave.
      // O peso permanece perfeitamente apoiado sobre o antebraço vertical.
      const armDir = v(
        side * MathUtils.lerp(0.08, 0.2, p),
        MathUtils.lerp(0.27, -0.1, p),
        MathUtils.lerp(0.12, 0.2, p),
      ).normalize();
      elbow = shoulder.clone().addScaledVector(armDir, ARM_LENGTH);
      wrist = elbow.clone().add(v(0, FOREARM_LENGTH, 0));
      grip = wrist.clone().add(v(0, 0.004, 0.012));
    } else {
      // Supinos com barra olímpica:
      // A pegada na barra é calibrada para que, no fundo do movimento (p=1),
      // o antebraço fique vertical diretamente sob a barra, sustentando a carga
      // por meio da estrutura óssea e direcionando o torque para o peitoral maior.
      const gripX =
        side * (inclineBarbell ? 0.42 : 0.45);
      grip = bar.clone().add(v(gripX, 0, 0));
      wrist = grip.clone().add(v(0, -0.004, -0.012));

      const bottomPole = v(
        side * (inclineBarbell ? 0.05 : smithBarbell ? 0.05 : 0.0),
        -0.95,
        inclineBarbell ? -0.05 : -0.05,
      );
      const topPole = inclineBarbell
        ? v(side * 0.25, -0.8, -0.4)
        : v(side * 0.25, -0.85, 0.15);
      const pole = topPole.clone().lerp(bottomPole, p).normalize();
      elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
    }

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
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}

/** Derive equipment contacts from the same fixed leg pose used by the athlete. */
export function getDeclineLegSupports() {
  const { knee, ankle, footRotation } = getExercisePose(
    "decline-bench-press",
    0,
  ).limbs[0];
  const footUp = v(0, 1, 0).applyQuaternion(footRotation);
  const footForward = v(0, 0, 1).applyQuaternion(footRotation);
  return {
    kneeRoller: knee
      .clone()
      .setX(0)
      .add(v(0, -0.085, -0.01)),
    ankleRoller: ankle
      .clone()
      .setX(0)
      .addScaledVector(footUp, DECLINE_ROLLER_RADIUS + 0.035)
      .addScaledVector(footForward, 0.035),
  };
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
  function orientedSegment(
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
      const { side, hip, knee, ankle, footRotation, shoulder, elbow, wrist } =
        limb;
      const suffix = side < 0 ? "L" : "R";
      if (exercise === "decline-bench-press" || exercise === "pec-deck" || exercise === "machine-fly" || exercise === "machine-chest-press") {
        const restHip = rest.get(`thigh_${suffix}`)!;
        const restKnee = rest.get(`shin_${suffix}`)!;
        const restAnkle = rest.get(`foot_${suffix}`)!;
        const restNormal = restKnee
          .clone()
          .sub(restHip)
          .cross(restAnkle.clone().sub(restKnee))
          .normalize();
        const posedNormal = knee
          .clone()
          .sub(hip)
          .cross(ankle.clone().sub(knee))
          .normalize();
        // Preserve the anatomical knee plane as well as the segment direction;
        // a shortest-arc rotation alone leaves the thigh/shin's roll undefined.
        orientedSegment(
          `thigh_${suffix}`,
          hip,
          knee,
          restKnee,
          restNormal,
          posedNormal,
        );
        orientedSegment(
          `shin_${suffix}`,
          knee,
          ankle,
          restAnkle,
          restNormal,
          posedNormal,
        );
      } else {
        segment(`thigh_${suffix}`, hip, knee, rest.get(`shin_${suffix}`)!);
        segment(`shin_${suffix}`, knee, ankle, rest.get(`foot_${suffix}`)!);
      }
      const hipSupport = bones.get(`hip_${suffix}`);
      if (hipSupport) {
        hipSupport.position.copy(hip);
        hipSupport.quaternion
          .copy(root.quaternion)
          .slerp(bones.get(`thigh_${suffix}`)!.quaternion, 0.5);
      }
      const foot = bones.get(`foot_${suffix}`)!;
      foot.position.copy(ankle);
      foot.quaternion.copy(footRotation);
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
      orientedSegment(
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
        if (exercise === "flat-dumbbell-fly" || exercise === "machine-chest-press") {
          wristSupport.quaternion.copy(limb.handRotation);
        }
      }
      orientedSegment(
        `forearm_${suffix}`,
        elbow,
        wrist,
        restWrist,
        restNormal,
        posedNormal,
      );
      if (exercise === "machine-fly") {
        bones.get(`forearm_${suffix}`)!.quaternion.copy(limb.handRotation);
        wristSupport?.quaternion.copy(limb.handRotation);
      }
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
      hand.quaternion.copy(limb.handRotation);
    }
    return pose;
  };
}

/** Flat dumbbell fly trajectory: constant elbow flexion with shoulder-driven arc. */
export function getFlatDumbbellFlyPose(depth: number): {
  origin: Vector3;
  tilt: Quaternion;
  bar: Vector3;
  limbs: {
    side: number;
    hip: Vector3;
    knee: Vector3;
    ankle: Vector3;
    footRotation: Quaternion;
    shoulder: Vector3;
    elbow: Vector3;
    wrist: Vector3;
    grip: Vector3;
    handRotation: Quaternion;
  }[];
} {
  const p = MathUtils.clamp(depth, 0, 1);
  const base = getExercisePose("flat-dumbbell-press", p);
  const angle = MathUtils.degToRad(MathUtils.lerp(10, 76, p));
  const bend = MathUtils.degToRad(20);
  const limbs = base.limbs.map((limb) => {
    const { side, shoulder } = limb;
    const upper = v(side * Math.sin(angle), Math.cos(angle), 0);
    const forearm = v(side * Math.sin(angle - bend), Math.cos(angle - bend), 0);
    const elbow = shoulder.clone().addScaledVector(upper, ARM_LENGTH);
    const wrist = elbow.clone().addScaledVector(forearm, FOREARM_LENGTH);
    // Neutral grip follows the arc: palms face each other above the chest
    // and face upward as the arms open. The authored palm faces local +Z.
    const palmNormal = v(-side * forearm.y, side * forearm.x, 0);
    const gripAxis = forearm.clone().cross(palmNormal).normalize();
    const handRotation = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(gripAxis, forearm, palmNormal),
    );
    const grip = wrist.clone().add(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    return { ...limb, elbow, wrist, grip, handRotation };
  });
  return { ...base, limbs };
}
