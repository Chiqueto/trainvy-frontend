import {
  Bone,
  MathUtils,
  Matrix4,
  type Quaternion,
  Skeleton,
  type SkinnedMesh,
  Vector3,
} from "three";

/** Small cervical retraction while the bar crosses face height, returning to
 * neutral as it clears the crown. Editorial avatar motion, not a clinical angle.
 */
export function getMilitaryHeadRetraction(depth: number) {
  const lift = 1 - MathUtils.clamp(depth, 0, 1);
  return (
    0.055 *
    MathUtils.smoothstep(lift, 0, 0.18) *
    (1 - MathUtils.smoothstep(lift, 0.62, 0.85))
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
  head.position.set(0, 1.54, 0.035);
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
    const blend = MathUtils.smoothstep(positions.getY(i), 1.44, 1.58);
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
        1.54 - 1.142,
        0.035 - (active ? getMilitaryHeadRetraction(depth) : 0),
      ).applyQuaternion(tilt),
    );
  head.quaternion.copy(tilt);
}
