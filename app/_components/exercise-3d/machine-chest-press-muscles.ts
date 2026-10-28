import { BufferAttribute, type BufferGeometry } from "three";

/** Explicit anatomical muscle map for the seated machine chest press.
 * Primary mover: Pectoralis major (sternocostal and clavicular heads) -> 1.0 (primaryTissue).
 * Synergists / Secondary muscles: Triceps brachii (elbow extension) and Anterior deltoid
 * (shoulder flexion and horizontal adduction) -> 0.45 (secondaryTissue).
 * All other tissues (back, legs, core, neck, biceps) remain neutral -> 0.0 (neutralTissue). */
export function createMachineChestPressMuscleMask(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const tissue = geometry.getAttribute("uv");
  const groups = geometry.getAttribute("_exercisemuscles");
  const values = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    if (tissue.getY(i) < 0.9) continue;
    // Bound upper torso and arms, keeping lower body and head strictly neutral
    const y = position.getY(i);
    if (y < 0.98 || y > 1.49) continue;

    if (groups.getY(i) > 0.72) {
      // Primary: Pectoralis major
      values[i] = 1.0;
    } else if (groups.getY(i) > 0.15) {
      // Synergists: Triceps brachii and Anterior deltoid
      values[i] = 0.45;
    }
  }
  return new BufferAttribute(values, 1);
}
