import { BufferAttribute, type BufferGeometry } from "three";
import arms from "./fly-muscle-map.json";
import cuff from "./lat-pulldown-detail-map.json";
import shoulder from "./upper-shoulder-detail-map.json";
import triceps from "./one-arm-row-support-map.json";
import back from "./deadlift-upper-back-map.json";
import scapula from "./scapular-detail-map.json";
import support from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

const KNEELING_PUSH_UP_PRIMARY = [
  "Clavicular_head_of_pectoralis_major_muscle",
  "Sternocostal_head_of_pectoralis_major_muscle",
] as const;

const KNEELING_PUSH_UP_SECONDARY = [
  "Lateral_head_of_triceps_brachii",
  "Long_head_of_triceps_brachii",
  "Medial_head_of_triceps_brachii",
  "Clavicular_part_of_deltoid_muscle",
  "Serratus_anterior_muscle",
  "Rectus_abdominis_muscle",
  "External_abdominal_oblique_muscle",
  "Longissimus_thoracis_muscle",
  "Humeral_head_of_flexor_carpi_ulnaris",
  "Humero-ulnar_head_of_flexor_digitorum_superficialis",
  "Extensor_carpi_radialis_brevis",
] as const;

export function createKneelingPushUpMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(geometry.getAttribute("position").count);
  const primarySet = new Set<string>(KNEELING_PUSH_UP_PRIMARY);
  const secondarySet = new Set<string>(KNEELING_PUSH_UP_SECONDARY);
  for (const atlas of [arms, cuff, shoulder, triceps, back, scapula, support]) {
    if (atlas.baseAssetSha256 !== manifest.sha256) {
      throw Error("Kneeling push-up atlas checksum mismatch");
    }
    for (const selection of atlas.selections) {
      const name = selection.name.replace(/[lr]$/, "");
      const role = primarySet.has(name) ? 1 : secondarySet.has(name) ? 0.45 : 0;
      if (!role) continue;
      for (const index of selection.indices) {
        if (index >= values.length) {
          throw Error("Kneeling push-up selection outside atlas");
        }
        values[index] = Math.max(values[index], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
