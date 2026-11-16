import type { BufferAttribute, BufferGeometry } from "three";
import map from "./scapular-detail-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
export function addScapularSynergists(
  geometry: BufferGeometry,
  mask: BufferAttribute,
) {
  if (
    map.baseAssetSha256 !== manifest.sha256 ||
    geometry.getAttribute("position").count !== mask.count
  )
    throw Error("Scapular synergist atlas mismatch");
  for (const selection of map.selections)
    for (const i of selection.indices)
      mask.setX(i, Math.max(mask.getX(i), 0.45));
  return mask;
}
