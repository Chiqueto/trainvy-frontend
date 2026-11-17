import {
  CatmullRomCurve3,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type SkinnedMesh,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
export const HAND_GRIP_CENTER = v(0, 0.004, 0.012);
/** Original, code-authored hand surfaces. Four distinguishable flexed fingers and
 * an opposed thumb surround the shaft; left/right anatomy is mirrored explicitly.
 * Dimensions are illustrative for this avatar, not patient-specific hand kinematics.
 */
export function createGrippingHandGeometry(side: number, support = false) {
  const parts: (SphereGeometry | TubeGeometry)[] = [];
  const ellipsoid = (center: Vector3, scale: Vector3) => {
    const g = new SphereGeometry(1, 16, 12);
    g.applyMatrix4(new Matrix4().compose(center, new Quaternion(), scale));
    parts.push(g);
  };
  const tube = (points: Vector3[], radius: number) =>
    parts.push(
      new TubeGeometry(new CatmullRomCurve3(points), 24, radius, 8, false),
    );
  if (support) {
    ellipsoid(v(0, -0.027, 0.02), v(0.037, 0.036, 0.018));
    for (let finger = 0; finger < 4; finger++) {
      const x = side * (1.5 - finger) * 0.017,
        length = [0.075, 0.086, 0.079, 0.06][finger];
      tube(
        [
          v(x, -0.048, 0.031),
          v(x, -0.073, 0.032),
          v(x, -0.048 - length, 0.032),
        ],
        0.006,
      );
    }
    tube(
      [
        v(side * 0.026, -0.015, 0.025),
        v(side * 0.052, -0.038, 0.032),
        v(side * 0.054, -0.065, 0.032),
      ],
      0.008,
    );
  } else {
    ellipsoid(v(0, -0.027, -0.008), v(0.038, 0.023, 0.015));
    for (let finger = 0; finger < 4; finger++) {
      const x = side * (1.5 - finger) * 0.017;
      tube(
        [
          v(x, -0.007, -0.008),
          v(x, 0.02, -0.002),
          v(x, 0.026, 0.019),
          v(x, 0.006, 0.036),
          v(x, -0.017, 0.026),
          v(x, -0.02, 0.011),
        ],
        finger === 3 ? 0.0056 : 0.0062,
      );
      ellipsoid(v(x, 0.022, 0.006), v(0.007, 0.007, 0.007));
    }
    // Thumb is on the radial side, with its pad opposing the fingers around the shaft.
    tube(
      [
        v(side * 0.03, -0.023, -0.003),
        v(side * 0.047, -0.004, -0.012),
        v(side * 0.047, 0.03, 0.006),
        v(side * 0.037, 0.02, 0.032),
        v(side * 0.017, 0.016, 0.033),
      ],
      0.0085,
    );
  }
  const geometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  geometry.computeVertexNormals();
  return geometry;
}

/** Remove only the old neutral, rigid hand accessories from this viewer copy.
 * Keep all atlas vertices/attributes and muscle selections unchanged. Resetting
 * the index restores every original face for exercises outside this revision.
 */
export function prepareHandReplacement(mesh: SkinnedMesh) {
  const geometry = mesh.geometry,
    original = geometry.index!;
  const uv = geometry.getAttribute("uv"),
    ids = geometry.getAttribute("skinIndex"),
    weights = geometry.getAttribute("skinWeight");
  const isHand = (i: number) =>
    uv.getY(i) < 0.1 &&
    weights.getX(i) > 0.999 &&
    /^hand_[LR]$/.test(mesh.skeleton.bones[ids.getX(i)]?.name ?? "");
  const kept: number[] = [];
  for (let i = 0; i < original.count; i += 3) {
    const tri = [original.getX(i), original.getX(i + 1), original.getX(i + 2)];
    if (!tri.every(isHand)) kept.push(...tri);
  }
  if (kept.length === original.count)
    throw Error("Authored hand accessories not found");
  const backup = original.array.slice(),
    range = { ...geometry.drawRange };
  let active = false;
  return {
    setEnabled(enabled: boolean) {
      if (enabled === active) return;
      original.array.set(enabled ? kept : backup);
      original.needsUpdate = true;
      geometry.setDrawRange(
        enabled ? 0 : range.start,
        enabled ? kept.length : range.count,
      );
      active = enabled;
    },
    removedTriangles: (original.count - kept.length) / 3,
  };
}
