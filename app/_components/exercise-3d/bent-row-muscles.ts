import { addScapularSynergists } from "./scapular-muscles";
import { BufferAttribute, type BufferGeometry } from "three";
import back from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import arms from "./fly-muscle-map.json";
import lower from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createFlyMachineRowAttribute } from "./machine-row-muscles";
const primary =
  /^(Latissimus_dorsi_muscle|Teres_major_muscle|Transverse_part_of_trapezius_muscle|Rhomboid_major_muscle|Rhomboid_minor_muscle)[lr]$/;
const secondary =
  /^(Ascending_part_of_trapezius_muscle|Descending_part_of_trapezius_muscle|Infraspinatus_muscle|Scapular_spinal_part_of_deltoid_muscle|Brachialis_muscle|Brachioradialis_muscle|Long_head_of_biceps_brachii|Short_head_of_biceps_brachii|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis|Gluteus_maximus_muscle|Gluteus_medius_muscle|Long_head_of_biceps_femoris|Semitendinosus_muscle|Semimembranosus_muscle|Rectus_femoris_muscle|Vastus_lateralis_muscle|Vastus_medialis_muscle|Vastus_intermedius_muscle)[lr]$/;
export function createBentRowMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const atlas of [back, detail, arms, lower]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("Bent row atlas mismatch");
    for (const s of atlas.selections) {
      const role = primary.test(s.name) ? 1 : secondary.test(s.name) ? 0.45 : 0;
      if (!role) continue;
      for (const i of s.indices) {
        if (i >= values.length) throw Error("Bent row mask exceeds geometry");
        values[i] = Math.max(values[i], role);
      }
    }
  }
  return addScapularSynergists(geometry, new BufferAttribute(values, 1));
}
export function createFlyMachineBentRowAttribute(geometry: BufferGeometry) {
  const old = createFlyMachineRowAttribute(geometry),
    row = createBentRowMuscleMask(geometry),
    packed = new BufferAttribute(new Float32Array(old.count * 3), 3);
  for (let i = 0; i < old.count; i++)
    packed.setXYZ(i, old.getX(i), old.getY(i), row.getX(i));
  return packed;
}
