import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { ARM_LENGTH, FOREARM_LENGTH, solveJoint } from "./kinematics";
import { getDeadliftPose } from "./deadlift-pose";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
function frame(direction: Vector3, normal: Vector3) {
  const y = direction.clone().normalize(),
    z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z),
  );
}
export const HANG_CLEAN_PHASES = [
  [0, "Barra suspensa"],
  [0.08, "Preparação acima dos joelhos"],
  [0.28, "Posição de hang"],
  [0.32, "Extensão explosiva"],
  [0.37, "Giro dos cotovelos"],
  [0.43, "Recepção em agachamento parcial"],
  [0.48, "Recuperação em pé"],
  [0.62, "Barra apoiada nos ombros"],
  [0.68, "Retorno controlado"],
  [0.92, "Barra suspensa"],
] as const;
export function getHangPowerCleanPhaseLabel(phase: number) {
  const p = MathUtils.clamp(phase, 0, 1);
  return [...HANG_CLEAN_PHASES].reverse().find(([at]) => p >= at)![1];
}

/** A full cycle, not a squat-style depth: hang, extension, turnover, power catch, recovery, reset. */
export function getHangPowerCleanPose(phase: number) {
  const p = MathUtils.clamp(phase, 0, 1);
  if (p <= 0.32) {
    const depth = 0.34 * MathUtils.smoothstep(p, 0.08, 0.28);
    return getDeadliftPose(depth);
  }
  const hang = getDeadliftPose(0.34),
    top = getDeadliftPose(0);
  const rack = (hipY: number, hipZ: number, angle: number) =>
    v(0, 0.55, 0.12)
      .applyAxisAngle(v(1, 0, 0), angle)
      .add(v(0, hipY, hipZ));
  const catchBar = rack(0.76, -0.1, 0.08),
    standingBar = rack(0.9, 0.08, 0);
  // time, hipY, hipZ, trunk pitch, barY, barZ, foot pitch, half stance, flight height, rack
  const keys = [
    [
      0.32,
      hang.limbs[0].hip.y,
      hang.limbs[0].hip.z,
      2 * Math.atan2(hang.tilt.x, hang.tilt.w),
      hang.bar.y,
      hang.bar.z,
      0,
      0.14,
      0,
      0,
    ],
    [0.37, 0.94, 0.08, 0, 0.9, 0.25, 20, 0.14, 0, 0],
    [0.395, 0.89, 0.03, 0, 1.29, 0.31, 4, 0.17, 0.015, 0.25],
    [0.43, 0.76, -0.1, 0.08, catchBar.y, catchBar.z, 0, 0.2, 0, 1],
    [0.48, 0.76, -0.1, 0.08, catchBar.y, catchBar.z, 0, 0.2, 0, 1],
    [0.62, 0.9, 0.08, 0, standingBar.y, standingBar.z, 0, 0.2, 0, 1],
    [0.68, 0.9, 0.08, 0, standingBar.y, standingBar.z, 0, 0.2, 0, 1],
    [0.82, 0.88, 0.04, 0.05, 1.0, 0.34, 0, 0.2, 0, 0],
    [
      0.92,
      top.limbs[0].hip.y,
      top.limbs[0].hip.z,
      2 * Math.atan2(top.tilt.x, top.tilt.w),
      top.bar.y,
      top.bar.z,
      0,
      0.14,
      0,
      0,
    ],
    [
      1,
      top.limbs[0].hip.y,
      top.limbs[0].hip.z,
      2 * Math.atan2(top.tilt.x, top.tilt.w),
      top.bar.y,
      top.bar.z,
      0,
      0.14,
      0,
      0,
    ],
  ];
  const end = keys.findIndex((k) => k[0] >= p),
    a = keys[Math.max(0, end - 1)],
    b = keys[Math.max(0, end)];
  const t = a === b ? 0 : MathUtils.smoothstep(p, a[0], b[0]);
  const k = a.map((n, i) => MathUtils.lerp(n, b[i], t));
  const hipCenter = v(0, k[1], k[2]),
    tilt = new Quaternion().setFromAxisAngle(v(1, 0, 0), k[3]);
  const body = (point: Vector3) =>
    point
      .clone()
      .sub(v(0, -0.28, 0.08))
      .applyQuaternion(tilt)
      .add(hipCenter);
  const bar = v(0, k[4], k[5]);
  // The bar reaches its apex while the lifter turns under it, then settles on the shoulders.
  if (p > 0.395 && p < 0.43)
    bar.y += 0.08 * Math.sin((Math.PI * (p - 0.395)) / 0.035);
  const footRotation = new Quaternion().setFromAxisAngle(
    v(1, 0, 0),
    MathUtils.degToRad(k[6]),
  );
  const ankleCenter = v(0, 0, 0.24)
    .sub(v(0, -0.05, 0.16).applyQuaternion(footRotation))
    .add(v(0, k[8], 0));
  // A small unloaded-foot reposition avoids dragging planted soles during the reset.
  if(p>.82&&p<.92)ankleCenter.y+=.02*Math.sin(Math.PI*(p-.82)/.10);
  const limbs = [-1].map((side) => {
    const hip = hipCenter.clone().setX(side * 0.14),
      ankle = ankleCenter.clone().setX(side * k[7]);
    const knee = solveJoint(hip, ankle, 0.44, 0.42, v(side * 0.1, 0, 1));
    const shoulder = body(v(side * 0.215, 0.224, 0.132));
    const grip = bar.clone().setX(side * 0.29);
    let handRotation = new Quaternion(),
      wrist = grip.clone(),
      elbow = shoulder.clone();
    const pole = v(
      side * MathUtils.lerp(0.4, 0.05, k[9]),
      MathUtils.lerp(0, 0.16, k[9]),
      MathUtils.lerp(-1, 1, k[9]),
    );
    for (let i = 0; i < 12; i++) {
      wrist = grip
        .clone()
        .sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
      const reach = ARM_LENGTH + FOREARM_LENGTH - 0.0001;
      if (shoulder.distanceTo(wrist) > reach) {
        const delta =
          shoulder.y -
          Math.sqrt(
            Math.max(
              0,
              reach * reach -
                (wrist.x - shoulder.x) ** 2 -
                (wrist.z - shoulder.z) ** 2,
            ),
          ) -
          wrist.y;
        bar.y += Math.max(0, delta);
        grip.y = bar.y;
        wrist.y += Math.max(0, delta);
      }
      elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
      handRotation = frame(wrist.clone().sub(elbow), v(0, 0, 1)).multiply(
        frame(v(side * 0.025, -0.265, 0.03), v(0, 0, 1)).invert(),
      );
    }
    // Closed grip stays on the shaft; wrist orientation follows the forearm through turnover.
    wrist = grip.clone().sub(v(0, 0.004, 0.012).applyQuaternion(handRotation));
    elbow = solveJoint(shoulder, wrist, ARM_LENGTH, FOREARM_LENGTH, pole);
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
  const left = limbs[0],
    mirror = (point: Vector3) => point.clone().setX(-point.x);
  limbs.push({
    ...left,
    side: 1,
    hip: mirror(left.hip),
    knee: mirror(left.knee),
    ankle: mirror(left.ankle),
    shoulder: mirror(left.shoulder),
    elbow: mirror(left.elbow),
    wrist: mirror(left.wrist),
    grip: mirror(left.grip),
    handRotation: new Quaternion(
      left.handRotation.x,
      -left.handRotation.y,
      -left.handRotation.z,
      left.handRotation.w,
    ),
  });
  return { origin: body(v(0, 0, 0)), tilt, bar, limbs };
}
