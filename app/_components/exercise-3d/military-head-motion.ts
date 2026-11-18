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
function headClearanceWindow(depth: number) {
  const lift = 1 - MathUtils.clamp(depth, 0, 1);
  return (
    MathUtils.smoothstep(lift, 0, 0.1) *
    (1 - MathUtils.smoothstep(lift, 0.5, 0.74))
  );
}

/** Small cervical retraction while the bar crosses face height, returning to
 * neutral as it clears the crown. Editorial avatar motion, not a clinical angle.
 */
export function getMilitaryHeadRetraction(depth: number) {
  return 0.045 * headClearanceWindow(depth);
}

export function getMilitaryHeadRotation(depth: number) {
  return new Quaternion().setFromAxisAngle(
    new Vector3(1, 0, 0),
    MathUtils.degToRad(2) * headClearanceWindow(depth),
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
    if (Math.abs(positions.getX(i)) > 0.15) continue;
    // Every point of the fitted head (cut at y=1.49) receives one rigid transform.
    // Only the cervical transition BELOW that cut may blend with the torso.
    const blend = MathUtils.smoothstep(positions.getY(i), 1.43, HEAD_PIVOT.y);
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
  // The source root is fixed at y=1.142, z=0 in the GLB.
  head.position
    .copy(origin)
    .add(
      new Vector3(
        0,
        HEAD_PIVOT.y - 1.142,
        HEAD_PIVOT.z - (active ? getMilitaryHeadRetraction(depth) : 0),
      ).applyQuaternion(tilt),
    );
  head.quaternion.copy(tilt);
  if (active) head.quaternion.multiply(getMilitaryHeadRotation(depth));
}
