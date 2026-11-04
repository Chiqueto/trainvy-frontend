import { BufferAttribute, type BufferGeometry } from "three";
import calf from "./standing-calf-muscle-map.json";
import horizontal from "./horizontal-leg-press-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Categorical anatomical roles; no EMG or intensity is measured. */
export function createStandingCalfMuscleMask(geometry: BufferGeometry) {
  if (calf.baseAssetSha256 !== manifest.sha256 || horizontal.baseAssetSha256 !== manifest.sha256) throw new Error("Calf mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const selection of calf.selections) for (const index of selection.indices) {
    if (index >= values.length) throw new Error("Calf mask exceeds athlete geometry");
    values[index] = selection.role;
  }
  for (const selection of horizontal.selections.filter(s=>/^Tibialis_anterior_muscle[lr]$/.test(s.name))) for (const index of selection.indices) {
    if (index >= values.length) throw new Error("Tibialis mask exceeds athlete geometry");
    values[index] = Math.max(values[index], 0.45);
  }
  return new BufferAttribute(values, 1);
}
