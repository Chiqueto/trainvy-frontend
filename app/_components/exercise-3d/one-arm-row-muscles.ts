import { BufferAttribute, type BufferGeometry } from "three";
import back from "./deadlift-upper-back-map.json";
import detail from "./lat-pulldown-detail-map.json";
import arms from "./fly-muscle-map.json";
import lower from "./sumo-dumbbell-muscle-map.json";
import support from "./one-arm-row-support-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createFlyMachineBentRowAttribute } from "./bent-row-muscles";
const primary =
  /^(Latissimus_dorsi_muscle|Teres_major_muscle|Transverse_part_of_trapezius_muscle|Rhomboid_major_muscle|Rhomboid_minor_muscle)[lr]$/;
const secondary =
  /^(Ascending_part_of_trapezius_muscle|Descending_part_of_trapezius_muscle|Infraspinatus_muscle|Scapular_spinal_part_of_deltoid_muscle|Brachialis_muscle|Brachioradialis_muscle|Long_head_of_biceps_brachii|Short_head_of_biceps_brachii|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis|Gluteus_maximus_muscle|Gluteus_medius_muscle|Long_head_of_biceps_femoris|Semitendinosus_muscle|Semimembranosus_muscle|Rectus_femoris_muscle|Vastus_lateralis_muscle|Vastus_medialis_muscle|Vastus_intermedius_muscle)[lr]$/;
const supportOnly =
  /pectoralis_major|Clavicular_part_of_deltoid|head_of_triceps_brachii/;
export function createOneArmRowMuscleMask(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position"),
    values = new Float32Array(position.count);
  for (const atlas of [back, detail, arms, lower, support]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("One-arm row atlas mismatch");
    for (const s of atlas.selections) {
      // Source left/right labels do not correspond to rig suffixes: use verified rest-space side.
      const active =
        s.indices.reduce((sum, i) => sum + position.getX(i), 0) /
          s.indices.length >
        0;
      const role = primary.test(s.name)
        ? active
          ? 1
          : 0.45
        : secondary.test(s.name) || (!active && supportOnly.test(s.name))
          ? 0.45
          : 0;
      if (!role) continue;
      for (const i of s.indices) {
        if (i >= values.length) throw Error("One-arm mask exceeds geometry");
        values[i] = Math.max(values[i], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
export function createPackedRowAttribute(geometry: BufferGeometry) {
  const old = createFlyMachineBentRowAttribute(geometry),
    one = createOneArmRowMuscleMask(geometry),
    packed = new BufferAttribute(new Float32Array(old.count * 4), 4);
  for (let i = 0; i < old.count; i++)
    packed.setXYZW(i, old.getX(i), old.getY(i), old.getZ(i), one.getX(i));
  return packed;
}
