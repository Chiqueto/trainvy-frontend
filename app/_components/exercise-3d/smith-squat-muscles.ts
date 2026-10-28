import { BufferAttribute, type BufferGeometry } from "three";

/**
 * Explicit anatomical muscle mask for Smith Machine Squat (Agachamento no Smith).
 * Biomechanically validated (Abelbeck 2002; Schwanbeck 2009):
 * - Primary movers: Quadriceps (vastus lateralis, vastus medialis, rectus femoris) and
 *   Gluteus maximus -> primaryTissue (#bd5148, mask = 1.0).
 * - Secondary / synergists: Adductors (adductor magnus, longus) -> secondaryTissue (#d97d75, mask = 0.45).
 * - Neutral: Remainder of upper and lower anatomy remains neutral (#b5b3ac, mask = 0.0).
 */
export function createSmithSquatMuscleMask(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const tissue = geometry.getAttribute("uv");
  const groups = geometry.getAttribute("_exercisemuscles");
  const values = new Float32Array(position.count);

  for (let i = 0; i < position.count; i++) {
    if (tissue.getY(i) < 0.9) continue;
    if (position.getY(i) > 1.05) continue;

    const x = groups.getX(i);
    if (x > 0.72) {
      // Primary: Quadríceps e Glúteos (ênfase no glúteo máximo)
      values[i] = 1.0;
    } else if (x > 0.15) {
      // Secondary: Adutores da coxa
      values[i] = 0.45;
    }
  }
  return new BufferAttribute(values, 1);
}
