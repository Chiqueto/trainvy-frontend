import { createHipThrustMuscleMask } from "./hip-thrust-muscles";
import { BufferAttribute, type BufferGeometry } from "three";
import { createLegExtensionMuscleMask } from "./leg-extension-muscles";
import { createSeatedLegCurlMuscleMask } from "./seated-leg-curl-muscles";
import { createStiffMuscleMask } from "./stiff-muscles";

/** Independent selections share a GPU slot, not an anatomical classification. */
export function createLegDetailMuscleAttribute(geometry: BufferGeometry) {
  const extension = createLegExtensionMuscleMask(geometry);
  const curl = createSeatedLegCurlMuscleMask(geometry);
  const stiff = createStiffMuscleMask(geometry);
  const hip = createHipThrustMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(extension.count * 4), 4);
  for (let i = 0; i < extension.count; i++)
    packed.setXYZW(
      i,
      extension.getX(i),
      curl.getX(i),
      stiff.getX(i),
      hip.getX(i),
    );
  return packed;
}
