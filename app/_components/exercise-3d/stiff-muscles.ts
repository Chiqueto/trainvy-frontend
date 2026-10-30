import { BufferAttribute, type BufferGeometry } from "three";
import map from "./stiff-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Explicit hip extensors and trunk/grip stabilizers; categorical illustration only. */
export function createStiffMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Stiff mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Stiff mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
