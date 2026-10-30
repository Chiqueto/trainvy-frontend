import { BufferAttribute, type BufferGeometry } from "three";
import { createLegExtensionMuscleMask } from "./leg-extension-muscles";
import { createSeatedLegCurlMuscleMask } from "./seated-leg-curl-muscles";
import { createStiffMuscleMask } from "./stiff-muscles";

/** Independent selections share a GPU slot, not an anatomical classification. */
export function createLegDetailMuscleAttribute(geometry: BufferGeometry) {
  const extension = createLegExtensionMuscleMask(geometry);
  const curl = createSeatedLegCurlMuscleMask(geometry);
  const stiff = createStiffMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(extension.count * 3), 3);
  for (let i = 0; i < extension.count; i++)
    packed.setXYZ(i, extension.getX(i), curl.getX(i), stiff.getX(i));
  return packed;
}
