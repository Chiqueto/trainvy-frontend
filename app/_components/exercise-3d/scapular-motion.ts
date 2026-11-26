import { isUpperExercise } from "./upper-exercise-types";
import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";

export const PULLING_EXERCISES: readonly ExerciseAnimation[] = [
  "bent-row",
  "generic-bent-row",
  "supinated-bent-row",
  "high-bent-row",
  "high-supinated-bent-row",
  "yates-row",
  "supinated-yates-row",
  "pendlay-row",
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
  const upper=isUpperExercise(exercise), pressing=exercise === "military-press" || exercise === "dumbbell-shoulder-press", raising=exercise === "lateral-raise";
  const lift=1-p;
  if(raising){
    // Keep the acromion at a quiet shoulder height: upward rotation is not a shrug.
    // Rotating around the middle of the thorax had lifted the shoulders by ~9 cm.
    const rotation=new Quaternion().setFromEuler(new Euler(-.045*lift,-side*.035*lift,side*.38*lift,"YXZ"));
    const pivot=new Vector3(side*.215,.224,.132);
    const point=(rest:Vector3)=>rest.clone().sub(pivot).applyQuaternion(rotation).add(pivot);
    return {rotation,point};
  }
  if(upper && pressing){
    const rotation=new Quaternion().setFromEuler(new Euler(-.10*lift,-side*.07*lift,side*(.10+.58*lift),"YXZ"));
    const point=(rest:Vector3)=>rest.clone().sub(thorax).applyQuaternion(rotation).add(thorax).add(new Vector3(0,.022*lift,0));
    return {rotation,point};
  }
  if (exercise === "kneeling-push-up" || exercise === "elevated-push-up") {
    // Protraction at the top plank (p=0), gentle retraction at bottom (p=1).
    const rotation = new Quaternion().setFromEuler(
      new Euler(0, -side * MathUtils.lerp(0.08, -0.06, p), 0, "YXZ"),
    );
    const point = (rest: Vector3) =>
      rest.clone().add(new Vector3(0, 0, MathUtils.lerp(0.015, -0.012, p)));
    return { rotation, point };
  }
  if (exercise === "preacher-curl") {
    // Protract shoulders slightly forward onto the Scott pad so the torso stays clear of the bench.
    const rotation = new Quaternion().setFromEuler(
      new Euler(0, -side * 0.14, 0, "YXZ"),
    );
    const point = (rest: Vector3) =>
      rest.clone().add(new Vector3(0, 0, 0.055));
    return { rotation, point };
  }
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
