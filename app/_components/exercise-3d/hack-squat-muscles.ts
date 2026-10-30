import { BufferAttribute, type BufferGeometry } from "three";
import map from "./hack-squat-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Individually source-labelled quadriceps, gluteus maximus, adductor magnus and trunk stabilizers; categorical illustration only. */
export function createHackSquatMuscleMask(geometry: BufferGeometry) {
  if (map.baseAssetSha256 !== manifest.sha256)
    throw new Error("Hack squat mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of map.selections) {
    for (const i of selection.indices) {
      if (i >= values.length)
        throw new Error("Hack squat mask exceeds athlete geometry");
      values[i] = selection.role;
    }
  }
  return new BufferAttribute(values, 1);
}
