import { createSumoDumbbellMuscleMask } from "./sumo-dumbbell-muscles";
import { createDeadliftMuscleMask } from "./deadlift-muscles";
import { BufferAttribute, type BufferGeometry } from "three";
import { createSmithSquatMuscleMask } from "./smith-squat-muscles";
import { createHipAbductionMuscleMask } from "./hip-abduction-muscles";

/** Independent exercise maps share a GPU slot to respect WebGL attribute limits. */
export function createHipMachineMuscleAttribute(geometry: BufferGeometry) {
  const smith = createSmithSquatMuscleMask(geometry);
  const abduction = createHipAbductionMuscleMask(geometry);
  const sumo = createSumoDumbbellMuscleMask(geometry);
  const deadlift = createDeadliftMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(smith.count * 4), 4);
  for (let i = 0; i < smith.count; i++)
    packed.setXYZW(i, smith.getX(i), abduction.getX(i), sumo.getX(i), deadlift.getX(i));
  return packed;
}
