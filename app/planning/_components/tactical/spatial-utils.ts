/**
 * Utilitários geométricos e de layout para o Holo-Board 3D (Spatial Canvas).
 * Suporta cálculos de curvas Bezier, portas de energia, snap magnético e auto-layout.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CARD_WIDTH = 236;
export const CARD_HEIGHT = 326;
export const BISET_GAP = 14;
export const MAGNETIC_THRESHOLD = 50;

/**
 * Retorna as portas luminosas de Entrada (IN) e Saída (OUT) de uma carta.
 * IN: Topo central
 * OUT: Base central
 */
export function getCardConnectors(
  x: number,
  y: number,
  isGrouped = false,
): {
  input: Point;
  output: Point;
} {
  const width = isGrouped ? CARD_WIDTH * 2 + BISET_GAP : CARD_WIDTH;
  return {
    input: {
      x: x + width / 2,
      y: y,
    },
    output: {
      x: x + width / 2,
      y: y + CARD_HEIGHT,
    },
  };
}

/**
 * Calcula a curva Bezier cúbica suave conectando a porta OUT da carta anterior
 * até a porta IN da próxima carta.
 */
export function calculateBezierCurve(
  from: Point,
  to: Point,
): {
  path: string;
  midpoint: Point;
} {
  const dy = to.y - from.y;

  // Handles de controle dinâmicos baseados na distância vertical e horizontal
  const verticalBias = Math.max(60, Math.abs(dy) * 0.5);
  const cp1x = from.x;
  const cp1y = from.y + verticalBias;
  const cp2x = to.x;
  const cp2y = to.y - verticalBias;

  const path = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;

  // Ponto médio da curva cúbica no parâmetro t = 0.5
  // B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
  const midX = 0.125 * from.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * to.x;
  const midY = 0.125 * from.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * to.y;

  return {
    path,
    midpoint: { x: midX, y: midY },
  };
}

/**
 * Distância Euclidiana entre dois pontos.
 */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Verifica se a carta arrastada está suficientemente próxima de outra
 * para ativar a Fusão Magnética (Bi-Set Dock).
 */
export function checkMagneticFusion(
  dragPos: Point,
  targetPos: Point,
  threshold: number = MAGNETIC_THRESHOLD,
): boolean {
  // Proximidade lateral e vertical
  const lateralDist = Math.abs(
    dragPos.x - (targetPos.x + CARD_WIDTH + BISET_GAP / 2),
  );
  const verticalDist = Math.abs(dragPos.y - targetPos.y);

  // Também aceita se sobrepor quase diretamente o centro
  const centerDist = distance(
    { x: dragPos.x + CARD_WIDTH / 2, y: dragPos.y + CARD_HEIGHT / 2 },
    { x: targetPos.x + CARD_WIDTH / 2, y: targetPos.y + CARD_HEIGHT / 2 },
  );

  return (
    (lateralDist < threshold && verticalDist < threshold * 1.5) ||
    centerDist < threshold * 1.2
  );
}

/**
 * Gera a formação tática inicial automática (Arco Holográfico ou Zigue-Zague).
 * Centraliza as cartas no espaço visível da mesa tática.
 */
export function generateTacticalFormation(
  count: number,
  canvasWidth = 1400,
  canvasHeight = 900,
): Point[] {
  if (count <= 0) return [];

  const points: Point[] = [];
  const columns = Math.max(
    1,
    Math.min(4, Math.floor((canvasWidth - 72) / (CARD_WIDTH + 140))),
  );
  const cols = canvasWidth < 640 ? count : Math.min(count, columns);
  const spacingX = CARD_WIDTH + 140;
  const startX =
    canvasWidth < 640
      ? (canvasWidth - CARD_WIDTH) / 2
      : Math.max(32, (canvasWidth - ((cols - 1) * spacingX + CARD_WIDTH)) / 2);
  const startY =
    canvasWidth < 640
      ? 205
      : Math.max(205, Math.min(240, (canvasHeight - CARD_HEIGHT) / 2));
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const column = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    const norm = cols === 1 ? 0 : (column / (cols - 1)) * 2 - 1;
    points.push({
      x: Math.round(startX + column * spacingX),
      y: Math.round(startY + row * (CARD_HEIGHT + 95) - (1 - norm * norm) * 24),
    });
  }
  return points;
}

/** Inverse of the canvas perspective, scale and tilt, for pointer coordinates. */
export function screenToBoard(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
  camera: { panX: number; panY: number; zoom: number; tilt: number },
): Point {
  const x = point.x - rect.left - rect.width / 2;
  const y = point.y - rect.top - rect.height / 2;
  const angle = (camera.tilt * Math.PI) / 180;
  const localY =
    (y - camera.panY) /
    (camera.zoom * (Math.cos(angle) + (y * Math.sin(angle)) / 1200));
  const perspective = 1 - (camera.zoom * Math.sin(angle) * localY) / 1200;
  return {
    x: (x * perspective - camera.panX) / camera.zoom + rect.width / 2,
    y: localY + rect.height / 2,
  };
}
