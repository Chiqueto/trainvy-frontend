import { BufferAttribute, type BufferGeometry } from "three";
import { createSmithBenchMuscleMask } from "./smith-bench-muscles";
import back from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import { createBentRowMuscleMask } from "./bent-row-muscles";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
/** Explicit high-row roles: retractors/posterior deltoid primary; lat/teres still participate. */
export function createHighRowMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(createBentRowMuscleMask(geometry).array);
  for (const atlas of [back, detail]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("High-row atlas mismatch");
    for (const selection of atlas.selections) {
      const role =
        /Transverse_part_of_trapezius|Rhomboid|Scapular_spinal_part_of_deltoid/.test(
          selection.name,
        )
          ? 1
          : /Latissimus|Teres_major/.test(selection.name)
            ? 0.45
            : undefined;
      if (role !== undefined)
        for (const i of selection.indices) values[i] = role;
    }
  }
  return new BufferAttribute(values, 1);
}
export function createSmithHighRowAttribute(geometry: BufferGeometry) {
  const old = createSmithBenchMuscleMask(geometry),
    high = createHighRowMuscleMask(geometry), pendlay = createPendlayMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(old.count * 3), 3);
  for (let i = 0; i < old.count; i++)
    packed.setXYZ(i, old.getX(i), high.getX(i), pendlay.getX(i));
  return packed;
}
/** Floor row: extension and scapular retraction both primary; posterior deltoid remains secondary. */
export function createPendlayMuscleMask(geometry: BufferGeometry) {
  const mask=createBentRowMuscleMask(geometry);
  for(const atlas of [back,detail]) {
    if(atlas.baseAssetSha256!==manifest.sha256)throw Error("Pendlay atlas mismatch");
    for(const s of atlas.selections) if(/Transverse_part_of_trapezius|Rhomboid/.test(s.name))for(const i of s.indices)mask.setX(i,1);
  }
  return mask;
}
