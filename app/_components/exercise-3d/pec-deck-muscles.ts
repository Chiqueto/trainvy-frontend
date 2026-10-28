import { BufferAttribute, type BufferGeometry } from "three";

/** Explicit map for the seated forearm-pad pec deck on the current bind-pose
 * athlete. Reuse the authored pectoralis surface partition, but remove the press's
 * triceps map. The anterior deltoid occupies the anterior proximal humeral cap;
 * these bind coordinates are mesh boundaries, not measured activation values. */
export function createPecDeckMuscleMask(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const tissue = geometry.getAttribute("uv");
  const groups = geometry.getAttribute("_exercisemuscles");
  const values = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    if (tissue.getY(i) < 0.9) continue;
    if (groups.getY(i) > 0.72) values[i] = 1;
    else if (
      groups.getY(i) > 0.15 &&
      position.getY(i) > 1.24 &&
      position.getZ(i) > 0.145
    )
      values[i] = 0.45;
  }
  return new BufferAttribute(values, 1);
}
