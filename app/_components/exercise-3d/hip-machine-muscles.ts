import { createSumoDumbbellMuscleMask } from "./sumo-dumbbell-muscles";
import { BufferAttribute, type BufferGeometry } from "three";
import { createSmithSquatMuscleMask } from "./smith-squat-muscles";
import { createHipAbductionMuscleMask } from "./hip-abduction-muscles";

/** Independent exercise maps share a GPU slot to respect WebGL attribute limits. */
export function createHipMachineMuscleAttribute(geometry: BufferGeometry) {
  const smith = createSmithSquatMuscleMask(geometry);
  const abduction = createHipAbductionMuscleMask(geometry);
  const sumo = createSumoDumbbellMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(smith.count * 3), 3);
  for (let i = 0; i < smith.count; i++)
    packed.setXYZ(i, smith.getX(i), abduction.getX(i), sumo.getX(i));
  return packed;
}
