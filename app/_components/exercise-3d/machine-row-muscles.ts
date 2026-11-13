import { BufferAttribute, type BufferGeometry } from "three";
import back from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import arms from "./fly-muscle-map.json";
import trunk from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createFlyMuscleMask } from "./fly-muscles";
// Reviewed for this supported neutral lever row. Shared identities do not assign roles.
const primary =
  /^(Latissimus_dorsi_muscle|Teres_major_muscle|Transverse_part_of_trapezius_muscle|Rhomboid_major_muscle|Rhomboid_minor_muscle)[lr]$/;
const secondary =
  /^(Ascending_part_of_trapezius_muscle|Descending_part_of_trapezius_muscle|Infraspinatus_muscle|Scapular_spinal_part_of_deltoid_muscle|Brachialis_muscle|Brachioradialis_muscle|Long_head_of_biceps_brachii|Short_head_of_biceps_brachii|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis)[lr]$/;
export function createMachineRowMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const atlas of [back, detail, arms, trunk]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("Machine row atlas does not match athlete");
    for (const surface of atlas.selections) {
      const role = primary.test(surface.name)
        ? 1
        : secondary.test(surface.name)
          ? 0.45
          : 0;
      if (!role) continue;
      for (const i of surface.indices) {
        if (i >= values.length)
          throw Error("Machine row mask exceeds geometry");
        values[i] = Math.max(values[i], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
/** Keep one GPU slot: original fly in X, independently reviewed machine row in Y. */
export function createFlyMachineRowAttribute(geometry: BufferGeometry) {
  const fly = createFlyMuscleMask(geometry),
    row = createMachineRowMuscleMask(geometry),
    packed = new BufferAttribute(new Float32Array(fly.count * 2), 2);
  for (let i = 0; i < fly.count; i++) packed.setXY(i, fly.getX(i), row.getX(i));
  return packed;
}
