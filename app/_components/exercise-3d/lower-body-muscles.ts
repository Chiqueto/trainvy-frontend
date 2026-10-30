import { BufferAttribute, type BufferGeometry } from "three";
import { createProneLegCurlMuscleMask } from "./prone-leg-curl-muscles";
import { createHackSquatMuscleMask } from "./hack-squat-muscles";
import { createLegPress45MuscleMask } from "./leg-press-45-muscles";
import { createHorizontalLegPressMuscleMask } from "./horizontal-leg-press-muscles";

/** Independent maps occupy x/y/z/w of one GPU attribute, within WebGL limits. */
export function createLowerBodyMuscleAttribute(geometry: BufferGeometry) {
  const masks = [
    createProneLegCurlMuscleMask(geometry),
    createHackSquatMuscleMask(geometry),
    createLegPress45MuscleMask(geometry),
    createHorizontalLegPressMuscleMask(geometry),
  ];
  const count = geometry.getAttribute("position").count;
  const packed = new BufferAttribute(new Float32Array(count * 4), 4);
  for (let i = 0; i < count; i++)
    packed.setXYZW(
      i,
      masks[0].getX(i),
      masks[1].getX(i),
      masks[2].getX(i),
      masks[3].getX(i),
    );
  return packed;
}
