import { BufferAttribute, type BufferGeometry } from "three";
import arms from "./fly-muscle-map.json";
import cuff from "./lat-pulldown-detail-map.json";
import shoulder from "./upper-shoulder-detail-map.json";
import triceps from "./one-arm-row-support-map.json";
import back from "./deadlift-upper-back-map.json";
import scapula from "./scapular-detail-map.json";
import support from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import type { UpperExercise } from "./upper-exercise-types";

const anterior = "Clavicular_part_of_deltoid_muscle",
  lateral = "Acromial_part_of_deltoid_muscle";
const biceps = [
  "Long_head_of_biceps_brachii",
  "Short_head_of_biceps_brachii",
  "Brachialis_muscle",
];
const forearm = [
  "Brachioradialis_muscle",
  "Humeral_head_of_flexor_carpi_ulnaris",
  "Humero-ulnar_head_of_flexor_digitorum_superficialis",
  "Extensor_carpi_radialis_brevis",
];
const trunk = [
  "Rectus_abdominis_muscle",
  "External_abdominal_oblique_muscle",
  "Longissimus_thoracis_muscle",
];
const stabilizers = [
  "Scapular_spinal_part_of_deltoid_muscle",
  "Infraspinatus_muscle",
  "Teres_minor_muscle",
  "Ascending_part_of_trapezius_muscle",
  "Descending_part_of_trapezius_muscle",
  "Transverse_part_of_trapezius_muscle",
  "Serratus_anterior_muscle",
];
const extensors = [
  "Lateral_head_of_triceps_brachii",
  "Long_head_of_triceps_brachii",
  "Medial_head_of_triceps_brachii",
];
const pec = [
  "Clavicular_head_of_pectoralis_major_muscle",
  "Sternocostal_head_of_pectoralis_major_muscle",
];
// Explicit decisions per movement, not inherited mask values from another exercise.
export const UPPER_MUSCLE_ROLES: Record<
  UpperExercise,
  { primary: readonly string[]; secondary: readonly string[] }
> = {
  "military-press": {
    primary: [anterior, lateral],
    secondary: [
      ...stabilizers,
      ...extensors,
      ...pec,
      ...forearm.slice(1),
      ...trunk,
    ],
  },
  "dumbbell-shoulder-press": {
    primary: [anterior, lateral],
    secondary: [
      ...stabilizers,
      ...extensors,
      ...pec,
      ...forearm.slice(1),
      ...trunk,
    ],
  },
  "lateral-raise": {
    primary: [lateral],
    secondary: [
      anterior,
      ...stabilizers,
      ...extensors,
      ...forearm.slice(1),
      ...trunk,
    ],
  },
  "barbell-curl": {
    primary: biceps,
    secondary: [anterior, ...forearm, ...trunk],
  },
  "legacy-barbell-curl": {
    primary: biceps,
    secondary: [anterior, ...forearm, ...trunk],
  },
  "rope-pushdown": {
    primary: extensors,
    secondary: forearm.slice(1),
  },
  "skull-crusher": {
    primary: extensors,
    secondary: [anterior, ...forearm.slice(1)],
  },
  "straight-bar-pushdown": {
    primary: extensors,
    secondary: [...forearm.slice(1), ...trunk],
  },
  "decline-dumbbell-press": {
    primary: pec,
    secondary: [anterior, ...extensors, ...biceps.slice(0, 2), ...forearm.slice(1)],
  },
  "incline-smith-press": {
    primary: pec,
    secondary: [anterior, ...extensors, ...forearm.slice(1)],
  },
  "decline-smith-press": {
    primary: pec,
    secondary: [anterior, ...extensors, ...forearm.slice(1)],
  },
  "preacher-curl": {
    primary: biceps,
    secondary: forearm,
  },
  "hammer-curl": {
    primary: [...biceps, "Brachioradialis_muscle"],
    secondary: [anterior, ...forearm.slice(1), ...trunk],
  },
};
export function createUpperExerciseMuscleMask(
  geometry: BufferGeometry,
  exercise: UpperExercise,
) {
  const values = new Float32Array(geometry.getAttribute("position").count),
    roles = UPPER_MUSCLE_ROLES[exercise];
  for (const atlas of [arms, cuff, shoulder, triceps, back, scapula, support]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw Error("Upper exercise atlas checksum mismatch");
    for (const s of atlas.selections) {
      const name = s.name.replace(/[lr]$/, ""),
        role = roles.primary.includes(name)
          ? 1
          : roles.secondary.includes(name)
            ? 0.45
            : 0;
      if (!role) continue;
      for (const i of s.indices) {
        if (i >= values.length)
          throw Error("Upper exercise selection outside atlas");
        values[i] = Math.max(values[i], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
