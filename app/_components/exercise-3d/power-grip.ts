import { Matrix4, Quaternion, Vector3 } from "three";
import type { ExerciseAnimation } from "./exercises";
import { PULLING_EXERCISES } from "./scapular-motion";

/** Palm faces local +Z, fingers curl around local X, radial/thumb side is ±X.
 * Hardware fixes the cylinder axis; the hand is allowed slight wrist deviation
 * instead of tipping the bar/triangle to match the forearm's bind-pose axis.
 */
export function getPowerGripRotation(
  forearm: Vector3,
  shaft: Vector3,
  radialSign: number,
) {
  const x = shaft.clone().normalize().multiplyScalar(radialSign);
  const y = forearm
    .clone()
    .negate()
    .addScaledVector(x, forearm.dot(x))
    .normalize();
  const z = x.clone().cross(y).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(x, y, z),
  );
}
export function usesPowerGrip(exercise: ExerciseAnimation, side: number) {
  return (
    PULLING_EXERCISES.includes(exercise) &&
    !(exercise === "one-arm-row" && side < 0)
  );
}
