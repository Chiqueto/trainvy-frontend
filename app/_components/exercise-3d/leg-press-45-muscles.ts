import { BufferAttribute, type BufferGeometry } from "three";
import map from "./leg-press-45-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Independently source-labelled leg press extensors and stabilizers; illustrative categories only. */
export function createLegPress45MuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Leg press 45 mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Leg press 45 mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
