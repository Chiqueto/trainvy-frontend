import { BufferAttribute, type BufferGeometry } from "three";
import upper from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import arms from "./fly-muscle-map.json";
import trunk from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

// Source surface identities only: the classification is specific to this pulldown.
const primary = /^(Latissimus_dorsi_muscle|Teres_major_muscle)[lr]$/;
const secondary =
  /^(Ascending_part_of_trapezius_muscle|Transverse_part_of_trapezius_muscle|Descending_part_of_trapezius_muscle|Rhomboid_major_muscle|Rhomboid_minor_muscle|Infraspinatus_muscle|Scapular_spinal_part_of_deltoid_muscle|Brachialis_muscle|Brachioradialis_muscle|Long_head_of_biceps_brachii|Short_head_of_biceps_brachii|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis)[lr]$/;

export function createLatPulldownMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const atlas of [upper, detail, arms, trunk]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw new Error("Pulldown atlas does not match athlete");
    for (const surface of atlas.selections) {
      const role = primary.test(surface.name)
        ? 1
        : secondary.test(surface.name)
          ? 0.45
          : 0;
      if (!role) continue;
      for (const index of surface.indices) {
        if (index >= values.length)
          throw new Error("Pulldown mask exceeds geometry");
        values[index] = Math.max(values[index], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
