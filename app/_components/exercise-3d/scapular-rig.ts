import {
  Bone,
  Matrix4,
  Skeleton,
  type SkinnedMesh,
  Vector3,
  MathUtils,
} from "three";
import back from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import chest from "./fly-muscle-map.json";
import scapular from "./scapular-detail-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Add independent scapular controls without changing the licensed atlas topology.
 * Only the original thorax weight is redistributed: limb weights and medial attachments survive.
 * All new controls follow the thorax identically outside pulling exercises.
 */
export function installScapularRig(
  mesh: SkinnedMesh,
  bones: Map<string, Bone>,
) {
  if (bones.has("scapula_L")) throw Error("Scapular rig already installed");
  const root = bones.get("sled")!,
    old = mesh.skeleton;
  const added = [-1, 1].map((side) => {
    const bone = new Bone();
    bone.name = side < 0 ? "scapula_L" : "scapula_R";
    bone.position
      .copy(root.position)
      .add(new Vector3(side * 0.13, 0.16, 0.035));
    root.parent!.add(bone);
    bone.updateMatrixWorld(true);
    bones.set(bone.name, bone);
    return bone;
  });
  const skeleton = new Skeleton(
    [...old.bones, ...added],
    [
      ...old.boneInverses.map((m) => m.clone()),
      ...added.map((b) => new Matrix4().copy(b.matrixWorld).invert()),
    ],
  );
  mesh.bind(skeleton, mesh.bindMatrix.clone());
  const pos = mesh.geometry.getAttribute("position"),
    index = mesh.geometry.getAttribute("skinIndex"),
    weight = mesh.geometry.getAttribute("skinWeight");
  const influence = new Float32Array(pos.count);
  for (const atlas of [back, detail, chest, scapular]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("Scapular atlas mismatch");
    for (const selection of atlas.selections) {
      if (
        !/trapezius|Rhomboid|Infraspinatus|Teres_major|Latissimus|deltoid|pectoralis|Serratus_anterior/.test(
          selection.name,
        )
      )
        continue;
      for (const i of selection.indices) {
        const x = Math.abs(pos.getX(i));
        // Preserve spinal origins; lateral cuff follows the scapula, pec/lat preserve broad origins.
        const amount = /Rhomboid|trapezius/.test(selection.name)
          ? MathUtils.smoothstep(x, 0.025, 0.16)
          : /Latissimus|pectoralis|Serratus_anterior/.test(selection.name)
            ? MathUtils.smoothstep(pos.getY(i), 1.18, 1.38) *
              MathUtils.smoothstep(x, 0.05, 0.19)
            : 1;
        influence[i] = Math.max(influence[i], amount);
      }
    }
  }
  const rootIndex = old.bones.indexOf(root);
  for (let i = 0; i < pos.count; i++) {
    const amount = influence[i];
    if (!amount) continue;
    const ids = [0, 1, 2, 3].map((j) => index.getComponent(i, j)),
      ws = [0, 1, 2, 3].map((j) => weight.getComponent(i, j));
    const source = ids.findIndex((id, j) => id === rootIndex && ws[j] > 0);
    if (source < 0) continue;
    const destination = ws.findIndex((w, j) => w === 0 && j !== source);
    if (destination < 0) continue; // Keep all existing articulated influences, never discard a joint.
    ids[destination] = old.bones.length + (pos.getX(i) < 0 ? 0 : 1);
    ws[destination] = ws[source] * amount;
    ws[source] *= 1 - amount;
    index.setXYZW(i, ...(ids as [number, number, number, number]));
    weight.setXYZW(i, ...(ws as [number, number, number, number]));
  }
  index.needsUpdate = weight.needsUpdate = true;
  return skeleton;
}
