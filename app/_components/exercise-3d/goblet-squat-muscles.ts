import { BufferAttribute, type BufferGeometry } from "three";
import map from "./goblet-squat-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Individually source-labelled quadriceps, gluteus maximus, adductor magnus, trunk and upper-body stabilizers; categorical illustration only. */
export function createGobletSquatMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Goblet squat mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Goblet squat mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
