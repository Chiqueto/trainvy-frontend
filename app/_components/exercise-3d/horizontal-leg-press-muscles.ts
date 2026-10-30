import { BufferAttribute, type BufferGeometry } from "three";
import map from "./horizontal-leg-press-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Independently source-labelled leg press extensors and stabilizers; illustrative categories only. */
export function createHorizontalLegPressMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Horizontal leg press mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Horizontal leg press mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
