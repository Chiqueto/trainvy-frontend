import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";

export const PULLING_EXERCISES: readonly ExerciseAnimation[] = [
  "bent-row",
  "generic-bent-row",
  "supinated-bent-row",
  "high-bent-row",
  "one-arm-row",
  "cable-row",
  "machine-row",
  "lat-pulldown",
  "front-lat-pulldown",
];
// Anterior thorax pivot: the medial border travels around the rib cage,
// not around the glenohumeral joint or through the spine.
const thorax = new Vector3(0, 0.18, 0.18);
/** Thorax-relative scapuloclavicular motion. Angles are illustrative, not measured kinematics.
 * The supporting side of the unilateral row stays stable; overhead return includes upward rotation.
 */
export function getScapularMotion(
  exercise: ExerciseAnimation,
  depth: number,
  side: number,
) {
  const p = MathUtils.clamp(depth, 0, 1);
  const active =
    PULLING_EXERCISES.includes(exercise) &&
    !(exercise === "one-arm-row" && side < 0);
  const overhead =
    exercise === "lat-pulldown" || exercise === "front-lat-pulldown";
  const rotation = active
    ? new Quaternion().setFromEuler(
        new Euler(
          MathUtils.lerp(-0.035, 0.025, p),
          -side * MathUtils.lerp(-0.12, overhead ? 0.1 : 0.14, p),
          side * (overhead ? MathUtils.lerp(0.04, 0.48, p) : 0.035 * (1 - p)),
          "YXZ",
        ),
      )
    : new Quaternion();
  const elevation = active && overhead ? 0.025 * p : 0;
  const point = (rest: Vector3) =>
    rest
      .clone()
      .sub(thorax)
      .applyQuaternion(rotation)
      .add(thorax)
      .add(new Vector3(0, elevation, 0));
  return { rotation, point };
}
export function getPullingShoulder(
  exercise: ExerciseAnimation,
  depth: number,
  side: number,
) {
  return getScapularMotion(exercise, depth, side).point(
    new Vector3(side * 0.215, 0.224, 0.132),
  );
}
