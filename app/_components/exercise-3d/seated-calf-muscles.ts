import { BufferAttribute, type BufferGeometry } from "three";
import atlas from "./standing-calf-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Reuses verified surface identities, with roles reviewed for bent-knee plantarflexion. */
export function createSeatedCalfMuscleMask(geometry: BufferGeometry) {
  if (atlas.baseAssetSha256 !== manifest.sha256)
    throw new Error("Seated calf atlas does not match athlete");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const surface of atlas.selections) {
    const role = /^Soleus_muscle[lr]$/.test(surface.name)
      ? 1
      : /^(Medial|Lateral)_head_of_gastrocnemius[lr]$/.test(surface.name)
        ? 0.45
        : 0;
    if (!role) continue;
    for (const index of surface.indices) {
      if (index >= values.length)
        throw new Error("Seated calf mask exceeds geometry");
      values[index] = role;
    }
  }
  return new BufferAttribute(values, 1);
}
