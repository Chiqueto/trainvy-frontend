import { BufferAttribute, type BufferGeometry } from "three";
import map from "./fly-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Independently selected source-labelled muscle surfaces, bound to this asset. */
export function createFlyMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Fly mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Fly mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
