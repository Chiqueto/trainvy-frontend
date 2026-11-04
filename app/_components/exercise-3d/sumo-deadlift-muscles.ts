import { BufferAttribute, type BufferGeometry } from "three";
import atlas from "./sumo-dumbbell-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createGobletSquatMuscleMask } from "./goblet-squat-muscles";

// Explicit sumo-deadlift selection. Atlas provides only surface identities,
// never the roles; these roles were reviewed independently for this exercise.
const primary = /^(?:Rectus_femoris_muscle|Vastus_lateralis_muscle|Vastus_medialis_muscle|Vastus_intermedius_muscle|Gluteus_maximus_muscle|Adductor_magnus|Adductor_longus)[lr]$/;
const secondary = /^(?:Long_head_of_biceps_femoris|Semitendinosus_muscle|Semimembranosus_muscle|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis)[lr]$/;

export function createSumoDeadliftMuscleMask(geometry: BufferGeometry) {
  if (atlas.baseAssetSha256 !== manifest.sha256) throw new Error("SumoDeadlift mask does not match athlete asset");
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const surface of atlas.selections) {
    const role = primary.test(surface.name) ? 1 : secondary.test(surface.name) ? 0.45 : 0;
    if (!role) continue;
    for (const index of surface.indices) {
      if (index >= values.length) throw new Error("SumoDeadlift mask exceeds athlete geometry");
      values[index] = role;
    }
  }
  return new BufferAttribute(values, 1);
}

export function createGobletSumoDeadliftAttribute(geometry: BufferGeometry) {
  const goblet = createGobletSquatMuscleMask(geometry);
  const sumo = createSumoDeadliftMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(goblet.count * 2), 2);
  for (let i = 0; i < goblet.count; i++) packed.setXY(i, goblet.getX(i), sumo.getX(i));
  return packed;
}
