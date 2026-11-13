import { createCableRowMuscleMask } from "./cable-row-muscles";
import { createLatPulldownMuscleMask } from "./lat-pulldown-muscles";
import { BufferAttribute, type BufferGeometry } from "three";
import lower from "./sumo-dumbbell-muscle-map.json";
import upper from "./deadlift-upper-back-map.json";
import calf from "./standing-calf-muscle-map.json";
import arm from "./fly-muscle-map.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createPecDeckMuscleMask } from "./pec-deck-muscles";

// Surface identities are reused, roles are independently reviewed for this lift.
const primary =
  /^(Rectus_femoris_muscle|Vastus_lateralis_muscle|Vastus_medialis_muscle|Vastus_intermedius_muscle|Gluteus_maximus_muscle|Long_head_of_biceps_femoris|Semitendinosus_muscle|Semimembranosus_muscle)[lr]$/;
const secondary =
  /^(Adductor_magnus|Rectus_abdominis_muscle|External_abdominal_oblique_muscle|Iliocostalis_lumborum_muscle|Iliocostalis_thoracis_muscle|Longissimus_thoracis_muscle|Spinalis_thoracis_muscle|Humeral_head_of_flexor_carpi_ulnaris|Humero-ulnar_head_of_flexor_digitorum_superficialis|Flexor_digitorum_profundus|Extensor_carpi_radialis_brevis|Latissimus_dorsi_muscle|Descending_part_of_trapezius_muscle|Transverse_part_of_trapezius_muscle|Ascending_part_of_trapezius_muscle|Soleus_muscle|Medial_head_of_gastrocnemius|Lateral_head_of_gastrocnemius|Clavicular_part_of_deltoid_muscle|Long_head_of_biceps_brachii|Short_head_of_biceps_brachii)[lr]$/;
export function createHangPowerCleanMuscleMask(geometry: BufferGeometry) {
  const values = new Float32Array(geometry.getAttribute("position").count);
  for (const atlas of [lower, upper, calf, arm]) {
    if (atlas.baseAssetSha256 !== manifest.sha256)
      throw new Error("Hang clean atlas does not match athlete");
    for (const s of atlas.selections) {
      const role = primary.test(s.name) ? 1 : secondary.test(s.name) ? 0.45 : 0;
      if (!role) continue;
      for (const i of s.indices) {
        if (i >= values.length)
          throw new Error("Hang clean mask exceeds geometry");
        values[i] = Math.max(values[i], role);
      }
    }
  }
  return new BufferAttribute(values, 1);
}
/** Reuse one GPU attribute slot without conflating exercise classifications. */
export function createPecDeckHangCleanAttribute(geometry: BufferGeometry) {
  const pec = createPecDeckMuscleMask(geometry),
    clean = createHangPowerCleanMuscleMask(geometry), pull = createLatPulldownMuscleMask(geometry), row = createCableRowMuscleMask(geometry);
  const packed = new BufferAttribute(new Float32Array(pec.count * 4), 4);
  for (let i = 0; i < pec.count; i++)
    packed.setXYZW(i, pec.getX(i), clean.getX(i), pull.getX(i), row.getX(i));
  return packed;
}
