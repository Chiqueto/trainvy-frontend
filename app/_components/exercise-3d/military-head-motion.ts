import {
  Bone,
  MathUtils,
  Matrix4,
  Quaternion,
  Skeleton,
  type SkinnedMesh,
  Vector3,
} from "three";

const HEAD_PIVOT = new Vector3(0, 1.49, 0.103);
const CERVICAL_BASE = new Vector3(0, 1.41, 0.095);
function headClearanceWindow(depth: number) {
  const lift = 1 - MathUtils.clamp(depth, 0, 1);
  return (
    MathUtils.smoothstep(lift, 0, 0.22) *
    (1 - MathUtils.smoothstep(lift, 0.44, 0.78))
  );
}

/** Gentle cervical retraction and extension around the lower neck while the
 * bar passes the face, returning smoothly to neutral overhead ("head through").
 */
export function getMilitaryHeadRetraction(depth: number) {
  return 0.025 * headClearanceWindow(depth);
}

export function getMilitaryHeadRotation(depth: number) {
  return new Quaternion().setFromAxisAngle(
    new Vector3(1, 0, 0),
    MathUtils.degToRad(-10) * headClearanceWindow(depth),
  );
}

/** Add a viewer-local cervical control. Keep every source vertex, colour, UV,
 * topology and all existing articulated weights. The neck transition is smooth.
 * Neutral motion preserves the exact source geometry for all other exercises.
 */
export function installMilitaryHeadRig(
  mesh: SkinnedMesh,
  bones: Map<string, Bone>,
) {
  if (bones.has("military_head")) throw Error("Head control already installed");
  const root = bones.get("sled")!,
    old = mesh.skeleton,
    head = new Bone();
  head.name = "military_head";
  head.position.copy(HEAD_PIVOT);
  root.parent!.add(head);
  head.updateMatrixWorld(true);
  bones.set(head.name, head);
  const skeleton = new Skeleton(
    [...old.bones, head],
    [
      ...old.boneInverses.map((m) => m.clone()),
      new Matrix4().copy(head.matrixWorld).invert(),
    ],
  );
  mesh.bind(skeleton, mesh.bindMatrix.clone());
  const positions = mesh.geometry.getAttribute("position"),
    ids = mesh.geometry.getAttribute("skinIndex"),
    weights = mesh.geometry.getAttribute("skinWeight"),
    rootIndex = old.bones.indexOf(root);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    if (Math.abs(x) > 0.08 && y < 1.48) continue;
    if (Math.abs(x) > 0.15) continue;
    // Every point of the fitted head (cut at y=1.49) receives one rigid transform.
    // The cervical transition below that cut bends smoothly from C7 (y=1.41).
    const blend = MathUtils.smoothstep(y, CERVICAL_BASE.y, HEAD_PIVOT.y);
    if (!blend) continue;
    const js = [0, 1, 2, 3],
      source = js.find(
        (j) =>
          ids.getComponent(i, j) === rootIndex &&
          weights.getComponent(i, j) > 0,
      );
    if (source === undefined) continue;
    const target = js.find(
      (j) => j !== source && weights.getComponent(i, j) === 0,
    );
    if (target === undefined) continue;
    const amount = weights.getComponent(i, source) * blend;
    ids.setComponent(i, target, old.bones.length);
    weights.setComponent(i, target, amount);
    weights.setComponent(i, source, weights.getComponent(i, source) - amount);
  }
  ids.needsUpdate = weights.needsUpdate = true;
  return skeleton;
}

export function updateMilitaryHead(
  bones: ReadonlyMap<string, Bone>,
  origin: Vector3,
  tilt: Quaternion,
  depth: number,
  active: boolean,
) {
  const head = bones.get("military_head");
  if (!head) return;
  const headRotation = active ? getMilitaryHeadRotation(depth) : new Quaternion();
  const pivot = HEAD_PIVOT.clone()
    .sub(CERVICAL_BASE)
    .applyQuaternion(headRotation)
    .add(CERVICAL_BASE);
  // The source root is fixed at y=1.142, z=0 in the GLB.
  head.position
    .copy(origin)
    .add(
      new Vector3(
        0,
        pivot.y - 1.142,
        pivot.z - (active ? getMilitaryHeadRetraction(depth) : 0),
      ).applyQuaternion(tilt),
    );
  head.quaternion.copy(tilt).multiply(headRotation);
}
