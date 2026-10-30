import { BufferAttribute, type BufferGeometry } from "three";
import map from "./seated-leg-curl-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Source-labelled hamstrings, gastrocnemius, sartorius and gracilis; categorical illustration only. */
export function createSeatedLegCurlMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Seated leg curl mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Seated leg curl mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
