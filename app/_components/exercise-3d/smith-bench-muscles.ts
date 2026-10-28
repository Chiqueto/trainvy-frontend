import { BufferAttribute, type BufferGeometry } from "three";

/**
 * Mapeamento muscular explícito para o Supino Reto no Smith.
 * Fundamentado em literatura de EMG e cinesiologia (Schick et al., 2010; Saeterbakken et al., 2011):
 * - Motor primário: Peitoral maior (porções esternocostal e clavicular) -> primaryTissue (1.0)
 * - Sinergistas / Secundários: Tríceps braquial e Deltoide anterior -> secondaryTissue (0.45)
 * - Músculos neutros: Deltoide medial (ativação reduzida no Smith pela estabilização da guia linear),
 *   bíceps braquial (ausência de demanda de estabilização multidirecional), grande dorsal, pernas e core -> neutralTissue (0.0).
 * Valores são categorias ilustrativas de renderização, nunca medição contínua de EMG ou esforço.
 */
export function createSmithBenchMuscleMask(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const tissue = geometry.getAttribute("uv");
  const groups = geometry.getAttribute("_exercisemuscles");
  const values = new Float32Array(position.count);

  for (let i = 0; i < position.count; i++) {
    if (tissue.getY(i) < 0.9) continue;

    if (groups.getY(i) > 0.72) {
      // Peitoral maior (motor primário)
      values[i] = 1.0;
    } else if (groups.getY(i) > 0.15) {
      // Deltoide anterior e Tríceps braquial (sinergistas da extensão de cotovelo e flexão de ombro)
      values[i] = 0.45;
    }
  }

  return new BufferAttribute(values, 1);
}
